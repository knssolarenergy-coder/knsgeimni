package com.kssolar.trackingwatchdog

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.util.Log
import androidx.work.Data
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.gms.tasks.Tasks
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * Keep-alive watchdog for the expo-location background tracking task.
 *
 * Problem: on Tecno/HiOS (and similar OEM ROMs) swiping the app from recents or
 * swiping the persistent "Location Active" notification kills the app process,
 * and tracking only comes back when the technician manually reopens the app.
 *
 * Design (v2 — "native ping only"): while the app process is dead, every
 * ~2-minute alarm pass grabs a GPS fix natively (fused provider) and POSTs it
 * to the server with a stored bearer token. That is the ENTIRE continuity
 * story. The full tracking stack (expo-location foreground service + JS upload
 * pipeline) is restored ONLY when the technician reopens the app — the JS side
 * re-arms everything on every app foreground.
 *
 * The previous design additionally tried a headless "full revival": it forced
 * expo-location's AppForegroundedSingleton foreground gate open via reflection
 * and constructed expo.modules.taskManager.TaskService so the persisted task
 * registration restarted the foreground service + notification without any UI.
 * That was REMOVED deliberately — it was the source of the repeated
 * "K&S Solar Energy isn't responding" ANR dialogs (visible even over other
 * apps):
 *  - startForegroundService() in a cold headless process frequently blew the
 *    ~5s startForeground() window (main thread busy with process spawn /
 *    headless RN boot) -> "did not then call Service.startForeground()" ANR.
 *  - Restored location updates triggered expo-task-manager's HeadlessAppLoader,
 *    which boots the full RN/Hermes app on the main thread of a killed process;
 *    the next 2-min alarm broadcast then queued behind that boot -> broadcast
 *    timeout ANR. (And per field testing the headless JS pipeline delivered
 *    ZERO uploads on HiOS anyway, so revival added no data value.)
 * Do NOT reintroduce headless TaskService construction / FGS starts here.
 *
 * Hard limits (Android design, no app can beat them):
 * - "Force stop" from system settings cancels alarms + jobs; nothing runs
 *   until the app is manually reopened.
 * - In deep Doze, even setExactAndAllowWhileIdle is throttled to roughly one
 *   alarm per ~9 minutes — worst-case ping gap.
 */
object WatchdogCore {
  private const val TAG = "KSTrackingWatchdog"
  private const val PREFS_NAME = "KSTrackingWatchdog"
  private const val KEY_ENABLED = "enabled"
  private const val KEY_LAST_RUN_TS = "lastRunTs"
  private const val KEY_LAST_RUN_SOURCE = "lastRunSource"
  private const val KEY_LAST_REVIVAL_TS = "lastRevivalTs"
  private const val KEY_LAST_ERROR = "lastError"

  // Native upload fallback. Revival restores the foreground service, but the
  // actual server upload lives in the JS task handler — and the headless JS
  // boot (expo-task-manager HeadlessAppLoader) proved unreliable on HiOS:
  // notification came back, ZERO uploads reached the server. So the JS side
  // hands us an auth token + upload URL when arming, the JS task handler
  // reports a heartbeat on every fix, and whenever that heartbeat goes stale
  // (JS dead) each watchdog pass natively grabs a fix and POSTs it itself.
  private const val KEY_AUTH_TOKEN = "authToken"
  private const val KEY_UPLOAD_URL = "uploadUrl"
  private const val KEY_JS_HEARTBEAT_TS = "jsHeartbeatTs"
  private const val KEY_LAST_NATIVE_POST_TS = "lastNativePostTs"
  private const val KEY_LAST_NATIVE_POST_OK = "lastNativePostOk"
  private const val KEY_LAST_NATIVE_POST_ERROR = "lastNativePostError"

  // JS posts every 60s while alive; >3 min of silence = 3 missed cycles = the
  // JS engine is dead and the native fallback must take over.
  private const val JS_STALE_MS = 3L * 60L * 1000L

  // A last-known fix younger than this is fresh enough to upload as-is (the
  // revived foreground service keeps GPS warm at a 60s cadence).
  private const val LAST_FIX_FRESH_MS = 2L * 60L * 1000L

  private const val PASS_WORK_NAME = "ks-tracking-watchdog-pass"

  // ~2-minute revival target. setExactAndAllowWhileIdle is one-shot, so every
  // pass schedules the next alarm (self-chaining).
  private const val INTERVAL_MS = 2L * 60L * 1000L
  private const val ALARM_REQUEST_CODE = 470_012

