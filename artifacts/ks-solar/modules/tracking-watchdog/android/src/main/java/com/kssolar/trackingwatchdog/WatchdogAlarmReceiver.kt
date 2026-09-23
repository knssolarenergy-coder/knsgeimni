package com.kssolar.trackingwatchdog

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Target of the self-chaining ~2-minute exact alarm. When the OEM killed the
 * app, this receiver spawns a fresh (headless) process; the enqueued watchdog
 * pass then uploads a GPS fix natively so the office keeps receiving
 * locations. It deliberately does NOT restore the tracking task / foreground
 * service headlessly — that caused repeated background ANR dialogs (see
 * WatchdogCore's class comment).
 *
 * onReceive runs on the main thread with a ~10s ANR budget, so it only does
 * two fast things: re-arm the next alarm (keeps the chain alive even if the
 * worker is deferred) and enqueue the heavy pass on a background thread.
 */
class WatchdogAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (!WatchdogCore.isEnabled(context)) return
    WatchdogCore.scheduleNextAlarm(context)
    WatchdogCore.enqueueWatchdogPass(context, "alarm")
  }
}
