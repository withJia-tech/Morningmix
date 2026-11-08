# Product brief — morningmixer

## Promise

A small, satisfying daily motion game: tilt your phone to pour the right
amount of milk or soy sauce and match the target color.

## Core loop

1. Open the daily order.
2. Calibrate a comfortable neutral phone grip.
3. Tilt to pour milk or soy sauce.
4. Move side to side to swirl.
5. Serve the mixture.
6. A scored miss consumes one attempt and starts a fresh cup.

## Input rules

- Motion is mandatory for gameplay.
- Shake and tilt are not separate gameplay modes; they are motion patterns
  interpreted by one motion controller.
- Direction, angle, and movement intensity determine pour and swirl.
- Neutral grip stops pouring immediately.
- No direct-add button exists.

## Experience direction

Bright, rounded, 3D chibi anime:
- Candy colors and warm food palette
- Oversized chibi barista mascot
- Toon shading, soft shadows, glossy highlights
- Bouncy spring animations
- Playful pour, swirl, success, and miss feedback

## Out of scope for now

- Login
- Cloud saves
- Remote analytics
- API keys
- AI runtime calls
- Undo, reset, subtraction, or amount sliders
- Persistent daily history

## Implementation decisions for this testing build

The sections above preserve the supplied product brief. The coffee persona is a barista, following the user's earlier correction. One control enables/pauses/retries motion, and a separate Serve action submits the mixture. Neither directly adds ingredient. Unsupported devices show a recovery message and cannot play this motion-only build.

Coffee and eggs are both available every day through permanent navigation and direct links (`#coffee`, `#eggs`). Each has its own deterministic daily target. There are five attempts. A miss starts an empty cup; a win or fifth submission ends the round. Switching recipes, Menu and browser Back preserve each recipe/date’s mixture, attempts and completed result; navigation cannot reset an order during a launch. Reload starts a new testing session. No old browser records are accessed or removed.

DeviceOrientationEvent provides relative pitch and roll. The absolute relative pitch determines pour rate in either direction: a 10-degree deadband and full flow at 45 degrees. Returning to neutral stops immediately. Side-to-side angular direction and speed determine swirl direction and intensity. Holding a non-neutral forward or backward tilt continues pouring even when the phone is stationary. Pure translational shaking cannot be reliably inferred from orientation alone; a separate shake classifier is not shipped or advertised. There is one motion pipeline and no shake/tilt mode switch.

Only the vessel and liquid respond to sensor movement. The game never rotates the page to imitate an OS lock. Portrait-lock guidance is visible in help, and observed screen rotation pauses without consuming a try. Returning upright does not resume automatically.

Original tabletop artwork, warm food colours and liquid rendering are retained. A new generated chibi barista and bounded spring-style feedback provide the requested visual direction. Browser visual QA and physical-phone acceptance remain pending; no claim of hardware compatibility is made.

## Presentation update — 4 November 2026

The user requested preservation of the existing game, with gurgling soy additions, faint retro-platformer music, and a 3D coffee-and-milk-jug barista experience. That presentation update preserved the alternating schedule; the later navigation update below makes both recipes available every day. The home mascot, tabletop, motion controls, attempts, scoring and motion thresholds remain.

Both play scenes now use original 3D mesh assets: a ceramic coffee cup and saucer with a lipped milk pitcher, or an egg bowl and amber soy dispenser. Only the held vessel and liquid respond to motion; the camera remains fixed. The existing home mascot remains the supplied raster artwork. If WebGL is unavailable the clearly labelled prior simplified view remains playable. A lost 3D context pauses motion.

Soy additions trigger a locally synthesised gurgle. An original, quiet chiptune plays during an unfinished round after a gesture; it is inspired by retro platformers, not a copied Mario tune. The existing sound switch mutes both effects and music immediately. Menu, completion and background stop the music. No remote audio, assets, accounts or telemetry were added.

## Clear navigation — 4 November 2026

The user confirmed the egg experience works but could not find coffee. Both recipes are now available every day. Permanent Coffee / Eggs links stay visible above the scrolling game area, with a highlighted current page. The home screen offers two named cards before the mascot. The logo and Menu return home without reloading. Direct links and browser Back/Forward use the same navigation path.

Navigation stops motion immediately; selecting another recipe never pours or consumes an attempt. Each order has five tries, with mixture/progress retained separately in memory for the current launch. Returning to a completed order shows its result. Reload intentionally starts a fresh testing session, as before.

## Yolk mixing candidate — 8 November 2026

Wrist roll blends the two yolks irreversibly as a presentation effect. Either rotation direction accumulates mixing; reversing direction cannot restore intact yolks. Forward/back tilt alone adds soy and retains the yolks. Screen orientation changes still pause. This uses the existing relative-roll-speed signal, not compass yaw or an acceleration-based circular gesture classifier.

The yolks orbit, shrink and fade into the existing scored mixture colour; reduced-motion mode fades without orbital movement. About two seconds at maximum accepted swirl completes blending; weaker motion takes longer. This is a visual tuning choice, not a change to motion or scoring thresholds. Visual blend progress survives menu/recipe navigation within the launch; a scored miss starts a fresh bowl. Reload resets session state.
