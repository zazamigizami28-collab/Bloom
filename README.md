# 花 / Bloom-Break — v0.6.11

Webで動作する植木鉢の主人公と園芸機械の2Dアクション。HRT-01の開発完了版です（ユーザー判断）。Phase 7は未着手です。

## 起動
Node.js 24.19.0で検証。依存はpackage-lock.jsonで固定しています。

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

表示されたローカルURLをブラウザで開きます。ネットワーク越しに使う場合は通常のnpm run dev（0.0.0.0）を使用できます。このWork環境では全インターフェース列挙が失敗するため127.0.0.1を指定しました。

```sh
npm run check
npm run build
```

checkは型・責務依存・整形・戦闘/花/入力/ライフサイクル回帰・ビルドを実施。distは生成物です。HTMLを直接file://で開かずHTTPで配信してください。依存取得にはnpmレジストリへのアクセスが必要です。ゲーム実行にAPIキーやバックエンドは不要です。

## 操作
A/D移動、Wジャンプ、Spaceローリング、J攻撃・BREAK中の一撃、Kパリィ、E回復（1.2秒/HP2/3回）、Esc休止、F2デバッグ。パッドは左スティック/A/B/X/RB/Y回復。トップの開始からボス戦、操作パネルの練習場ボタンで別練習画面へ切り替えます。

## 実装済み
- 通常/ジャストパリィ、BREAKと専用一撃、水/肥料の特殊パリィ。
- 水1回ごとに種→芽→蕾→開花。開花20秒、通常攻撃に花風、終了後種へ。
- 巨大な移動園芸管理機HRT-01、伸縮剪定、通常弾→通常弾→水の射出、突進。肥料弾と地面攻撃は現在のボス戦から除外。
- 通常の本体接触停止と、ローリングによる裏回り。白い圧縮弾は成長しない通常パリィ対象。
- 別練習画面、デバッグ、休止、死亡再挑戦、撃破結果。

## 次の開発へ
- docs/HRT-01-RETROSPECTIVE.md：開発経緯と確定仕様
- docs/BOSS-DEVELOPMENT-GUIDE.md：次ボスの設計・実装・検証手順

## 編集地図
調整値: src/data.ts。ボスの移動/攻撃順: src/boss.ts。ボス描画: src/boss-view.ts。戦闘進行: src/practice.ts。状態/共通敵座標・矩形: src/game-state.ts。敵攻撃: src/enemy-system.ts。花: src/flower.ts、src/flower-system.ts。入力/UI: src/input.ts、src/ui.ts。詳細はDEVELOPMENT.md、実装規則はAGENTS.md。

## 状態と残件
AUDIT-0.6.11.mdを参照。自動検証済み。この版の実画面・音・物理パッドは未検証。HRT-01はv0.6.11で開発終了。320ms発光の実操作は未検証。サブ花・複数ボス・拠点・探索は未実装。実装基準v0.5原文との逐条照合は未完了。

## 保存・復旧
ChatGPT Workで開発しGitHubを永続保存先にします。Replitは使用しません。変更前原本とバージョン変更を分けて保存し、各版のリモートコミットを確認して完了報告します。復旧時はGitHubを新規取得しnpm ci→npm run check→起動。過去ログはdocs/、監査原本はAUDIT-*.md。認証トークン、node_modules、生成distはソース管理しません。旧Sites配信は.openai/hosting.jsonの既存プロジェクトを継続します。
