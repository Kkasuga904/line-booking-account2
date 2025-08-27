// Account 2 Webhook v5 - Simple and Working
// Store: restaurant-002
// Date: 2025-08-27

export default async function handler(req, res) {
  try {
    const body = req.body;
    
    // 即座に200を返す
    res.status(200).json({ ok: true });
    
    // イベントがない場合はスキップ
    if (!body?.events?.[0]) {
      return;
    }
    
    const event = body.events[0];
    
    // メッセージイベント以外はスキップ
    if (event.type !== 'message' || !event.replyToken) {
      return;
    }
    
    // トークンチェック
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.error('No LINE token set');
      return;
    }
    
    // 返信メッセージ作成
    const userMessage = event.message?.text || '';
    let replyText = '[Account 2] メッセージを受信しました: ' + userMessage;
    
    if (userMessage.includes('予約')) {
      replyText = `🍽️ ご予約を承ります！

下記リンクから詳細をご入力ください：
https://liff.line.me/2008001308-gDrXL5Y1

【営業時間】
ランチ: 11:30-15:00
ディナー: 17:30-22:00

[Account 2 - Restaurant]`;
    }
    
    // LINE APIに送信（エラーは無視）
    try {
      await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          replyToken: event.replyToken,
          messages: [{
            type: 'text',
            text: replyText
          }]
        })
      });
    } catch (e) {
      console.error('Reply error:', e);
    }
    
  } catch (error) {
    console.error('Handler error:', error);
    // エラーでも200を返す
    if (!res.headersSent) {
      res.status(200).json({ ok: false });
    }
  }
}