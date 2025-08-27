// LINE Webhook Handler - Version 3.0 - NO FETCH
const https = require('https');

exports.default = async function handler(req, res) {
  console.log('=== Webhook v3.0 Start ===');
  
  // 即座に200を返す
  res.status(200).end();
  
  // バックグラウンドで処理
  processWebhook(req.body).catch(err => {
    console.error('Background process error:', err);
  });
};

async function processWebhook(body) {
  try {
    console.log('Body:', JSON.stringify(body));
    
    if (!body?.events?.[0]) {
      console.log('No events');
      return;
    }
    
    const event = body.events[0];
    if (event.type !== 'message' || event.message?.type !== 'text') {
      console.log('Not a text message');
      return;
    }
    
    console.log('Message:', event.message.text);
    console.log('User:', event.source?.userId || 'unknown');
    
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.error('NO TOKEN!');
      return;
    }
    
    console.log('Token found, preparing reply...');
    
    // HTTPSで送信
    const postData = JSON.stringify({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: 'メッセージありがとうございます！\n予約はこちら：\nhttps://liff.line.me/2008001308-gDrXL5Y1'
      }]
    });
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.line.me',
        port: 443,
        path: '/v2/bot/message/reply',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      console.log('Sending HTTPS request to LINE...');
      
      const req = https.request(options, (res) => {
        console.log('LINE Response Status:', res.statusCode);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('LINE Response:', data);
          if (res.statusCode === 200) {
            console.log('✅ SUCCESS!');
          } else {
            console.error('❌ FAILED:', res.statusCode);
          }
          resolve();
        });
      });
      
      req.on('error', (e) => {
        console.error('HTTPS Error:', e);
        reject(e);
      });
      
      req.write(postData);
      req.end();
      console.log('Request sent');
    });
    
  } catch (err) {
    console.error('Process error:', err);
  }
}