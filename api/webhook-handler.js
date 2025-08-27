// LINE Webhook Handler - Version 3.0.1 - NO FETCH
// Deploy Date: 2025-08-27
// IMPORTANT: Update VERSION when making changes to force cache refresh
const https = require('https');

// バージョン管理（Vercelキャッシュ対策）
const WEBHOOK_VERSION = '3.0.1';
const DEPLOY_DATE = '2025-08-27';

// メインハンドラー関数（Vercelが呼び出すエントリポイント）
exports.default = async function handler(req, res) {
  console.log(`=== Webhook v${WEBHOOK_VERSION} Start (${DEPLOY_DATE}) ===`);
  
  // 即座に200を返す（LINE APIの要件：30秒以内に応答が必要）
  res.status(200).end();
  
  // バックグラウンドで処理（200を返した後も処理は継続される）
  processWebhook(req.body).catch(err => {
    console.error('Background process error:', err);
  });
};

// Webhookイベントを処理する非同期関数
async function processWebhook(body) {
  try {
    // 受信したボディをログ出力（デバッグ用）
    console.log('Body:', JSON.stringify(body));
    
    // イベントが存在しない場合は処理を終了
    if (!body?.events?.[0]) {
      console.log('No events');
      return;
    }
    
    // 最初のイベントを取得（LINEは複数イベントを送る場合がある）
    const event = body.events[0];
    
    // テキストメッセージ以外は処理しない
    if (event.type !== 'message' || event.message?.type !== 'text') {
      console.log('Not a text message');
      return;
    }
    
    // メッセージ内容とユーザーIDをログ出力
    console.log('Message:', event.message.text);
    console.log('User:', event.source?.userId || 'unknown');
    
    // 環境変数からLINEアクセストークンを取得
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.error('NO TOKEN!');
      return;
    }
    
    console.log('Token found, preparing reply...');
    
    // LINE APIに送信するデータを準備
    const postData = JSON.stringify({
      replyToken: event.replyToken,  // 返信用の一時トークン（30秒間有効）
      messages: [{
        type: 'text',
        text: 'メッセージありがとうございます！\n予約はこちら：\nhttps://liff.line.me/2008001308-gDrXL5Y1'
      }]
    });
    
    // HTTPSリクエストをPromiseでラップ（async/awaitで使用可能にする）
    return new Promise((resolve, reject) => {
      // HTTPSリクエストオプション
      const options = {
        hostname: 'api.line.me',
        port: 443,
        path: '/v2/bot/message/reply',  // LINE Reply APIエンドポイント
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,  // Bearer認証
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)  // Content-Lengthは必須
        }
      };
      
      console.log('Sending HTTPS request to LINE...');
      
      // HTTPSリクエストを作成・送信
      const req = https.request(options, (res) => {
        console.log('LINE Response Status:', res.statusCode);
        
        // レスポンスデータを収集
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // レスポンス完了時の処理
        res.on('end', () => {
          console.log('LINE Response:', data);
          if (res.statusCode === 200) {
            console.log('✅ SUCCESS!');
          } else {
            console.error('❌ FAILED:', res.statusCode);
          }
          resolve();  // Promiseを解決
        });
      });
      
      // エラーハンドリング
      req.on('error', (e) => {
        console.error('HTTPS Error:', e);
        reject(e);  // Promiseを拒否
      });
      
      // POSTデータを送信してリクエストを終了
      req.write(postData);
      req.end();
      console.log('Request sent');
    });
    
  } catch (err) {
    console.error('Process error:', err);
  }
}