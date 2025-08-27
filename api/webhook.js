// LINE Webhook - Direct implementation with reply
export default async function handler(req, res) {
  console.log('=== Webhook Start ===');
  
  // 即座に200を返す（重要！）
  res.status(200).end();
  
  // 非同期で処理
  try {
    console.log('Body received:', JSON.stringify(req.body));
    
    if (!req.body?.events || req.body.events.length === 0) {
      console.log('No events to process');
      return;
    }
    
    const event = req.body.events[0];
    if (event.type !== 'message' || event.message.type !== 'text') {
      console.log('Not a text message, skipping');
      return;
    }
    
    console.log('Processing message:', event.message.text);
    console.log('From user:', event.source.userId);
    
    // LINE Reply API
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.error('ERROR: No LINE_CHANNEL_ACCESS_TOKEN in environment variables!');
      return;
    }
    
    console.log('Token exists, sending reply...');
    
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
          text: `メッセージありがとうございます！\n\nご予約はカレンダーからどうぞ：\nhttps://liff.line.me/2008001308-gDrXL5Y1`
        }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE API ERROR:', response.status);
      console.error('Error details:', errorText);
      console.error('Token preview:', token.substring(0, 10) + '...' + token.slice(-4));
    } else {
      console.log('✅ Reply sent successfully!');
    }
    
  } catch (e) {
    console.error('Exception in webhook:', e.message);
    console.error(e.stack);
  }
  
  console.log('=== Webhook End ===');
}