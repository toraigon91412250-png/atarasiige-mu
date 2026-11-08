# KINETIC AIM v2.1-alpha3 QA — 2026-11-08

## 自動テスト結果

- `node --check game.js` — PASS
- `node test_kinetic_aim.cjs --touch` — PASS
- `node test_kinetic_aim.cjs` — PASS
- `node test_flat_arena.cjs` — PASS
- `node test_logic.cjs` — PASS
- `node test_movement.cjs` — PASS
- `node test_visibility.cjs` — PASS
- `python test_touch_browser.py` — PASS（WebGLモック）
- `python test_mobile_drive.py` — PASS（WebGLモック）
- `python test_mobile_aim.py` — PASS（WebGLモック）

## 確認ポイント

スマホ側では約4°外れた照準で発砲して敵に命中することを確認。PCの同条件では通常モードの補正対象にならない。通常と覚醒の補正範囲はそれぞれスマホ9/14°、PC2/4°。背後・範囲外の敵には補正がない。近くの敵への照準減速、直接命中する手動狙いの維持も確認。

## 未確認

本テスト環境のWebGLは無効なので実GPU描画は未確認。iPhone Safari実機での視覚的な品質とゲームバランスも未確認。
