# ファイル構成レビュー — v0.7.1
## 結論
現在は一つのゲームとしてsrc/、tests/、docs/の分離があり、依存境界の自動検証もある。今の規模で全ファイル移動を行う必要はない。履歴リンクを保つためAUDIT原本はルートに残し、docs/README.mdを文書の入口とした。新規の入退場UIはencounter-view.tsへ分離。

| 区分 | 主な場所 | 責務 |
| --- | --- | --- |
| 起動・接続 | src/main.ts | Scene生成、入力・更新・表示接続、破棄 |
| 戦闘状態 | game-state.ts / practice.ts | 状態・進行・初期化・開始/敗北/勝利 |
| 判定・AI | combat.ts / *-system.ts / boss.ts | 判定、花、敵選択 |
| 調整 | data.ts / presentation.ts | 戦闘時間と数値 / 演出値 |
| 表示 | scene-view.ts / boss-view.ts / encounter-view.ts | スナップショットから描画・入退場UI |
| 演出 | events.ts / event-presenter.ts / audio.ts / effects.ts | 通知契約、再生、音、粒子 |
| 操作 | input.ts / actions.ts / commands.ts / ui.ts | 入力・命令・画面配線 |
| 検証 | tests/ | ドメイン回帰と描画スタブ。実ブラウザ評価ではない |
| 記録 | README / CHANGELOG / AUDIT-* / docs/ | 起動方法、変更履歴、監査、設計 |
| 生成物 | dist / node_modules | Git対象外。lockから再現 |

## 今回の修正
READMEの「Phase 7未着手」と未検証の一括記載を訂正。実機評価済みの0.7.0と追加演出の0.7.1を区別した。DEVELOPMENTは追記履歴として保持し、最新節と最新監査への導線を整備した。

## 今後の再編条件
- 複数ボス着手時にboss.tsの定義/選択を分離し登録口を追加。現時点で汎用化しない。
- practice.tsは処理集中が残る。次の状態追加で肥大化する場合、遷移を抽出し、既存更新順序の回帰を守る。
- AUDIT移動をする場合は全リンク更新と移動専用コミットで実施。今回の演出変更と混ぜない。
- UIはモデルの直接書換えを避ける。既存のデバッグ受付値編集は今後整理候補。
- ソース・lock・tests・docsを各版GitHub保存。大変更前後を分け、リモートツリーと公開ソースの一致を確認する。
