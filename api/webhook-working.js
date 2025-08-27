// Working webhook with LINE reply
export default async function handler(req, res) {
  // 即座に200を返す（重要！）
  res.status(200).end();
  
  // 非同期で処理
  try {
    if (!req.body?.events) return;
    
    const event = req.body.events[0];
    if (!event || event.type !== 'message') return;
    
    console.log('Processing message from:', event.source.userId);
    
    // LINE Reply API
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.error('No LINE_CHANNEL_ACCESS_TOKEN set');
      return;
    }
    
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replyToken: event.replyToken,
        messages: [{
          type: 'text',
          text: 'ご予約はカレンダーからどうぞ！\nhttps://liff.line.me/2008001308-gDrXL5Y1'
        }]
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('LINE API error:', response.status, error);
      console.error('Token preview:', token?.substring(0,4) + '...' + token?.slice(-4));
    } else {
      console.log('Reply sent successfully');
    }
    
  } catch (e) {
    console.error('Webhook error:', e);
  }
}