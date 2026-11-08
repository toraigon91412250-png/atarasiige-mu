# OVERDRIVE // VECTOR BREAK — v2.4 integrated 3D preview

2026-11-08 / GitHub Pages 統合プレビュー公開版

## 前回からの進展

ユーザー提供の3Dモデルを、実際の原作モデル関数・ジオメトリを保持した状態で組み込んだ。概念画像や簡略的な代替形状への置換ではない。

1. **GRAVITY BREAKER GB-03**：原作の重装甲、可動装甲と中核構造を維持。近距離多段ヒット役。
2. **ARC-RING HEAVY FRAME**：原作の371メッシュ、5基のリング、4枚の可動フィンと2つの独立装甲を維持。中距離の連射とFLOW中の短い連射加速。
3. **AETHER / 09**：原作の585メッシュ、内部の回転炉、穴あき装甲、位相フィンを維持。短いタップと最大1.05秒の長押しで演出が変わる。

全体の視点移動・射撃反動・再充填の動きは、各モデル全体の**単一の剛体ルートグループ**に適用される。可動部の独立した動きは、原作の制御APIで処理。旧版のパーツ別カメラ角度計算を使用しない。

## 操作

PC: WASD / マウス照準・クリック / 1〜3切替 / R再充填 / E FLOW / Space（FLOW時長押しで上昇） / Shift。

iPhone: 左ジョイスティックで移動、右側ドラッグで視点移動。FIREは押した瞬間・長押しを区別。AETHER / 09 は長押しでエネルギーを溜め、最大になったら1回だけ自動発射。指を離すと状態がリセットされる。

## 性能設定

| モデル | 通常射撃 | 再使用間隔 | 装填数 | 再充填 | 有効射程 |
|---|---|---|---|---|---|
| GB-03 | 13×8片 | 0.85秒 | 7 | 1.8秒 | 24 |
| ARC-RING | 14 | 0.115秒 | 36 | 1.45秒 | 60 |
| AETHER / 09 | タップ42・最大160 | タップ0.46秒 | 8 | 1.75秒 | 80 |

AETHER最大充填はエネルギーセルを2個消費。全モデルにFLOW DAMAGE ×1.8が適用。GBは周囲の敵の短いひるみ、ARCは5連続命中で短時間発射速度1.2倍、AETHERの最大チャージはFLOW中に最大2体を貫通する。武器ごとの残弾と再充填時間は別々に保存し、切替中も再充填が進む。

## 描画と対応環境

- **本体ゲーム**：従来の独自WebGL（1枚目のキャンバス）。
- **モデル**：Three.js 0.180.0を使用した透過キャンバス（2枚目）。元の3D部品をそのまま描画する。
- Three.jsはjsDelivrまたはunpkgから読み込む。**最初の読み込みにインターネット接続が必要**。CDNまたは2枚目のWebGLに障害が起きた場合、旧モデル表示に自動でフォールバックする。
- 画面への入力は1枚目のゲームUIが扱う。3Dキャンバスは入力を捕まえない。
- iPhoneでは武器の追加描画を最大約33fps、DPR上限1で制限し、本体の描画処理を優先。3モデルは一度に読み込まず、選択されたモデルのみをGPUに構築する。
- **実機フレームレートやiPhone Safari実機の視覚品質は未確認**。2つのWebGLコンテキストを併用するので動作環境によって負荷が高くなる可能性がある。

## 配布内容

- `index.html` / `OVERDRIVE.html`：ブラウザで直接開ける単体HTML（Three.js本体のみCDN依存）。
- `game.js`, `style.css`, `weapon-models.js`, `weapon-viewer.js`, `template.html`, `build.py`：ソースとビルドツール。
- `models-original/`：提供されたオリジナル3DモデルZIPをそのまま同梱。元作品を改変していないバックアップ。
- `test_integrated_balance.cjs`, `test_real_model_hierarchy.cjs`, `test_mobile_flight.py`, `test_flight_clarity.cjs`：機能・構造・飛行テスト。
- `QA.md`：実行済みのテストと未検証項目。

## 注意

**GitHub Pagesへ統合プレビューとして公開済み**。iPhone Safariでの実GPU描画、FPS、実機操作感は未確認。

Three.js は MIT License。外部のThree.jsのランタイムは本パッケージに含まれない。


## v2.5 Performance + rigid camera follow (2026-11-08)
- Gameplay balances, enemy waves and 3 source models are unchanged.
- Combine same-material, unmoving sibling meshes into GPU draw batches. Motion-tested ring/core/fin parts remain separate. Render only the right/bottom weapon viewport using PerspectiveCamera.setViewOffset.
- Mobile main WebGL DPR cap: 1.15. Weapon WebGL DPR: 0.80, with adaptive 0.66 fallback under repeated stalls. Disable MSAA for mobile; smaller procedural reflection texture, simpler mobile lighting.
- Track player yaw/pitch and speed; apply subtle smooth lag and step movement to the single parent rigid weapon transform, not to individual static parts.
- Node tests for static batching and legacy flight/weapon game logic passed. Actual iPhone Safari FPS and final overlay visuals remain unverified. Source ZIP is available separately.
- Pre-fix archive: archive/overdrive-v2.4-pre-performance-fix-20261108.


## v2.6 メニュー先読み・切り替えキャッシュ（2026-11-08）

- GB-03、ARC-RING、AETHER-09をメニュー画面で一体ずつ生成し、メッシュ結合とGPU初回描画まで完了させてキャッシュする。
- キャッシュ済みモデルへの切り替えでは表示・非表示と親グループのスケールだけ変更する。再生成・メッシュ再結合・GPU初期化・disposeはしない。
- すぐ開始して準備が間に合わない場合は旧モデル表示へ一時フォールバックし、モデル完成後に自動復帰する。未準備モデルだけはゲーム開始後にも準備処理が走る可能性がある。
- ブラウザ診断 `window.__OVERDRIVE_MODEL_STATUS__`：`buildCounts`、`warmCounts`、`preloadReady`、`cacheHits`、`lastSwitchMs`。
- 3モデルを常駐するためメモリ使用量は増える可能性がある。iPhone Safariの実GPU FPSやメモリは未計測。
- 既存のゲームバランス、射撃、FLOW、武器の形状や独立可動パーツは変更していない。
