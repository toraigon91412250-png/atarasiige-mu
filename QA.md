# v2.4 統合プレビュー — QA

## PASS（自動）

- Node.js JS構文チェック（game.js / weapon-models.js / weapon-viewer.js）
- 提供されたモデル生成関数をオリジナルの階層構造のままインスタンス化（Three.jsの代替オブジェクトスタブを使用）：GB 361 / ARC 371 / AETHER 585メッシュ
- リング・フィン・装甲のアニメーション更新後も部品数と位置座標が有効
- 3つの性能：通常射撃、FLOW特殊能力、AETHERの即時タップと1.05秒長押し
- AETHER最大充填後のリリースで重複発射しないこと
- 武器別の残弾と再充填、武器切替中も再充填が完了すること
- 飛行：上昇、滑空、高度上限、被弾フラッシュ上限
- ChromiumモックWebGL：モバイル操作と6セクター画面遷移
- 単体HTMLのビルド／ZIPのファイル整合性

## NOT YET VERIFIED（重要）

- 実GPUでのThree.js + 独自WebGLの透過合成映像とレイヤー表示
- モデルの実際の画面占有範囲（投影計算上は右下になる設定）
- iPhone Safari 実機FPS / メモリ負荷 / 連続切替時のカクつき
- CDNの読み込み速度やオフライン時フォールバックの体感

モデル生成関数をスタブでテストしたことを「実GPU描画成功」と誤って報告してはいけない。

## 今後の推奨実機確認

1. GB-03 / ARC-RING / AETHERを順に切替えてモデルが表示されるか。
2. 視点を上下・左右に大きく振っても一体の形が崩れないか。
3. 回避やFLOW飛行中も照準と敵が見えるか。
4. AETHERのタップと1.05秒の長押しが正常に区別されるか。
5. iPhoneで各モデル約60秒ずつプレイし、極端なカクつきがないか。


## v2.5 extra tests
- Synthetic batching: 38 meshes down to 3 render meshes, original vertices retained and moving mesh excluded. PASS.
- Model hierarchy tests, integrated gameplay, mobile flying and viewport projection tests: PASS.
- Real iPhone Safari profiling and WebGL display inspection: NOT RUN.


## v2.6 切り替えキャッシュ回帰（2026-11-08）

- 3モデルを各1回だけ構築・GPUウォームアップするテスト（モック）：PASS。
- 35回の武器切り替え後も `buildCounts=[1,1,1]`、`warmCounts=[1,1,1]`：PASS。
- ゲーム開始がキャッシュ準備より早い場合、画面描画フレーム中の同期生成を避け、準備後に復帰：PASS。
- 静的メッシュ結合、3モデル構造、射撃性能、FLOW飛行、モバイル操作の従来テスト：PASS。
- 実機iPhone Safariの切り替えフレーム時間・GPUの事前転送・メモリ使用量は未計測。
