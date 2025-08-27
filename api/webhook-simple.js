// Simplified webhook for testing
import https from 'https';

export default async function handler(req, res) {
  // 即座に200を返す
  res.status(200).end();
  
  // 最小限の処理
  if (!req.body?.events?.[0]) return;
  
  const event = req.body.events[0];
  if (event.type !== 'message') return;
  
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.error('No token');
    return;
  }
  
  // シンプルな返信
  const data = JSON.stringify({
    replyToken: event.replyToken,
    messages: [{
      type: 'text',
      text: 'テスト返信です'
    }]
  });
  
  const req2 = https.request({
    hostname: 'api.line.me',
    path: '/v2/bot/message/reply',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res2) => {
    console.log('LINE API Status:', res2.statusCode);
  });
  
  req2.on('error', (e) => {
    console.error('Error:', e.message);
  });
  
  req2.write(data);
  req2.end();
}