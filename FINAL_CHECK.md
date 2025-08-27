# 最終チェックリスト - LINE BOT返信なし問題

## 1. LINE Developers側の確認

### Webhook URL確認
1. [LINE Developers](https://developers.line.biz/) にログイン
2. Account 2のチャネルを選択
3. **Messaging API設定**タブ

#### 確認項目：
- **Webhook URL**: `https://line-booking-account2.vercel.app/webhook`
  - 末尾にスラッシュなし ⚠️
  - httpsであること
- **Webhookの利用**: オン（緑）
- **検証ボタン**: 押して「Success」になるか

### チャネルアクセストークン
- 「チャネルアクセストークン（長期）」を**再発行**
- コピーしてVercelの環境変数 `LINE_CHANNEL_ACCESS_TOKEN` に設定

## 2. LINE Official Account Manager側の確認

### 応答設定
1. [LINE Official Account Manager](https://manager.line.biz/) にログイン
2. Account 2を選択
3. **設定 → 応答設定**

#### 必須設定：
- **応答モード**: Bot（Chatではない）
- **あいさつメッセージ**: オフ
- **応答メッセージ**: オフ
- **Webhook**: オン

### Response hoursの確認
- もし「Manual chat」が選択されていたら → **Response hours自体をOFF**にする

## 3. Vercel環境変数の確認

1. [Vercel](https://vercel.com) にログイン
2. line-booking-account2 → Settings → Environment Variables

必須：
- `LINE_CHANNEL_ACCESS_TOKEN` = （LINE Developersから取得）
- `LINE_CHANNEL_SECRET` = （LINE Developersから取得）

## 4. 動作テスト

### A. Webhook疎通テスト
LINE Developersコンソールで「検証」ボタン → Success

### B. curlテスト
```bash
curl -X POST https://line-booking-account2.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[{"type":"message","message":{"text":"test"}}]}'
```
→ `{"status":"ok"}` が返る

### C. LINEアプリテスト
1. Account 2を友だち追加
2. 「テスト」と送信
3. 返信が来るか確認

## 5. トラブルシューティング

### 返信が来ない場合の優先順位

1. **LINE Official Account Managerで「応答モード」が「Bot」になっているか**
   - これが最も多い原因

2. **Webhook URLが正しいか**
   - 特に末尾のスラッシュに注意

3. **チャネルアクセストークンが正しいか**
   - Account 1のトークンを使っていないか
   - Vercelに設定されているか

4. **友だち追加しているか**
   - ブロックしていないか

## 6. 有識者のアドバイスまとめ

> 原因は「設定の噛み合わせ」か「返信 API 側の使い方」

### 解決済み：
- ✅ 即200を返すように修正
- ✅ replyTokenを1回だけ使用
- ✅ エラーログの詳細化

### 未確認：
- ❓ Manual chatモードになっていないか
- ❓ チャネルアクセストークンが正しいか
- ❓ Account 2のチャネルとトークンが一致しているか