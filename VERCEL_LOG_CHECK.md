# Vercelログ確認ガイド

## ログの見方

### 1. Vercelダッシュボード
1. https://vercel.com にログイン
2. `line-booking-account2` プロジェクト選択
3. **Functions** タブ → **Logs**

### 2. 確認すべきエラー

#### ❌ 401 Unauthorized
```
LINE reply error: {
  status: 401,
  body: "Invalid channel access token"
}
```
**原因**: トークンが間違っている
**解決**: LINE Developersで新しいトークンを発行し、Vercel環境変数を更新

#### ❌ 400 Invalid reply token
```
LINE reply error: {
  status: 400,
  body: "Invalid reply token"
}
```
**原因**: 
- replyTokenを2回使った
- 1分以上経過した
- 既に200を返した後に返信しようとした

#### ❌ 400 The request body has 0 message(s)
```
LINE reply error: {
  status: 400,
  body: "The request body has 0 message(s)"
}
```
**原因**: messagesが空配列

#### ❌ 環境変数が未設定
```
LINE_CHANNEL_ACCESS_TOKEN not set
```
**原因**: Vercelの環境変数が設定されていない

## 3. テスト用エンドポイント

最小テストを試す：
```
/api/webhook-test
```
これは「pong」とだけ返すシンプルなWebhook

## 4. ログをコピーして共有

エラーが見つかったら、以下の情報を共有してください：

1. **エラーメッセージ全体**
2. **status code** (400, 401など)
3. **token_preview** の表示
4. **timestamp** (いつのエラーか)

## 5. Vercel CLIでリアルタイムログ

```bash
vercel logs --follow
```
これでリアルタイムにログを見ることも可能