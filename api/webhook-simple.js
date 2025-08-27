// Account 2 Simple Webhook Test
export default async function handler(req, res) {
  console.log('Webhook Simple called');
  
  const body = req.body;
  const event = body?.events?.[0];
  
  if (!event || !event.replyToken) {
    return res.status(200).json({ ok: true, skipped: true });
  }
  
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return res.status(200).json({ ok: false, error: 'No token' });
  }
  
  // Simple reply
  const r = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: `[Account 2] テストメッセージを受信しました: ${event.message?.text || 'unknown'}`
      }]
    })
  });
  
  return res.status(200).json({ 
    ok: r.ok,
    status: r.status
  });
}