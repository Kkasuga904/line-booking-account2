// Account 2 - Final webhook with await-based reply
// Version: FINAL-1.0
// Store: restaurant-002

const https = require('https');

module.exports = async function handler(req, res) {
  console.log('=== Account 2 Webhook FINAL v1.0 START ===');
  
  try {
    const body = req.body;
    const event = body?.events?.[0];
    
    console.log('Event received:', JSON.stringify(event, null, 2));

    // 返信不要なイベントは即200
    if (!event || event.type !== 'message' || !event.replyToken) {
      console.log('Skipping non-message event');
      res.status(200).json({ ok: true, skipped: true });
      return;
    }

    // Account 2用のトークン
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!token) {
      console.error('CRITICAL: LINE_CHANNEL_ACCESS_TOKEN not set!');
      res.status(200).json({ ok: false, error: 'No token' });
      return;
    }

    console.log('Token exists, length:', token.length);
    console.log('Reply token:', event.replyToken.substring(0, 20) + '...');
    console.log('Message text:', event.message?.text);

    // ---- awaitで同期的に送信（バックグラウンドにしない） ----
    console.log('Sending reply to LINE API...');
    
    const replyData = {
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: `[Account 2] メッセージを受信しました: ${event.message?.text || 'unknown'}\nStore: restaurant-002\n時刻: ${new Date().toISOString()}`
      }]
    };
    
    console.log('Request body:', JSON.stringify(replyData, null, 2));
    
    // HTTPSモジュールを使用してPOST
    const result = await sendLineReply(token, replyData);
    
    console.log('LINE API Response Status:', result.status);
    console.log('LINE API Response Body:', result.body);

    if (result.status !== 200) {
      // エラー詳細をログ出力
      console.error('LINE API Error:', {
        status: result.status,
        body: result.body
      });
      
      // 典型的なエラー
      if (result.status === 400) {
        console.error('400 Bad Request - Invalid reply token or expired');
      } else if (result.status === 401) {
        console.error('401 Unauthorized - Token invalid or wrong account');
      }
      
      res.status(200).json({ 
        ok: false, 
        lineStatus: result.status, 
        lineError: result.body 
      });
      return;
    }

    console.log('✅ Reply sent successfully!');
    res.status(200).json({ ok: true, sent: true });
    
  } catch (e) {
    console.error('Webhook error:', e);
    console.error('Stack trace:', e.stack);
    // LINE側の再送を避けるため200を返す
    res.status(200).json({ ok: false, error: e.message });
  }
  
  console.log('=== Account 2 Webhook FINAL END ===');
};

// HTTPSでLINE APIに送信（CommonJS環境用）
function sendLineReply(token, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
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
    
    console.log('HTTPS Request options:', JSON.stringify(options, null, 2));
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });
    
    req.on('error', (error) => {
      console.error('HTTPS Request error:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}