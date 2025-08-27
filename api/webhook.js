// LINE Webhook - Using https module for better compatibility
// Updated: 2025-08-27 - Force cache clear
import https from 'https';

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
    if (event.source?.userId) {
      console.log('From user:', event.source.userId);
    }
    
    // LINE Reply API
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.error('ERROR: No LINE_CHANNEL_ACCESS_TOKEN in environment variables!');
      return;
    }
    
    console.log('Token exists, sending reply...');
    
    // Using https module instead of fetch
    const postData = JSON.stringify({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',  
        text: `メッセージありがとうございます！\n\nご予約はカレンダーからどうぞ：\nhttps://liff.line.me/2008001308-gDrXL5Y1`
      }]
    });
    
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
    
    console.log('Sending to LINE API...');
    const replyRequest = https.request(options, (replyRes) => {
      console.log('LINE API Response Status:', replyRes.statusCode);
      console.log('LINE API Response Headers:', replyRes.headers);
      
      let data = '';
      
      replyRes.on('data', (chunk) => {
        data += chunk;
      });
      
      replyRes.on('end', () => {
        console.log('LINE API Response Body:', data);
        if (replyRes.statusCode === 200) {
          console.log('✅ Reply sent successfully!');
        } else {
          console.error('❌ LINE API ERROR:', replyRes.statusCode);
          console.error('Error details:', data);
          console.error('Token preview:', token.substring(0, 10) + '...' + token.slice(-4));
        }
      });
    });
    
    replyRequest.on('error', (e) => {
      console.error('HTTPS Request error:', e.message);
      console.error('Error stack:', e.stack);
    });
    
    console.log('Writing POST data:', postData);
    replyRequest.write(postData);
    replyRequest.end();
    console.log('Request sent to LINE API');
    
  } catch (e) {
    console.error('Exception in webhook:', e.message);
    console.error(e.stack);
  }
  
  console.log('=== Webhook End ===');
}