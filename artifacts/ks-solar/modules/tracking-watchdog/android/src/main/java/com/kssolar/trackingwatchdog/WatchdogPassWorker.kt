package com.kssolar.trackingwatchdog

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters

/**
 * Runs a full watchdog pass (task revival + native ping fallback) on a
 * WorkManager background thread. Enqueued by the alarm and boot receivers,
 * which must return from onReceive within the ~10s main-thread ANR budget —
 * a cold-process revival can exceed that on slow OEM devices, which showed
 * up as the "K&S Solar Energy isn't responding" dialog.
 */
class WatchdogPassWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  companion object {
    const val KEY_SOURCE = "source"
  }

  override fun doWork(): Result {
    if (WatchdogCore.isEnabled(applicationContext)) {
      val source = inputData.getString(KEY_SOURCE) ?: "alarm"
      WatchdogCore.runWatchdogPass(applicationContext, source)
    }
    return Result.success()
  }
}
