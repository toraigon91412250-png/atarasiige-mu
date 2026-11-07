# OVERDRIVE // VECTOR BREAK — FLOW DRIVE ALPHA

**Version:** v2.0-alpha1 (2026-11-07)

GPT-6版 OVERDRIVE の独立開発プレビュー。**GitHub Pagesの旧v1.2は変更していない。** 新版を確認するための単体HTMLを同梱。

## プレイ方法

- `OVERDRIVE.html` または `index.html` をブラウザで開く（WebGL必須、外部ライブラリ不要）。
- 元のプロジェクトへ統合する場合は `template.html`, `style.css`, `game.js` と `build.py` を使い `python build.py` でビルドする。
- PCはマウス・キーボード、タッチ端末は横画面推奨。

## 操作

| 動作 | PC | タッチ |
|---|---|---|
| 移動・視点 | WASD / マウス | 左スティック / 右側をスワイプ |
| 射撃 | マウス左長押し | FIRE長押し |
| ジャンプ / 二段ジャンプ | Space | JUMP |
| 覚醒時の上昇 | Space長押し | JUMP長押し |
| FLOW DRIVE発動 | FLOW 100で E | FLOW 100で現れるDRIVEボタン |
| ダッシュ / スライド | Shift / C | DASH / SLIDE |
| 武器変更 / リロード | 1-3,Q / R | SWAP / RELOAD |
| 停止 | Escape | 右上停止ボタン |

## 今回の新機能

- 9つの高所プラットフォームと4つのジャンプパッド。元の障害物と合わせて**高さを考慮する衝突判定**を追加。
- 旧KINETIC ENERGYをFLOW CHARGEに統合。**敵への命中・撃破・移動しながらの弾の直前回避**でFLOW獲得。ゲージ満タンで覚醒を任意発動。
- FLOW DRIVEは12秒からスタート（最大残り時間18秒）。移動速度×1.65、攻撃力×1.8、長押しジェットパックで高速飛行。敵を倒すほど覚醒時間を延長。
- 覚醒中の連続撃破でSKY BREAKが使用可能。3撃破後の次のダッシュで周辺の敵に衝撃を与える。
- 覚醒時には射撃ビームと銃の発光部が金色に変化。
- ORBITを上空へ浮遊させ、BULWARKの背面弱点と、弱点を狙える有限速度の旋回を追加。ボスの中心コアにも弱点判定を追加。
- FLOWの名称衝突を避け、旧スコア倍率はCOMBOに改名。アップグレード説明もFLOW基準に更新。
- 通常は診断HUDを非表示にし、必要なときだけMOVE DEBUGで表示可能。

## 実装・テスト

- `node --check game.js`
- `node test_logic.cjs`
- `node test_movement.cjs`
- `node test_visibility.cjs`
- `node test_pressure.cjs`
- `node test_flow_drive.cjs`
- `python test_touch_browser.py`
- `python test_mobile_drive.py`

Pythonの2つのブラウザテストはChromiumのDOMと実入力を使用するが、**WebGL描画部分はモック**。環境上、実GPUのシェーダー描画を確認できていない。iPhone Safari実機テストも未実施。端末ごとのFPSおよび3D画面の見え方・ゲームバランスは今後の実機評価が必要。

## 備考

これは**実装初回の試作版**。新しい操作と飛行物理、マップの基盤、敵の弱点処理まで実装したが、グラフィックの最終調整、マップ誘導、戦闘テンポはプレイテストを見て改良する。
