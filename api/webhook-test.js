// 最小限のテスト用Webhook（有識者のアドバイスに基づく）

export default async function handler(req, res) {
  // 1) まず即200返す（再送抑止）- これが最重要！
  res.status(200).end();

  try {
    const event = req.body.events?.[0];
    if (!event || event.type !== 'message') return;

    console.log('Received event:', JSON.stringify(event, null, 2));

    // Reply APIを呼ぶ
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replyToken: event.replyToken,  // ※使い回し厳禁／1分以内
        messages: [{ type: 'text', text: 'pong' }]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('LINE reply error', response.status, body);
      // エラー内容を詳細にログ出力
      console.error('Failed request details:', {
        status: response.status,
        body: body,
        token_first4: process.env.LINE_CHANNEL_ACCESS_TOKEN?.substring(0, 4),
        token_last4: process.env.LINE_CHANNEL_ACCESS_TOKEN?.slice(-4),
        replyToken: event.replyToken
      });
    } else {
      console.log('Reply sent successfully');
    }
  } catch (e) {
    console.error('Exception in webhook:', e);
  }
}