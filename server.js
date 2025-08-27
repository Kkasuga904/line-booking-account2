/**
 * LINE予約システム - アカウント2（店舗B）
 * ポート: 3002
 */

import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = 3002;

// 店舗2の設定
const STORE_NAME = "居酒屋 福";
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN_2 || 'tEqSEwb4iCDsEIeoSWvGvyAyt3Swa/P5OpxRoI6kHs/9rPDK92cHZ9voM7NWp3SmCsYIQLiUdSgfSzqP1DV3MK7muFxpWMau1B1bMKXqsAQiAdrejzzSjvoncLmJzrkxMSREnPRkJ88grVyzDztaNAdB04t89/1O/w1cDnyilFU=';
const SECRET = process.env.LINE_CHANNEL_SECRET_2 || 'cd2213ae47341f3cd302eea78559e0f8';

app.use(express.json());

// ログミドルウェア
app.use((req, res, next) => {
  console.log(`[店舗2] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ホーム
app.get('/', (req, res) => {
  res.json({
    store: STORE_NAME,
    status: 'online',
    port: PORT,
    endpoints: {
      webhook: `http://localhost:${PORT}/api/webhook`,
      test: `http://localhost:${PORT}/test`
    }
  });
});

// Webhookエンドポイント
app.post('/api/webhook', async (req, res) => {
  const events = req.body?.events || [];
  
  if (events.length === 0) {
    return res.status(200).end();
  }
  
  for (const event of events) {
    if (event.type === 'message' && event.message?.type === 'text') {
      const userMessage = event.message.text;
      console.log(`[${STORE_NAME}] メッセージ受信: ${userMessage}`);
      
      let replyText = '';
      
      if (userMessage.includes('予約')) {
        replyText = `【${STORE_NAME}】\nご予約承りました！\n\n🍺 営業時間\n平日: 17:00-24:00\n金土: 17:00-26:00\n定休日: 日曜日\n\n席のご希望がございましたらお知らせください。`;
      } else if (userMessage.includes('キャンセル')) {
        replyText = `【${STORE_NAME}】\nキャンセル承知いたしました。\nまたのご来店をお待ちしております！`;
      } else if (userMessage.includes('メニュー')) {
        replyText = `【${STORE_NAME}】人気メニュー\n\n🍺 生ビール 500円\n🍶 日本酒各種 600円〜\n🍗 唐揚げ 680円\n🍣 刺身盛り 1,280円\n🍜 〆のラーメン 780円`;
      } else if (userMessage.includes('営業時間')) {
        replyText = `【${STORE_NAME}】営業時間\n\n月〜木: 17:00-24:00\n金土: 17:00-26:00\n日曜: 定休日\n\n🍺 ラストオーダーは閉店30分前`;
      } else {
        replyText = `【${STORE_NAME}】へようこそ！\n\nご利用可能なコマンド：\n・予約\n・キャンセル\n・メニュー\n・営業時間\n\nお気軽にお問い合わせください🍺`;
      }
      
      // LINE APIで返信（実際には失敗するがログ出力）
      console.log(`[${STORE_NAME}] 返信: ${replyText}`);
      
      if (event.replyToken && event.replyToken !== 'TEST_REPLY_TOKEN') {
        try {
          const response = await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: replyText }]
            })
          });
          console.log(`[${STORE_NAME}] LINE API応答: ${response.status}`);
        } catch (error) {
          console.error(`[${STORE_NAME}] エラー:`, error.message);
        }
      }
    }
  }
  
  res.status(200).end();
});

// テストエンドポイント
app.post('/test', (req, res) => {
  const text = req.body.text || 'テスト';
  console.log(`[${STORE_NAME}] テスト: ${text}`);
  
  const mockEvent = {
    events: [{
      type: 'message',
      message: { type: 'text', text },
      source: { userId: 'TEST_USER' },
      replyToken: 'TEST_REPLY_TOKEN'
    }]
  };
  
  // Webhookとして処理
  app._router.stack.forEach(layer => {
    if (layer.route?.path === '/api/webhook') {
      layer.handle({ body: mockEvent, method: 'POST' }, res, () => {});
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║  LINE予約システム - アカウント2                ║
║  店舗名: ${STORE_NAME}                         ║
║  ポート: ${PORT}                               ║
╚═══════════════════════════════════════════════╝

URL: http://localhost:${PORT}
テスト: curl -X POST http://localhost:${PORT}/test -H "Content-Type: application/json" -d '{"text":"予約"}'
  `);
});