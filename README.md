# OVERDRIVE // VECTOR BREAK — KINETIC AIM

**v2.1-alpha3 (2026-11-08) · 第1回改修**

iPhoneで照準が合わせにくく、FLOWが溜まらず敵の強さが過剰に感じられる問題を修正した更地版。

## KINETIC AIM

- ターゲット周辺で視点移動を減速。カメラは自動で敵を追尾しない。
- 画面中央付近の敵に対する射撃の進行方向を補正する。
- 補正範囲：スマホ通常9°／FLOW DRIVE 14°、PC通常2°／FLOW DRIVE 4°。
- 有効範囲端では補正が弱くなる。画面外・背後・射程外・遮蔽物越しは対象外。
- すでに敵に当たる軌道は変えず、弱点を手動で狙う操作を維持。
- 補正可能なとき照準を控えめに発光（FLOW中は金色）。
- スマホFIREは押した瞬間に撃ち、押し続ければ連射する。

## 今回変更していない内容

敵HP、敵の火力・射撃間隔、体力・シールド、覚醒火力倍率、銃の3Dモデル。地形は先に実施した更地版のまま。

## 起動

- [GitHub Pages](https://toraigon91412250-png.github.io/atarasiige-mu/)
- ソース: `game.js`, `style.css`, `template.html`, `build.py`
- 完成HTML: `index.html` / `OVERDRIVE.html`
- 配布ソースZIPにはエイムアシストやモバイル操作などの自動テストも同梱。

## テスト概要

照準補正の通常／覚醒角度、正常命中、補正範囲外・背後の除外、移動と着地、セクターと勝敗、スマホタッチ・FIREタップは自動テストを通過。ただし、この環境ではWebGLを起動できず、実GPUでの画面表示やiPhone Safari実機での体感は未確認。

旧版の保全：`archive/flow-drive-v2-alpha1-20261107`, `archive/overdrive-flat-v2-alpha2-20261108`。
