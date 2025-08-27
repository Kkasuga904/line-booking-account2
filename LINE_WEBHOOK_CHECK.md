# LINE Webhook 設定確認チェックリスト

## 1. LINE Developers コンソール確認

### Messaging API設定
1. **[LINE Developers](https://developers.line.biz/)** にログイン
2. **Account 2のチャネル**を選択
3. **Messaging API設定**タブで確認：

#### ✅ Webhook URL
```
https://line-booking-account2.vercel.app/webhook
```
（末尾にスラッシュなし）

#### ✅ Webhookの利用
- `オン`になっているか

#### ✅ Webhookの検証
- 「検証」ボタンを押して`Success`になるか
- エラーが出る場合はURLが間違っている

## 2. LINE Official Account Manager確認

### 応答設定
1. **[LINE Official Account Manager](https://manager.line.biz/)** にログイン
2. **Account 2**を選択
3. **設定 → 応答設定**で確認：

#### 必須設定
- **Chat**: OFF
- **Response hours**: OFF（重要！）
- **Webhooks**: ON（緑）
- **Auto-response messages**: OFF
- **Greeting message**: OFF

#### 「Manual chat」が見えていたら
- Response hoursをOFFにする
- またはManual chat + auto-responseを選ぶ（Manual chatだけはNG）

## 3. デバッグ用コマンド

### Webhook URLの直接テスト
```bash
curl -X POST https://line-booking-account2.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[{"type":"message","message":{"text":"test"},"replyToken":"test123","source":{"userId":"test"}}]}'
```

これでVercelログに何か出力されるはず

## 4. よくある設定ミス

### ❌ Webhook URLの末尾にスラッシュ
```
https://line-booking-account2.vercel.app/webhook/  ← NG
https://line-booking-account2.vercel.app/webhook   ← OK
```

### ❌ 応答メッセージがON
LINE Official Account Managerで「応答メッセージ」がONだとWebhookより優先される

### ❌ Manual chatモード
Response hoursがONで「Manual chat」だけ選択されているとBotが動かない

## 5. 環境変数の確認

Vercelダッシュボード → Settings → Environment Variables：
- `LINE_CHANNEL_ACCESS_TOKEN` （必須）
- `LINE_CHANNEL_SECRET` （署名検証用）

トークンはLINE Developersの「チャネルアクセストークン（長期）」から取得