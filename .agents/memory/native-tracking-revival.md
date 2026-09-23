---
name: Native tracking revival (watchdog)
description: Why headless revival of the expo-location foreground service was REMOVED (background ANRs) and what the watchdog does instead
---

# OEM app-kill continuity: native ping ONLY — do NOT revive the FGS headlessly

**Rule (current design, v2):** While the app process is dead, the `tracking-watchdog` module's ~2-min exact-alarm chain + 15-min WorkManager backstop do exactly one thing per pass on a background thread: natively grab a fix (fused lastLocation if <2 min old, else getCurrentLocation) and POST it with a stored bearer token whenever the JS heartbeat is >3 min stale. The full tracking stack (expo-location FGS + JS uploads) is restored ONLY when the technician reopens the app (JS re-arms on every foreground). Do NOT reintroduce headless `TaskService` construction or any `startForegroundService()` from the watchdog.

**Why:** The previous design reflectively forced `AppForegroundedSingleton.isForegrounded=true` and constructed `expo.modules.taskManager.TaskService(appContext)` every 2 min to restore the FGS + notification. On Tecno/HiOS this produced REPEATED "app isn't responding" dialogs even over other apps (background ANR), via two vectors that persist even when the pass runs on a WorkManager thread:
1. `startForegroundService()` in a cold headless process blows the ~5s `startForeground()` window (main thread busy with process spawn / headless RN boot) → "did not then call Service.startForeground()" ANR.
2. Restored location updates trigger expo-task-manager's HeadlessAppLoader, which boots the full RN/Hermes app on the MAIN thread of the killed process; the next 2-min alarm broadcast queues behind that boot → broadcast-timeout ANR. Moving receiver work to WorkManager does NOT help against this — the collision is in the process's main thread.
Field data made the tradeoff free: the headless JS pipeline delivered ZERO uploads on HiOS anyway, so revival added no data value; the native ping was already the only real continuity path.

**Costs accepted:** no notification returns while killed (comes back on app open); office cadence while killed = ~2 min (deep Doze can stretch to ~9 min). Force-stop still kills everything until manual relaunch (Android design).

**How to apply:** Receivers stay lean (re-arm alarm + enqueue unique KEEP work, expedited only SDK≥31). JS hands `{authToken, uploadUrl}` on every arm; logout clears them natively. Pin `play-services-location` to the version expo-location declares (19.0.8 → 21.0.1). Use `commit()` not `apply()` in receiver-spawned processes. `lastRevivalTs` in diagnostics now means "first watchdog pass after a kill" (watchdog took over), not an FGS revival.
