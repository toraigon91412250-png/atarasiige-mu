# OVERDRIVE // VECTOR BREAK — WEAPON EVOLUTION

**v2.2-alpha4 (2026-11-08) ・第2回改修**

Astraの実装をコピーせず、3種類のエネルギー武器を独自に再構成。

## 新しい武器

- **VOLT CARBINE**：細い多段装甲、側面の発光スパイン。連続命中でSURGEを蓄積（最大6段）。FLOW DRIVE中は連射速度が最大約1.5倍。1.45秒間命中しないと失効。
- **BREACH**：大型の近距離エミッター。命中時に短いひるみ、FLOW DRIVE中は敵を押し出す。空中での射撃は小さな後方移動を生む。
- **PRISM LANCER**：左右分離レールと発光コア。敵を狙い続けるとFOCUSを蓄積し次の射撃を最大+70%強化。FLOW DRIVE中は近くの敵に最大2回連鎖攻撃。
- **共通**：軽量3Dモデル（22〜27パーツ）、射撃反動、発射時のエネルギー発光、武器ごとの再充填アニメーション、覚醒による可動部分の変形と光量変化。

## 引き継いだもの

更地アリーナ、KINETIC AIM照準補助、6セクター、FLOW DRIVE、iPhone Safari向けのタッチ操作、既存武器の弾数と基礎威力。

## ファイル

- GitHub Pages: https://toraigon91412250-png.github.io/atarasiige-mu/
- 単体HTML: `index.html` または `OVERDRIVE.html`
- ソース: `game.js` と `style.css`, `template.html`、`build.py`
- 自動テストと説明書入りのZIPはChatGPTチャットでも配布。

## QA

3武器の射撃・反動・リロード、武器切替、SURGE、FOCUS、FLOW、画面内の投影範囲をNodeのモックWebGLで検証。実GPUでの描画・iPhone Safari実機のFPSと外観は未確認。
