# LINE BOT 応答なし問題 - 解決方法

## 🔴 問題
- Webhookは呼ばれる（既読がつく）
- しかしボットからの返信がない
- 自動応答メッセージが表示される

## ✅ 解決方法

### LINE Official Account Managerで設定変更

1. **[LINE Official Account Manager](https://manager.line.biz/)** にログイン

2. **Account 2**を選択

3. **設定 → 応答設定** を開く

4. 以下の設定に変更：
   - **応答モード**: `Bot` （❌チャットではない）
   - **あいさつメッセージ**: `オフ`
   - **応答メッセージ**: `オフ`
   - **Webhook**: `オン`

### LINE Developersコンソールで確認

1. **[LINE Developers](https://developers.line.biz/)** にログイン

2. **Messaging API設定** を確認：
   - **Webhook URL**: `https://line-booking-account2.vercel.app/webhook`
   - **Webhook利用**: `オン`
   - **応答メッセージ**: `利用しない`

### Vercel環境変数を確認

1. **[Vercel](https://vercel.com)** にログイン

2. **line-booking-account2** プロジェクトを開く

3. **Settings → Environment Variables**：
   - `LINE_CHANNEL_ACCESS_TOKEN` = （正しいトークン）
   - `LINE_CHANNEL_SECRET` = （正しいシークレット）
   - `STORE_ID` = `restaurant-002`
   - `LIFF_ID` = `2008001308-gDrXL5Y1`

## 🎯 テスト手順

1. LINE Official Account Managerで設定変更
2. 5分程度待つ（設定反映に時間がかかる）
3. LINEで「予約」と送信
4. カレンダー付きクイックリプライが返ってくる！

## ⚠️ よくある間違い

- **チャットモード**になっている → **Botモード**に変更
- **応答メッセージ**がオンになっている → **オフ**に変更
- **Webhook**がオフになっている → **オン**に変更