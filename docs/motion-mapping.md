# Motion mapping and intent contract

One pipeline interprets orientation patterns. There is no shake/tilt mode switch. DeviceOrientationEvent supplies angular orientation; it does not establish translational acceleration. Absolute relative pitch controls pour rate in either direction. Side-to-side angular speed controls swirl intensity, and its sign controls direction. Swirl never independently adds ingredient.

## Mapping

| Stage | Rule | Failure / boundary |
| --- | --- | --- |
| Permission | Explicit button gesture; invoke requestPermission synchronously when present | Denial, exception or 15-second timeout stops input |
| Source | Finite beta within ±180°, gamma within ±90°; monotonic receipt time | Invalid samples stop; alpha is unused |
| Data availability | First valid sample within 8 seconds; thereafter gaps no greater than 250 ms | No-readings / stream-lost status, clear control and retry |
| Neutral grip | At least five samples spanning 400 ms within 4° of the first stable sample | Movement restarts the window; 15-second calibration deadline |
| Relative angles | Wrapped angle delta from the neutral grip | Beyond 55° pitch/roll stops as reposition |
| Filter | 100 ms exponential smoothing; 2° visual deadband | Raw absolute relative pitch ≤10° zeros flow immediately |
| Pour factor | clamp((abs(filtered pitch) − 10) / (45 − 10), 0, 1) | Dimensionless, not measured fluid velocity |
| Portion credit | flow × 2 portions/sec × elapsed seconds; actual elapsed time for each valid interval ≤250 ms | Neutral, pause or gap discards partial credit |
| Accepted portion | 5 ml milk or 1 drop soy sauce | Recipe bounds enforced by engine |
| Swirl | Filtered roll angular speed, capped ±240°/sec; visual radius min(24, abs(speed) × .12) | Stationary roll settles; no ingredient effect |
| Screen | Guide portrait lock; stop on observed orientation/large width changes | No page counter-rotation or automatic restart |

A held forward or backward tilt outside the deadband continues pouring. “Return and become stationary” is implemented as returning to the calibrated neutral grip. Motion intensity affects swirl, while tilt angle controls pour volume over time. These choices require phone testing.

## Intent proposal

```json
{
  "type": "POUR",
  "ingredient": "milk",
  "amount": 5,
  "flow": 0.62,
  "source": "tilt"
}
```

`flow` is a 0–1 control factor. `amount` is the requested portion in the recipe's units. The example is the payload shape; the live pipeline also adds `epoch`, `seq` and `at` from its current input session. A naked example object is not executable input.

The engine checks active round/lifecycle, epoch, increasing sequence, finite timestamp no older than 250 ms and not in the future, known source, matching ingredient, fixed positive portion, nonzero current flow and an overall two-portions-per-second rate budget. A matching current MOTION_CONTROL must precede a POUR at the same sample timestamp. A wrong or stale proposal changes no amount or attempts. The mapper accumulates flow-weighted credit; the engine separately enforces the overall maximum acceptance rate. These are local integrity controls, not server-side anti-cheat protection.

MOTION_STATUS proposals carry sensor/calibration outcomes through the bus with the current epoch, timestamp and source; the engine enforces the lifecycle transition and rejects attempts to skip calibration or revive a stopped epoch.

MOTION_CONTROL is ephemeral view input. The engine checks angle, flow and visual bounds, then publishes an immutable snapshot. No sensor event, angle trace or control stream is persisted. Session history retains only served amounts, scores and results.

## Lifecycle

Stop on submit, menu navigation, pagehide, hidden visibility, screen rotation, malformed/stale data or completion. Remove listeners/timers, invalidate the permission generation and engine epoch, zero visual control and partial credit. Re-enable requires fresh calibration. Window blur alone is ignored because a native permission prompt can take focus.

Permission, viewport behavior and input mapping remain separate concerns with separate test evidence.
