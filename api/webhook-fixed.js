// 修正版Webhook - 即200を返すように変更
import { createClient } from '@supabase/supabase-js';

// Supabase初期化
const SUPABASE_URL = 'https://faenvzzeguvlconvrqgp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZW52enplZ3V2bGNvbnZycWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzQyOTgsImV4cCI6MjA3MTc1MDI5OH0.U_v82IYSDM3waCFfFr4e7MpbTQmZFRPCNaA-2u5R3d8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 環境変数ヘルパー
function getEnv(key, defaultValue = '') {
  const value = process.env[key] || defaultValue;
  return typeof value === 'string' ? value.trim() : value;
}

// LINE返信メッセージ送信（非同期で実行）
async function replyMessage(replyToken, messages) {
  const accessToken = getEnv('LINE_CHANNEL_ACCESS_TOKEN');
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not set');
    return;
  }
  
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: messages
      })
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('LINE reply error:', {
        status: response.status,
        body: errorBody,
        token_preview: `${accessToken.substring(0,4)}...${accessToken.slice(-4)}`
      });
    } else {
      console.log('Reply sent successfully');
    }
  } catch (error) {
    console.error('Failed to send reply:', error);
  }
}

export default async function handler(req, res) {
  // ⚡ 即座に200を返す（最重要！）
  res.status(200).end();
  
  // 以降は非同期で処理
  try {
    // リクエストボディの検証
    if (!req.body || !req.body.events) {
      console.log('No events in request');
      return;
    }
    
    const events = req.body.events;
    console.log(`Processing ${events.length} events`);
    
    // イベント処理
    for (const event of events) {
      if (event.type !== 'message' || event.message.type !== 'text') {
        continue;
      }
      
      const { replyToken, source, message } = event;
      const text = message.text;
      const userId = source.userId;
      
      console.log('Processing message:', {
        text: text,
        userId: userId,
        replyToken: replyToken.substring(0, 10) + '...'
      });
      
      // シンプルなメニューメッセージ
      if (text === 'メニュー' || text === '予約') {
        const menuMessage = {
          type: 'text',
          text: 'ご予約はカレンダーからどうぞ！',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'uri',
                  label: '📅 カレンダーで予約',
                  uri: 'https://liff.line.me/2008001308-gDrXL5Y1'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '📋 予約確認',
                  text: '予約確認'
                }
              }
            ]
          }
        };
        
        await replyMessage(replyToken, [menuMessage]);
        
      } else if (text === '予約確認') {
        // ユーザーの最新予約を取得
        const { data: reservations } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', userId)
          .eq('store_id', 'restaurant-002')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (reservations && reservations.length > 0) {
          const r = reservations[0];
          await replyMessage(replyToken, [{
            type: 'text',
            text: `📋 最新の予約情報\n\n日付: ${r.date}\n時間: ${r.time}\n人数: ${r.people}名\n予約ID: ${r.id}`
          }]);
        } else {
          await replyMessage(replyToken, [{
            type: 'text',
            text: '予約が見つかりません。'
          }]);
        }
        
      } else {
        // デフォルトメッセージ
        await replyMessage(replyToken, [{
          type: 'text',
          text: `メッセージありがとうございます！\n「メニュー」と送信して予約画面を開いてください。`
        }]);
      }
    }
    
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
}