/**
 * 予約リマインダー送信API
 * 
 * 主な機能：
 * - 翌日の予約リマインダー送信
 * - LINEメッセージングAPI連携
 * - バッチ処理対応
 * - 環境変数の自動サニタイズ
 */

import { getEnv } from '../utils/env-helper.js';

/**
 * LINEメッセージ送信
 * @param {string} userId - LINEユーザーID
 * @param {Object} reservation - 予約情報
 */
async function sendLineReminder(userId, reservation) {
  const accessToken = getEnv('LINE_CHANNEL_ACCESS_TOKEN');
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not set');
    return false;
  }
  
  const storeName = decodeURIComponent(getEnv('STORE_NAME', '店舗'));
  
  // Flex Message形式のリマインダー
  const message = {
    type: 'flex',
    altText: '🔔 明日のご予約のお知らせ',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🔔 リマインダー',
            weight: 'bold',
            size: 'lg',
            color: '#ffffff'
          },
          {
            type: 'text',
            text: '明日のご予約のお知らせ',
            size: 'sm',
            color: '#ffffff99'
          }
        ],
        backgroundColor: '#ff9500',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${reservation.customer_name}様`,
            weight: 'bold',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'text',
            text: `明日のご予約をお待ちしております。`,
            wrap: true,
            margin: 'md',
            color: '#666666'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '店舗：',
                    color: '#999999',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: storeName,
                    flex: 5
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '日時：',
                    color: '#999999',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: `${reservation.date} ${reservation.time}`,
                    flex: 5
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '人数：',
                    color: '#999999',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: `${reservation.people}名様`,
                    flex: 5
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'message',
              label: '予約を確認',
              text: '予約確認'
            },
            style: 'primary',
            color: '#ff9500'
          },
          {
            type: 'text',
            text: '※ キャンセルの場合はお早めにご連絡ください',
            size: 'xs',
            color: '#999999',
            margin: 'md',
            align: 'center'
          }
        ]
      }
    }
  };
  
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to: userId,
        messages: [message]
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('LINE push error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send reminder:', error);
    return false;
  }
}

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed' 
    });
  }
  
  // 管理者認証（簡易版）
  const adminToken = req.headers['x-admin-token'];
  if (adminToken !== getEnv('ADMIN_TOKEN', 'admin-secret-token')) {
    return res.status(401).json({ 
      error: 'Unauthorized' 
    });
  }
  
  try {
    // 明日の予約を取得（実際はDBから）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // 仮の予約データ
    const mockReservations = [
      {
        id: 'res-001',
        customer_name: '山田太郎',
        user_id: 'U12345678901234567890123456789012',
        date: tomorrowStr,
        time: '19:00',
        people: 2
      },
      {
        id: 'res-002',
        customer_name: '佐藤花子',
        user_id: 'U23456789012345678901234567890123',
        date: tomorrowStr,
        time: '18:00',
        people: 4
      }
    ];
    
    // リマインダー送信
    const results = [];
    for (const reservation of mockReservations) {
      const sent = await sendLineReminder(reservation.user_id, reservation);
      results.push({
        reservation_id: reservation.id,
        customer_name: reservation.customer_name,
        sent: sent,
        timestamp: new Date().toISOString()
      });
    }
    
    // 送信結果の集計
    const successCount = results.filter(r => r.sent).length;
    const failureCount = results.filter(r => !r.sent).length;
    
    return res.status(200).json({
      success: true,
      message: `リマインダー送信完了`,
      summary: {
        total: results.length,
        success: successCount,
        failure: failureCount,
        date: tomorrowStr
      },
      results: results
    });
    
  } catch (error) {
    console.error('Reminder error:', error);
    return res.status(500).json({ 
      error: 'リマインダー送信に失敗しました',
      details: error.message 
    });
  }
}