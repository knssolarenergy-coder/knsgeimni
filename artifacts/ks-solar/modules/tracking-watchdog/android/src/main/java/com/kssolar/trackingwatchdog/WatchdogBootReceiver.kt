package com.kssolar.trackingwatchdog

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Re-arms the alarm chain after a reboot or an app update (alarms do not
 * survive either) and enqueues a watchdog pass. The pass only records
 * diagnostics + runs the native upload fallback — it deliberately does NOT
 * restore the tracking task or start the foreground service headlessly (that
 * caused repeated background ANR dialogs; see WatchdogCore's class comment).
 *
 * The pass itself runs on a WorkManager background thread; onReceive must
 * stay within the main-thread ANR budget.
 */
class WatchdogBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_MY_PACKAGE_REPLACED) return
    if (!WatchdogCore.isEnabled(context)) return
    WatchdogCore.scheduleNextAlarm(context)
    WatchdogCore.enqueueWatchdogPass(context, "boot")
  }
}
