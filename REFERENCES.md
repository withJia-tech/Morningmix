# References

Reference catalogue updated 3 November 2026. Links below point to primary API specifications, project licence files or asset-provider policies. Library candidates and optional APIs are labelled separately from capabilities already present in the testing build. Verify the exact release or individual asset pack before inclusion.

## Browser APIs

| API | Purpose | Current build |
| --- | --- | --- |
| [DeviceOrientationEvent](https://www.w3.org/TR/orientation-event/#deviceorientation) | Pitch, roll and orientation input | Used: beta/gamma provide relative grip and tilt; derived angular speed controls swirl |
| [DeviceMotionEvent](https://www.w3.org/TR/orientation-event/#devicemotion) | Acceleration and rotation-rate input | Reference option; not currently used. Any addition must feed the same intent pipeline |
| [Screen Orientation API](https://www.w3.org/TR/screen-orientation/) | Detect screen orientation changes | Used when available, with legacy orientation/resize fallbacks; no OS-lock guarantee |
| [Page Visibility API](https://html.spec.whatwg.org/multipage/interaction.html#page-visibility) | Pause sensors when the page is hidden | Used with pagehide; a focus change alone does not cancel a native permission prompt |
| [Web Audio API](https://www.w3.org/TR/webaudio/) | Gesture-activated synthesized sound | Used directly for local sound synthesis |
| [Vibration API](https://www.w3.org/TR/vibration/) | Optional short haptic feedback | Not implemented; feature-detect and treat as optional if added. Its absence must not affect gameplay |
| [Secure Contexts](https://www.w3.org/TR/secure-contexts/) | Required context for protected mobile motion APIs | Secure-context check implemented; use trusted HTTPS for phone testing |

These references explain API contracts; they do not establish hardware or browser compatibility. The Vibration specification identifies limited availability. Real-phone acceptance remains required.

## Open-source libraries

Three.js 0.180.0 is now vendored locally for the game’s real-time mesh scene. No npm install is required to run or package the build. Other listed libraries remain options. Animation uses CSS/Web Animations and audio uses Web Audio directly; the preserved home mascot is raster artwork.

| Purpose | Library and primary licence source | Licence | Adoption decision |
| --- | --- | --- | --- |
| 3D scene | [Three.js](https://github.com/mrdoob/three.js/blob/dev/LICENSE) | MIT | Adopted in test.4: locally vendored 0.180.0, MIT notice included |
| Animation | [anime.js](https://github.com/juliangarnier/anime/blob/master/LICENSE.md) | MIT | Consider for coordinated timelines beyond the current small CSS/Web Animations sequences |
| Audio | [Tone.js](https://github.com/Tonejs/Tone.js/blob/dev/LICENSE.md) | MIT | Consider for richer synthesis or scheduling beyond the current simple sound effects |
| Icons | [Lucide](https://github.com/lucide-icons/lucide/blob/main/LICENSE) | ISC; listed Feather-derived icons retain MIT notices | Consider when a consistent icon set is introduced; preserve the complete applicable licence notices |
| Optional physics | [Rapier](https://github.com/dimforge/rapier/blob/master/LICENSE) | Apache-2.0 | Consider only for a defined physics requirement. The current liquid effect does not require it |

The licence labels were checked against the linked project sources on 3 November 2026. On adoption, pin the actual package/version, review that version's licence and transitive dependencies, and retain required notices. Only the Three.js adoption described above is included.

## Asset sources

Prefer CC0 or clearly permissive licences. Verify the licence of every individual asset pack before inclusion. Free downloads are not automatically open-source or commercially usable.

| Source | Verified provider reference | Inclusion rule |
| --- | --- | --- |
| Kenney | [Asset-use policy](https://kenney.nl/support) identifies its asset-page game assets as CC0 | Check the chosen asset page and included licence file |
| Quaternius | [FAQ](https://quaternius.com/faq.html) identifies its models as CC0 | Check the chosen pack and its included files |
| Poly Haven | [Asset licence](https://polyhaven.com/license) identifies its HDRIs, textures and models as CC0 | Verify the chosen download; distinguish assets from other site products/material |
| itch.io CC0 collections | [CC0-tagged game assets](https://itch.io/game-assets/tag-cc0) provides discovery | A listing tag is not the pack's licence evidence; verify the creator's terms and included licence |

For each included third-party pack, record the pack title/version, creator, canonical source URL, download date, licence identifier/text, local files, any modifications and required attribution. If the pack's permission cannot be verified, leave it out until resolved. Preserve required notices with the distributed build.

No third-party pack from this catalogue is included in the current build. The bundled PNGs are generated project artwork, not assets relabelled as CC0:

| Bundled asset | Provenance |
| --- | --- |
| `assets/breakfast-anime.png` | Reused from the v1.5 source export. Its original `docs/ART_DIRECTION.md` records built-in image generation followed by an anime-style edit; user reference pictures are not distributed |
| `assets/barista-chibi.png` | Generated for this testing build; the exact prompt and asset dimensions are recorded in `docs/ui-style-guide.md` |

## Design references

- Chibi proportions: oversized head, compact body, simplified limbs.
- Toon/cel shading rather than realistic PBR.
- Rounded UI, high-saturation candy palette, soft shadows.
- Reduced-motion alternative for camera sway, particles and repeated motion.

Use a barista persona for coffee, following the user's naming correction. The home mascot stays unchanged. Play scenes now use original 3D cup, milk pitcher, bowl and soy-bottle meshes, a Canvas liquid texture and bounded UI animation. Reduced-motion preference disables vessel movement, rings and liquid advection; the camera stays fixed.

## Source material

- User-supplied directory tree, event pipeline, AGENTS.md, POUR-intent example and product brief, 3 November 2026. The current brief takes precedence over conflicting historical source notes.
- `MorningMix_v1.5_Complete_Source.md`, source commit `39f4d06a9000911edcc9521c0deb9930d8ccccff`. All 54 original text files were extracted and SHA-256 verified before selecting reusable logic. Historic test logs are not evidence for this candidate.
- `MorningMix_Codex_Deploy_Candidate_v1.5.zip`: original `dist/assets/breakfast-anime.png` reused without editing. Original `docs/ART_DIRECTION.md` records generated-image provenance. No historical hosting identity was copied.
- `assets/barista-chibi.png`: newly generated project asset. See docs/ui-style-guide.md for the creation prompt. No generation API is called by the game.

## Primary platform documentation

Consulted 3 November 2026. These documents describe APIs, not device-specific compatibility evidence.

- [W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/), Candidate Recommendation Draft, 26 October 2026: orientation angles, secure-context and permission behavior. The adapter uses beta and gamma; it does not treat alpha as a compass heading.
- [W3C Screen Orientation](https://www.w3.org/TR/screen-orientation/), Working Draft, 6 August 2026: screen type/angle, change events and conditional orientation locking. A CSS-fixed game surface is not an OS orientation-lock guarantee.
- [WHATWG HTML: Page visibility](https://html.spec.whatwg.org/multipage/interaction.html#page-visibility): visibility/lifecycle signals used to stop input. A focus change alone is not treated as proof the page is hidden.

The thresholds and visual-fluid mapping are product choices, not values prescribed by these standards. The colour ramp is authored game art, not food chemistry. RGB similarity is not a scientific perceptual colour metric.

## Bundled presentation assets — 4 November 2026

- Three.js 0.180.0 from the official npm `three` package; package SHA-1 `b930cabfb524f6d36bf63e874b4d866888b50487`. Only `three.module.min.js`, `three.core.min.js` and the exact release MIT licence are bundled under `assets/vendor/three/`.
- Original procedural mesh assets live in `src/ui/baristaModels.js`; no third-party model pack was used. The scene includes geometry, lighting and live transforms, rather than a pre-rendered picture.
- The eight-bar soundtrack and soy gurgle are original procedural audio. No Mario recording, melody, sample or sound asset is distributed.
- API references: https://threejs.org/docs/pages/WebGLRenderer and https://threejs.org/docs/pages/LatheGeometry.html; official CanvasTexture documentation at https://threejs.org/manual/pages/canvas-textures.html.
