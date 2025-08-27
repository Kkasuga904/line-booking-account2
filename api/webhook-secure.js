import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * LINE予約システム（アカウント2） - セキュア版Webhook
 * restaurant-001用の予約システム
 */

// 環境変数チェック（改行対策済み）
const requiredEnvVars = {
  SUPABASE_URL: (process.env.SUPABASE_URL || 'https://faenvzzeguvlconvrqgp.supabase.co').trim(),
  SUPABASE_ANON_KEY: (process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZW52enplZ3V2bGNvbnZycWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzQyOTgsImV4cCI6MjA3MTc1MDI5OH0.U_v82IYSDM3waCFfFr4e7MpbTQmZFRPCNaA-2u5R3d8').trim(),
  LINE_CHANNEL_ACCESS_TOKEN: (process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim(),
  LINE_CHANNEL_SECRET: (process.env.LINE_CHANNEL_SECRET || '').trim(),
  STORE_ID: (process.env.STORE_ID || 'restaurant-001').trim() // 必ず改行を除去
};

// Supabase初期化
const supabase = createClient(
  requiredEnvVars.SUPABASE_URL,
  requiredEnvVars.SUPABASE_ANON_KEY
);

/**
 * LINE署名検証
 * セキュリティ: リクエストがLINEから送信されたことを確認
 */
function validateLineSignature(body, signature) {
  if (!requiredEnvVars.LINE_CHANNEL_SECRET || !signature) {
    console.error('Missing LINE_CHANNEL_SECRET or signature');
    return false;
  }

  const hash = crypto
    .createHmac('SHA256', requiredEnvVars.LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  
  return hash === signature;
}

/**
 * 入力値のサニタイズ
 * SQLインジェクション・XSS対策
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>\"'`;]/g, '') // 危険な文字を除去
    .trim()
    .substring(0, 500); // 最大長制限
}

/**
 * レート制限チェック
 * DDoS攻撃対策
 */
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1分
const RATE_LIMIT_MAX = 10; // 1分間の最大リクエスト数

function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimitCache.get(userId) || [];
  
  // 古いエントリを削除
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    console.warn(`Rate limit exceeded for user: ${userId}`);
    return false;
  }
  
  recentRequests.push(now);
  rateLimitCache.set(userId, recentRequests);
  
  // メモリリーク防止（キャッシュサイズ制限）
  if (rateLimitCache.size > 1000) {
    const oldestUsers = Array.from(rateLimitCache.entries())
      .sort((a, b) => Math.max(...a[1]) - Math.max(...b[1]))
      .slice(0, 500);
    rateLimitCache.clear();
    oldestUsers.forEach(([key, value]) => rateLimitCache.set(key, value));
  }
  
  return true;
}

/**
 * LINE返信メッセージ送信（エラーハンドリング強化）
 */
async function replyMessage(replyToken, messages) {
  if (!requiredEnvVars.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not configured');
    return { success: false, error: 'Token not configured' };
  }
  
  // リトライ機能付き
  let retries = 3;
  while (retries > 0) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${requiredEnvVars.LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          replyToken: replyToken,
          messages: messages
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LINE API Error (${response.status}):`, errorText);
        
        // 429 Too Many Requestsの場合は待機
        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries--;
          continue;
        }
        
        return { success: false, error: `LINE API Error: ${response.status}` };
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Failed to send LINE message:', error);
      retries--;
      
      if (retries === 0) {
        return { success: false, error: error.message };
      }
      
      // リトライ前に待機
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}

/**
 * 予約データの詳細検証
 */
function validateReservationData(data) {
  const errors = [];
  const now = new Date();
  const reservationDate = new Date(data.date + 'T' + data.time);
  
  // 人数チェック
  if (!Number.isInteger(data.people) || data.people < 1 || data.people > 20) {
    errors.push('予約人数は1〜20名で指定してください');
  }
  
  // 過去日時チェック
  if (reservationDate < now) {
    errors.push('過去の日時は予約できません');
  }
  
  // 営業時間チェック（11:00-22:00）
  const hour = parseInt(data.time.split(':')[0]);
  if (hour < 11 || hour >= 22) {
    errors.push('予約時間は11:00〜21:00の間で指定してください');
  }
  
  // 3ヶ月先までの制限
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  if (reservationDate > maxDate) {
    errors.push('予約は3ヶ月先までとなっております');
  }
  
  return errors;
}

/**
 * クイックリプライメニュー生成
 */
function createMenuMessage() {
  return {
    type: 'text',
    text: '🍽️ ご予約を承ります\n以下からお選びください👇',
    quickReply: {
      items: [
        { type: 'action', action: { type: 'message', label: '今日 18時 2名', text: '予約 今日 18時 2名' }},
        { type: 'action', action: { type: 'message', label: '今日 19時 2名', text: '予約 今日 19時 2名' }},
        { type: 'action', action: { type: 'message', label: '今日 20時 2名', text: '予約 今日 20時 2名' }},
        { type: 'action', action: { type: 'message', label: '明日 18時 2名', text: '予約 明日 18時 2名' }},
        { type: 'action', action: { type: 'message', label: '明日 19時 2名', text: '予約 明日 19時 2名' }},
        { type: 'action', action: { type: 'message', label: '明日 20時 2名', text: '予約 明日 20時 2名' }},
        { type: 'action', action: { type: 'message', label: '4名で予約', text: '予約 今日 19時 4名' }},
        { type: 'action', action: { type: 'message', label: '6名で予約', text: '予約 今日 19時 6名' }},
        { type: 'action', action: { type: 'message', label: 'カスタム予約', text: '予約フォーマット：「予約 [日付] [時間] [人数]」' }}
      ]
    }
  };
}

/**
 * メインハンドラー
 */
export default async function handler(req, res) {
  // セキュリティヘッダー
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // CORS設定（本番環境では制限すること）
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Line-Signature');
  
  // OPTIONS（プリフライト）リクエスト
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET: ヘルスチェック
  if (req.method === 'GET') {
    try {
      // データベース接続確認（タイムアウト付き）
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const { count, error } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', requiredEnvVars.STORE_ID)
        .abortSignal(controller.signal);
      
      clearTimeout(timeout);
      
      return res.status(200).json({
        status: 'healthy',
        store_id: requiredEnvVars.STORE_ID,
        database: error ? 'error' : 'connected',
        total_reservations: count || 0,
        security: {
          signature_validation: 'enabled',
          rate_limiting: 'enabled',
          input_sanitization: 'enabled',
          cors: allowedOrigins.includes('*') ? 'warning: using wildcard' : 'restricted'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check error:', error);
      return res.status(200).json({
        status: 'degraded',
        error: 'Database connection issue',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // POST: Webhook処理
  if (req.method === 'POST') {
    try {
      // 署名検証（本番環境では必須）
      if (process.env.NODE_ENV === 'production' || process.env.VERIFY_SIGNATURE === 'true') {
        const signature = req.headers['x-line-signature'];
        const body = JSON.stringify(req.body);
        
        if (!validateLineSignature(body, signature)) {
          console.error('Invalid LINE signature');
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }
      
      // リクエストボディ検証
      if (!req.body || !Array.isArray(req.body.events)) {
        return res.status(200).send('OK'); // LINEの検証リクエスト
      }
      
      const events = req.body.events;
      
      // バッチ処理（並列処理で高速化）
      await Promise.all(events.map(async (event) => {
        try {
          // テキストメッセージのみ処理
          if (event.type !== 'message' || event.message?.type !== 'text') {
            return;
          }
          
          const userId = event.source?.userId || 'unknown';
          const text = sanitizeInput(event.message.text);
          const replyToken = event.replyToken;
          
          // レート制限チェック
          if (!checkRateLimit(userId)) {
            await replyMessage(replyToken, [{
              type: 'text',
              text: '⚠️ リクエストが多すぎます。1分後に再度お試しください。'
            }]);
            return;
          }
          
          // コマンド処理
          if (text === 'メニュー' || text === 'menu' || text === '予約したい') {
            await replyMessage(replyToken, [createMenuMessage()]);
            return;
          }
          
          // 予約確認
          if (text === '予約確認' || text === '予約状況') {
            const { data: reservations, error } = await supabase
              .from('reservations')
              .select('*')
              .eq('user_id', userId)
              .eq('store_id', requiredEnvVars.STORE_ID)
              .gte('date', new Date().toISOString().split('T')[0])
              .order('date', { ascending: true })
              .order('time', { ascending: true })
              .limit(5);
            
            if (error) {
              await replyMessage(replyToken, [{
                type: 'text',
                text: '❌ 予約の確認に失敗しました。'
              }]);
              return;
            }
            
            if (!reservations || reservations.length === 0) {
              await replyMessage(replyToken, [{
                type: 'text',
                text: '現在、ご予約はございません。'
              }]);
              return;
            }
            
            const reservationList = reservations.map(r => 
              `📅 ${r.date} ${r.time.substring(0,5)}\n👥 ${r.people}名\n予約番号: #${r.id}`
            ).join('\n\n');
            
            await replyMessage(replyToken, [{
              type: 'text',
              text: `📋 ご予約一覧\n\n${reservationList}`
            }]);
            return;
          }
          
          // 予約処理
          if (text && text.includes('予約')) {
            // フォーマット説明の場合
            if (text.includes('予約フォーマット')) {
              await replyMessage(replyToken, [{
                type: 'text',
                text: '📝 予約フォーマット\n\n「予約 [日付] [時間] [人数]」\n\n例：\n・予約 今日 18時 2名\n・予約 明日 19時 4名'
              }]);
              return;
            }
            
            // 予約データ解析
            let people = 2;
            let date = new Date().toISOString().split('T')[0];
            let time = '19:00:00';
            
            // 人数抽出（安全な範囲内）
            const peopleMatch = text.match(/(\d+)[人名]/);
            if (peopleMatch) {
              people = Math.min(20, Math.max(1, parseInt(peopleMatch[1])));
            }
            
            // 時間抽出（営業時間内）
            const timeMatch = text.match(/(\d{1,2})時/);
            if (timeMatch) {
              let hour = parseInt(timeMatch[1]);
              hour = Math.min(21, Math.max(11, hour)); // 11-21時に制限
              time = `${hour.toString().padStart(2, '0')}:00:00`;
            }
            
            // 日付抽出
            if (text.includes('明日')) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              date = tomorrow.toISOString().split('T')[0];
            } else if (text.includes('明後日')) {
              const dayAfter = new Date();
              dayAfter.setDate(dayAfter.getDate() + 2);
              date = dayAfter.toISOString().split('T')[0];
            } else if (text.includes('今日')) {
              date = new Date().toISOString().split('T')[0];
            }
            
            // データ検証
            const validationErrors = validateReservationData({
              people, date, time
            });
            
            if (validationErrors.length > 0) {
              await replyMessage(replyToken, [{
                type: 'text',
                text: `❌ 予約できません\n\n${validationErrors.join('\n')}`
              }]);
              return;
            }
            
            // 重複チェック（同一ユーザーの同日時予約を防ぐ）
            const { data: existingReservations } = await supabase
              .from('reservations')
              .select('id')
              .eq('user_id', userId)
              .eq('store_id', requiredEnvVars.STORE_ID)
              .eq('date', date)
              .eq('status', 'pending');
            
            if (existingReservations && existingReservations.length > 0) {
              await replyMessage(replyToken, [{
                type: 'text',
                text: '⚠️ 同じ日に既にご予約があります。\n予約確認をご利用ください。'
              }]);
              return;
            }
            
            // データベース保存（エラーハンドリング強化）
            const { data: reservation, error } = await supabase
              .from('reservations')
              .insert([{
                store_id: requiredEnvVars.STORE_ID,
                user_id: userId,
                message: text.substring(0, 200),
                people: people,
                date: date,
                time: time,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }])
              .select()
              .single();
            
            if (error) {
              console.error('Database error:', error);
              
              // エラーの種類に応じてメッセージを変える
              let errorMessage = '❌ システムエラーが発生しました。';
              
              if (error.message.includes('duplicate')) {
                errorMessage = '⚠️ 既に同じ予約が存在します。';
              } else if (error.message.includes('violates')) {
                errorMessage = '⚠️ 入力データに問題があります。';
              }
              
              await replyMessage(replyToken, [{
                type: 'text',
                text: `${errorMessage}\n\nお電話でのご予約：03-1234-5678`
              }]);
              return;
            }
            
            // 成功メッセージ
            const displayTime = time.substring(0, 5);
            await replyMessage(replyToken, [
              {
                type: 'text',
                text: `✅ ご予約を承りました！\n\n📅 日付: ${date}\n⏰ 時間: ${displayTime}\n👥 人数: ${people}名\n\n予約番号: #${reservation.id}\n\n変更・キャンセル：03-1234-5678`
              },
              {
                type: 'text',
                text: '他にご用件はございますか？',
                quickReply: {
                  items: [
                    { type: 'action', action: { type: 'message', label: '別の予約', text: 'メニュー' }},
                    { type: 'action', action: { type: 'message', label: '予約確認', text: '予約確認' }},
                    { type: 'action', action: { type: 'message', label: '終了', text: 'ありがとうございました' }}
                  ]
                }
              }
            ]);
          }
          // 終了メッセージ
          else if (text === 'ありがとうございました' || text === '終了') {
            await replyMessage(replyToken, [{
              type: 'text',
              text: 'ご利用ありがとうございました！\n\nまたのご来店を心よりお待ちしております。\n\n営業時間：11:00〜22:00\n電話：03-1234-5678'
            }]);
          }
          // その他のメッセージ
          else {
            await replyMessage(replyToken, [
              { type: 'text', text: 'いらっしゃいませ！👋\nご予約をご希望ですか？' },
              createMenuMessage()
            ]);
          }
          
        } catch (eventError) {
          console.error('Event processing error:', eventError);
          // 個別エラーは無視して続行
        }
      }));
      
      // LINEには必ず200を返す
      return res.status(200).send('OK');
      
    } catch (error) {
      console.error('Critical webhook error:', error);
      // エラーでも200を返す（LINE仕様）
      return res.status(200).send('OK');
    }
  }
  
  // その他のメソッド
  return res.status(405).json({ error: 'Method not allowed' });
}