# UI style guide

## Direction

Bright rounded chibi anime, candy accents, warm food colours, soft shadows and glossy highlights. The mascot is a barista for the coffee theme. Retain readable dark green text, cream surfaces, mint and peach accents, generous rounded controls, and an uncluttered target/cup comparison. The food palette remains the deterministic warm-food-v2 model.

Use oversized heads, compact bodies and simplified limbs, with toon/cel shading rather than realistic PBR. The current implementation uses generated raster artwork and a Canvas scene; a real-time 3D engine remains an option in REFERENCES.md. Any later camera sway, particles or repeated motion must have a reduced-motion alternative. Preserve the fixed game surface and readable target comparison.

The home screen introduces the oversized mascot and today's order. The play screen gives the target, current cup, one motion control, motion status and Serve clear places. There is no milk/soy add button. Help explains neutral grip and portrait rotation lock. A failure keeps the cup visible and offers retry; it does not silently switch to another input method.

Only the vessel and liquid react to phone movement. The page itself never receives sensor-based transforms. Short spring-style mascot/amount/result animations provide feedback; reduced-motion preference disables those animations and liquid motion. Sound is synthesized after a user gesture and has an explicit toggle.

The existing liquid-field renderer is a bounded dye effect, not physical fluid simulation. The scene renders engine-owned quantity. Neutral or lifecycle stop removes the visible pouring stream immediately while the remaining liquid can settle. A scored miss clears the visual dye field for the fresh cup.

## Assets

- `assets/breakfast-anime.png`: retained original tabletop artwork from the v1.5 export.
- `assets/barista-chibi.png`: generated transparent RGBA project asset, 1024 × 1536 pixels, produced with the built-in image-generation tool on 3 November 2026. The source asset is bundled; no runtime network call or key is needed.

The original v1.5 `docs/ART_DIRECTION.md` also records generated-image provenance for the tabletop. Neither PNG is being classified as a CC0 third-party pack. Before adding assets from Kenney, Quaternius, Poly Haven or itch.io, verify the individual pack's licence and record its provenance as specified in REFERENCES.md.

Creation prompt:

> Use case: stylized-concept. Asset type: transparent game mascot for the Morning Mix phone motion game. Create one oversized, friendly 3D chibi anime barista, full body, with a very large rounded head, short rounded limbs, warm brown hair, expressive joyful eyes, a pastel mint barista apron over a peach shirt, holding a small glossy cream coffee cup. Bright candy colours, warm food palette, toon shading, soft shadows and polished glossy highlights. Cheerful and inviting, suitable for an accessible casual coffee game. Center the single character with comfortable clear margins, clean readable silhouette at small sizes. True transparent background; no scene, no text, no logos, no watermark, no chef hat. This is an isolated bitmap asset for a game, not an entire UI screenshot.

## Layout acceptance

Check 320px and 390px phone widths plus desktop. Confirm no horizontal overflow, readable target and quantities, reachable Enable/Serve controls with browser chrome, and visible keyboard focus. Verify that the game surface stays fixed relative to the viewport, while acknowledging OS rotation can still reflow that viewport. Browser visual validation has not yet run for this candidate.
