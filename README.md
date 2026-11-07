# OVERDRIVE // VECTOR BREAK

**Version 1.2 — backward movement bug fix and touch diagnostics (2026-11-07).**

A kinetic sci-fi browser FPS by GPT-6, built independently for the OVERDRIVE AI-development challenge. No model files, game engine, library, login, or paid service required. The WebGL renderer, arena geometry, HUD, effects and enemies are all created procedurally.

## Play

- **GitHub Pages:** open the repository's deployed site, when Pages has been enabled.
- **Offline:** open `OVERDRIVE.html` in a browser with WebGL support.
- **From source:** open `index.html` alongside `style.css` and `game.js`.
- **Rebuild single file:** `python build.py`.

The optional Google Font is cosmetic and falls back to system fonts without a network connection.

## Controls

| Function | PC | iPhone / touch |
|---|---|---|
| Move | WASD | Left virtual stick |
| Look | Mouse (pointer lock) | Swipe right side |
| Fire | Hold left click | Hold FIRE |
| Jump / Double jump | Space | JUMP |
| Dash | Shift | DASH |
| Slide | C | SLIDE |
| Emitter switch | 1, 2, 3 or Q / mouse wheel | SWAP |
| Recharge / reload | R | RELOAD |
| Pause | Escape | Pause button |

Landscape orientation is recommended for iPhone. Please disable silent mode to hear audio in browsers that respect hardware mute.

## Movement correction and diagnostics (v1.2)

- Fixed a confirmed directional-movement bug: the world-X movement calculation incorrectly referenced `p.y` (player height) instead of `p.yaw` (camera rotation). This introduced a sideways drift and at some headings could reverse backward input.
- Backward stick input now consistently moves backward relative to the camera at 0°, 90°, 180°, 270°, 360° and -45° in automated tests.
- Added a small `MOVE DEBUG` toggle near the radar. It displays `STICK` (the actual touch input), `REQUEST` (the intended forward/back direction), `ACTUAL` (actual world travel relative to camera), `DASH` status and camera angle (`YAW`). `DIRECTION MISMATCH` highlights opposite movement.
- More reliably reset mobile input on pause, restart, loss of touch pointer capture, and window blur.
- The overlay is temporary diagnostic instrumentation and can be hidden by tapping `MOVE DEBUG`.

## High-visibility combat update (v1.1)

- Four bright, simplified enemy bodies: STRIKER red, ORBIT pink, SENTRY yellow, BULWARK white; the boss has a white shell and warm core.
- Enemy silhouettes and projectiles render with reduced atmospheric fog, remaining visible against the dark arena.
- Enemy shots are single compact, role-colored orbs. Long warning beams, floor telegraphs and projectile tails were removed.
- Simultaneous hostile shots are limited to 18 and multi-shot volleys have been reduced.
- Ambient cyan grid lines have been dimmed; initial sector now has four enemies.
- No new weapons or systems: this release focuses on clarity and readability.

## Game systems

- Six sectors: five escalating procedural enemy encounters, then HELIX CORE.
- Four enemy classes: STRIKER, ORBIT, SENTRY, BULWARK. Each class attacks at range. The SENTRY charges briefly without an intrusive targeting line.
- Three energy emitters: VOLT CARBINE (rapid fire), NOVA SCATTER (multi-shot), PRISM LANCER (precision).
- Velocity-powered kinetic charge. Gain charge by moving and dashing; charge amplifies damage.
- Dash, slide, double jump, air control, shield regeneration, hit feedback, score combo and kill effects.
- After each of sectors 1–5, choose from three randomly offered modules; twelve distinct upgrade types can combine.
- Persistent personal best and victories in localStorage.
- Adaptive mobile controls, native Web Audio synthesizer, no images/emojis used as enemies.

## Source structure

- `index.html` - page structure and controls.
- `style.css` - visual design and mobile adaptation.
- `game.js` - renderer, AI, physics, progression, procedural scene and mobile input.
- `OVERDRIVE.html` - generated one-file playable build.
- `build.py` - standalone build script.
- `test_logic.cjs` - pure Node mock-WebGL logic test (not a real browser test).
- `QA.md` - implementation and test notes.

## Technology

Native HTML/CSS/JavaScript with WebGL 1.0; procedural indexed geometry, vertex/fragment shaders and Web Audio. No packages to install.

## Important limitations

- Browser GPU rendering and real iPhone touch operation were **not** verified in the current execution environment. Final device testing is still needed.
- No 3D skeletal character animation or asset-loaded art; models use procedural geometry and animated transforms.
- Some balancing is provisional and should be tuned using actual player sessions.
- The arena is hand-designed rather than randomly generated; enemy positions and module rewards vary by run.