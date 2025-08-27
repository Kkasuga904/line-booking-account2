// Account 2 Webhook Handler - CommonJS Version
// Version: 3.0.0 - Using .cjs extension
// Store ID: restaurant-002
// Deploy Date: 2025-08-27

const https = require('https');

const WEBHOOK_VERSION = '3.0.0';
const DEPLOY_DATE = '2025-08-27';
const STORE_ID = 'restaurant-002';

// Vercel serverless function handler
module.exports = async function handler(req, res) {
  console.log(`=== Account 2 Webhook v${WEBHOOK_VERSION} Start (${DEPLOY_DATE}) ===`);
  console.log('Store ID:', STORE_ID);
  
  // 即座に200を返す（重要）
  res.status(200).end();
  
  // バックグラウンドで処理
  processWebhook(req.body).catch(err => {
    console.error('Background process error:', err);
  });
};

async function processWebhook(body) {
  console.log('Processing webhook body...');
  
  if (!body || !body.events || body.events.length === 0) {
    console.log('No events in webhook body');
    return;
  }
  
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.error('ERROR: LINE_CHANNEL_ACCESS_TOKEN not set!');
    return;
  }
  
  console.log('Token found, processing events...');
  
  for (const event of body.events) {
    console.log(`Event type: ${event.type}`);
    
    if (event.type === 'message' && event.message?.type === 'text') {
      const userMessage = event.message.text;
      const replyToken = event.replyToken;
      
      console.log(`User message: "${userMessage}"`);
      console.log(`Reply token: ${replyToken?.substring(0, 20)}...`);
      
      // メッセージに応じた返信
      let replyText = '';
      
      if (userMessage.includes('予約')) {
        replyText = `📅 Account 2 - ご予約承りました！\n\n詳細な予約は下記リンクからお願いします：\nhttps://liff.line.me/2008001308-gDrXL5Y1\n\nStore: ${STORE_ID}`;
      } else if (userMessage.includes('キャンセル')) {
        replyText = '❌ Account 2 - 予約のキャンセルを承りました。';
      } else if (userMessage.includes('変更')) {
        replyText = '✏️ Account 2 - 予約の変更を承りました。';
      } else {
        replyText = `🍽️ Account 2へようこそ！\n\n「予約」と入力して予約を開始してください。\n\nStore: ${STORE_ID}`;
      }
      
      // HTTPSで返信送信
      await sendReplyWithHttps(replyToken, replyText, token);
    }
  }
}

function sendReplyWithHttps(replyToken, text, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      replyToken: replyToken,
      messages: [{
        type: 'text',
        text: text
      }]
    });
    
    const options = {
      hostname: 'api.line.me',
      port: 443,
      path: '/v2/bot/message/reply',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    console.log('Sending HTTPS request to LINE API...');
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`LINE API Response: ${res.statusCode}`);
        if (responseData) {
          console.log('Response data:', responseData);
        }
        if (res.statusCode === 200) {
          console.log('✅ Reply sent successfully!');
        } else {
          console.error('❌ Reply failed with status:', res.statusCode);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('HTTPS Request error:', error);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}