# OVERDRIVE // VECTOR BREAK — QA report (2026-11-07)

## Scope and tests

- Custom WebGL 1 renderer, scene geometry and shaders, camera, UI.
- Movement: keyboard/analog, double jump, dash, slide, mouse-look and touch look.
- Game systems: three fictional energy emitters, four enemy archetypes, six sectors, final boss, 12 upgrades, energy-powered damage, shield and scores.
- `node --check game.js`: PASS.
- `node test_logic.cjs`: PASS. Covers init, 100 simulated frames, draw call generation (with GPU stub), shields, 5 upgrade transitions, boss stage and victory.
- `python test_game.py`: PASS on headless Chromium with a mock WebGL command surface. Simulated desktop 1366x768, phone landscape 844x390 and phone portrait 390x844. Covers start menu, HUD, touch/keyboard switching, 5 successive upgrade selections, stage six, victory, restart, defeat, JS exceptions and horizontal overflow.
- Shader compilation and real on-screen 3D rendering remain **NOT VERIFIED** because headless Chromium in this environment has WebGL disabled. iPhone Safari native device performance and finger comfort are not verified.

## Bugs fixed during testing

- Fixed upgrade selection becoming impossible because pointer lock was not released after clearing a stage.
- Fixed boss projectile height, to aim at the player's altitude rather than flying above the player.
- Moved boss off a cover-obstructed line of sight.
- Increased enemy movement speed where it prevented pressure.

## Open concerns

- Further difficulty and frame-rate tuning depend on real device/play testing.
- Procedural geometry and synthesized sound have a consistent art direction but are not authored AAA assets.
- No actual online multiplayer; fully offline single-player.

## Assessment

The logic and progression are test-verified, but visual rendering and real-device quality remain unverified. We do not claim an objective 90/100 result without practical playtesting.