  private const val WORK_NAME = "ks-tracking-watchdog"

  // expo-task-manager persists registrations here; when no entry mentions our
  // task, the user is logged out / tracking was never started — nothing to revive.
  private const val TASK_MANAGER_PREFS = "TaskManagerModule"
  private const val LOCATION_TASK_NAME = "ks-solar-bg-location"

  // True once app/module code has run in this process. When a watchdog pass
  // finds it false, the process was spawned by the alarm/worker/boot receiver
  // itself — i.e. the app had been killed and this pass is an actual revival.
  @Volatile private var processAlreadySeen = false

  private fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)

  fun canScheduleExactAlarms(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return false
    return am.canScheduleExactAlarms()
  }

  /**
   * Called from JS while the app is running — marks the process as seen so
   * in-app alarm passes are never miscounted as revivals, then (re)arms or
   * disarms the alarm chain + worker. Re-arming on every app foreground is
   * intentional self-healing: it restores the chain if the OEM cleared it.
   */
  fun setEnabledFromApp(context: Context, enabled: Boolean) {
    processAlreadySeen = true
    val app = context.applicationContext
    prefs(app).edit().putBoolean(KEY_ENABLED, enabled).apply()
    if (enabled) {
      scheduleNextAlarm(app)
      scheduleWorker(app)
    } else {
      cancelAlarm(app)
      cancelWorker(app)
      // Disarm = logout: drop the upload credentials so the native fallback
      // can never post for a logged-out technician, even if JS forgets to
      // clear the config explicitly.
      prefs(app).edit()
        .remove(KEY_AUTH_TOKEN)
        .remove(KEY_UPLOAD_URL)
        .remove(KEY_JS_HEARTBEAT_TS)
        .commit()
    }
  }

  /**
   * Store (or clear, when either value is null/blank) the credentials the
   * native upload fallback needs. Called from JS on every successful tracking
   * start, so the token stays fresh within its 30-day expiry window.
   */
  fun setConfigFromApp(context: Context, authToken: String?, uploadUrl: String?) {
    processAlreadySeen = true
    val e = prefs(context.applicationContext).edit()
    if (authToken.isNullOrBlank() || uploadUrl.isNullOrBlank()) {
      e.remove(KEY_AUTH_TOKEN).remove(KEY_UPLOAD_URL)
    } else {
      e.putString(KEY_AUTH_TOKEN, authToken).putString(KEY_UPLOAD_URL, uploadUrl)
    }
    e.apply()
  }

  /**
   * Called by the JS background task handler on every location fix. A fresh
   * heartbeat tells the watchdog the JS upload pipeline is alive, so the
   * native fallback stands down.
   */
  fun notifyJsAlive(context: Context) {
    processAlreadySeen = true
    prefs(context.applicationContext).edit()
      .putLong(KEY_JS_HEARTBEAT_TS, System.currentTimeMillis())
      .apply()
  }

  fun getStatus(context: Context): Map<String, Any?> {
    val p = prefs(context)
    return mapOf(
      "enabled" to p.getBoolean(KEY_ENABLED, false),
      "canScheduleExactAlarms" to canScheduleExactAlarms(context),
      "lastRunTs" to p.getLong(KEY_LAST_RUN_TS, 0L).toDouble(),
      "lastRunSource" to p.getString(KEY_LAST_RUN_SOURCE, null),
      "lastRevivalTs" to p.getLong(KEY_LAST_REVIVAL_TS, 0L).toDouble(),
      "lastError" to p.getString(KEY_LAST_ERROR, null),
      "configPresent" to (!p.getString(KEY_AUTH_TOKEN, null).isNullOrBlank() &&
        !p.getString(KEY_UPLOAD_URL, null).isNullOrBlank()),
      "jsHeartbeatTs" to p.getLong(KEY_JS_HEARTBEAT_TS, 0L).toDouble(),
      "lastNativePostTs" to p.getLong(KEY_LAST_NATIVE_POST_TS, 0L).toDouble(),
      "lastNativePostOk" to p.getBoolean(KEY_LAST_NATIVE_POST_OK, false),
      "lastNativePostError" to p.getString(KEY_LAST_NATIVE_POST_ERROR, null)
    )
  }

  /**
   * Hand a watchdog pass to WorkManager so it runs on a background thread.
   * The alarm/boot receivers MUST NOT run the pass inline: onReceive executes
   * on the main thread with a ~10s ANR budget, and a cold-process revival
   * (classloading + reflection + Play services binder + foreground-service
   * start) can blow past it on slow OEM devices — that is exactly the
   * "K&S Solar Energy isn't responding" dialog. Receivers only re-arm the
   * alarm chain (fast) and enqueue this job.
   */
  fun enqueueWatchdogPass(context: Context, source: String) {
    try {
      val builder = OneTimeWorkRequestBuilder<WatchdogPassWorker>()
        .setInputData(Data.Builder().putString(WatchdogPassWorker.KEY_SOURCE, source).build())
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        // Expedited work runs promptly even in light Doze on S+ (no
        // getForegroundInfo needed there). On older Androids plain one-shot
        // work is used because expedited-as-FGS would need a notification.
        builder.setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
      }
      WorkManager.getInstance(context.applicationContext)
        .enqueueUniqueWork(PASS_WORK_NAME, ExistingWorkPolicy.KEEP, builder.build())
    } catch (t: Throwable) {
      Log.w(TAG, "Failed to enqueue watchdog pass", t)
    }
  }

  /**
   * One watchdog pass: record diagnostics, chain the next exact alarm, and —
   * if the JS upload pipeline is dead — upload a fix natively. MUST be called
   * from a background thread (WatchdogPassWorker or the 15-min periodic
   * worker) — the native ping can block for many seconds.
   *
   * Deliberately does NOT try to restore the tracking task / foreground
   * service headlessly — that caused repeated background ANR dialogs (see the
   * class comment). The full stack comes back when the app is reopened.
   */
  fun runWatchdogPass(context: Context, source: String) {
    val app = context.applicationContext
    val wasFresh = !processAlreadySeen
    processAlreadySeen = true
    // commit(), not apply(): a receiver-spawned process can be torn down right
    // after onReceive returns, and diagnostics must survive that.
    prefs(app).edit()
      .putLong(KEY_LAST_RUN_TS, System.currentTimeMillis())
      .putString(KEY_LAST_RUN_SOURCE, source)
      .commit()
    if (!hasPersistedTrackingTask(app)) {
      recordError(app, "No persisted tracking task (logged out or tracking never started)")
    } else {
      // A fresh-process pass means the app had been killed and the watchdog
      // took over (diagnostics: lastRevivalTs = "watchdog active since").
      val editor = prefs(app).edit().remove(KEY_LAST_ERROR)
      if (wasFresh) {
        editor.putLong(KEY_LAST_REVIVAL_TS, System.currentTimeMillis())
      }
      editor.commit()
    }
    // Always re-assert the chain so a revoked-then-restored exact-alarm grant
    // (or an OEM alarm wipe) heals itself on the next worker/boot pass.
    scheduleNextAlarm(app)
    // If the JS upload pipeline is dead (stale heartbeat), upload a fix
    // natively so the office keeps receiving locations while the app is
    // killed.
    maybeNativePing(app, source)
  }

  /**
   * Run the native upload fallback if the JS pipeline is stale. Every pass
   * already executes on a WorkManager background thread, so the ping (GPS fix
   * + HTTP POST, up to ~35s worst case) runs inline.
   */
  private fun maybeNativePing(context: Context, source: String) {
    try {
      if (!shouldNativePing(context)) return
      nativePing(context)
    } catch (t: Throwable) {
      Log.w(TAG, "Native ping failed", t)
    }
  }

  private fun shouldNativePing(context: Context): Boolean {
    val p = prefs(context.applicationContext)
    if (!p.getBoolean(KEY_ENABLED, false)) return false
    if (p.getString(KEY_AUTH_TOKEN, null).isNullOrBlank()) return false
    if (p.getString(KEY_UPLOAD_URL, null).isNullOrBlank()) return false
    val heartbeat = p.getLong(KEY_JS_HEARTBEAT_TS, 0L)
    return System.currentTimeMillis() - heartbeat > JS_STALE_MS
  }

  /**
   * One native upload: obtain a location (fresh lastLocation, else an active
   * getCurrentLocation request) and POST it to the server with the stored
   * bearer token. MUST be called from a background thread. Every outcome is
   * recorded for the diagnostics panel — this path must never fail silently.
   */
  fun nativePing(context: Context) {
    val app = context.applicationContext
    if (!shouldNativePing(app)) return
    val p = prefs(app)
    val token = p.getString(KEY_AUTH_TOKEN, null) ?: return
    val url = p.getString(KEY_UPLOAD_URL, null) ?: return
    try {
      val loc = obtainLocation(app)
      if (loc == null) {
        recordNativePost(app, false, "No GPS fix available (location off or permission revoked?)")
        return
      }
      val body = JSONObject()
        .put("latitude", loc.latitude.toString())
        .put("longitude", loc.longitude.toString())
        .put("address", JSONObject.NULL)
        .toString()
      val conn = URL(url).openConnection() as HttpURLConnection
      try {
        conn.requestMethod = "POST"
        conn.connectTimeout = 10_000
        conn.readTimeout = 10_000
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("Authorization", "Bearer $token")
        conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        val code = conn.responseCode
        when {
          code in 200..299 -> recordNativePost(app, true, null)
          code == 401 || code == 403 ->
            recordNativePost(app, false, "HTTP $code — session expired, app khol kar dobara login karein")
          else -> recordNativePost(app, false, "HTTP $code")
        }
      } finally {
        conn.disconnect()
      }
    } catch (t: Throwable) {
      Log.w(TAG, "Native ping failed", t)
      recordNativePost(app, false, (t.cause ?: t).toString().take(200))
    }
  }

  private fun obtainLocation(context: Context): android.location.Location? {
    return try {
      val fused = LocationServices.getFusedLocationProviderClient(context)
      val last: android.location.Location? = try {
        Tasks.await(fused.lastLocation, 5, TimeUnit.SECONDS)
      } catch (_: Throwable) {
        null
      }
      if (last != null && System.currentTimeMillis() - last.time <= LAST_FIX_FRESH_MS) {
        return last
      }
      val cts = CancellationTokenSource()
      try {
        Tasks.await(
          fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cts.token),
          20,
          TimeUnit.SECONDS
        )
      } catch (t: Throwable) {
        cts.cancel()
        // A stale last-known fix beats reporting nothing at all.
        last
      }
    } catch (t: Throwable) {
      // SecurityException (permission revoked) or missing Play services.
      null
    }
  }

  private fun recordNativePost(context: Context, ok: Boolean, error: String?) {
    val e = prefs(context).edit()
      .putLong(KEY_LAST_NATIVE_POST_TS, System.currentTimeMillis())
      .putBoolean(KEY_LAST_NATIVE_POST_OK, ok)
    if (error == null) e.remove(KEY_LAST_NATIVE_POST_ERROR) else e.putString(KEY_LAST_NATIVE_POST_ERROR, error)
    // commit(): a WorkManager process can be torn down right after doWork().
    e.commit()
  }

  private fun recordError(context: Context, message: String) {
    prefs(context).edit().putString(KEY_LAST_ERROR, message).commit()
  }

  private fun hasPersistedTrackingTask(context: Context): Boolean {
    return try {
      val tm = context.getSharedPreferences(TASK_MANAGER_PREFS, Context.MODE_PRIVATE)
      tm.all.values.any { it is String && it.contains(LOCATION_TASK_NAME) }
    } catch (t: Throwable) {
      false
    }
  }

  fun scheduleNextAlarm(context: Context) {
    val app = context.applicationContext
    val am = app.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val pi = alarmPendingIntent(app)
    val triggerAt = System.currentTimeMillis() + INTERVAL_MS
    try {
      if (canScheduleExactAlarms(app)) {
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
      } else {
        // Exact-alarm grant missing/revoked — inexact allow-while-idle still
        // fires, just batched (typically ~15 min windows).
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
      }
    } catch (se: SecurityException) {
      // Grant revoked between the check and the call — degrade to inexact.
      try {
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
      } catch (_: Throwable) {
      }
    }
  }

  private fun cancelAlarm(context: Context) {
    val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    am.cancel(alarmPendingIntent(context))
  }

  private fun alarmPendingIntent(context: Context): PendingIntent {
    val intent = Intent(context, WatchdogAlarmReceiver::class.java)
    return PendingIntent.getBroadcast(
      context,
      ALARM_REQUEST_CODE,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun scheduleWorker(context: Context) {
    try {
      val request = PeriodicWorkRequestBuilder<WatchdogWorker>(15, TimeUnit.MINUTES).build()
      WorkManager.getInstance(context.applicationContext)
        .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
    } catch (t: Throwable) {
      Log.w(TAG, "Failed to schedule watchdog worker", t)
    }
  }

  private fun cancelWorker(context: Context) {
    try {
      WorkManager.getInstance(context.applicationContext).cancelUniqueWork(WORK_NAME)
    } catch (_: Throwable) {
    }
  }
}
