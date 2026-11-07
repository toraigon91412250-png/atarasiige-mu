# OVERDRIVE: VECTOR BREAK — v1.2 QA (2026-11-07)

## Root cause of confirmed backward-movement bug

In `moveAxis()` the X-axis transform used `Math.sin(p.y)` instead of `Math.sin(p.yaw)`. `p.y` is the camera/character height, so this created sideways drift regardless of camera rotation. At certain headings (270 degrees reproduced in Node), backward touch input resulted in movement toward the camera's forward direction. Corrected to `Math.sin(p.yaw)`.

## Automated tests passed

- `node --check game.js`: valid syntax.
- `node test_movement.cjs`: joystick-pointer input DOWN produces BACK request and BACK actual movement for yaw 0, 90, 180, 270, 360, -45 degrees; capture-loss resets controls.
- `node test_logic.cjs`: wave progression, upgrade choice, boss, victory, defeat, and draw calls.
- `node test_visibility.cjs`: role colors and projectile cap remain unchanged.
- `python test_touch_browser.py`: headless Chromium with emulated mobile touch viewport and a **mock WebGL context**. Tests actual pointerdown/move/up, BACK input and actual movement at 0/90/180/270°, and the debug toggle. No JavaScript page errors in this check.
- HTML rebuilt and ZIP archive checksum/integrity verified.

## Remaining limitations

- Full iPhone Safari device test has not been performed; the user can validate with the MOVE DEBUG overlay.
- Chromium screenshots used a mocked WebGL context, so this is not an actual GPU-rendering test.
- The diagnostic panel is temporary and can be hidden with MOVE DEBUG.

# OVERDRIVE // VECTOR BREAK — QA update v1.1 (2026-11-07)

## Implementation
- High-contrast low-poly procedural robots in bright red, yellow, pink and white.
- Enemy-only shader clarity control, reduced arena clutter.
- Compact colored projectiles with a hard cap of 18 at once; reduced volleys.
- No rendered long attack-warning lines or ground targeting circles.
- First sector starts with four enemies.

## Verified locally
- JavaScript syntax check: passed.
- Mock-WebGL Node integration simulation: passed (wave progression, upgrades, boss and victory).
- Stationary threat simulation: passed (enemy attacks cause health and shield damage).
- Projectile cap and visibility assertions: passed.
- Single-file HTML rebuild and ZIP integrity checks: passed.
- GitHub Pages deployment at the updated main commit: succeeded.

## Outstanding checks
- This environment could not complete interactive GPU WebGL rendering or real iPhone Safari touch testing.
- Full visual readability and game balance should be judged with hands-on play.
