/**
 * 予約変更API
 * 
 * 主な機能：
 * - 日時、人数の変更
 * - 変更可能期限チェック
 * - 営業時間・人数制限の検証
 * - 環境変数の自動サニタイズ
 */

import { getEnv } from '../utils/env-helper.js';

/**
 * 変更可能かチェック
 * @param {Date} reservationDate - 予約日時
 * @returns {boolean} 変更可能な場合true
 */
function isModifiable(reservationDate) {
  const now = new Date();
  const hoursUntilReservation = (reservationDate - now) / (1000 * 60 * 60);
  return hoursUntilReservation >= 6; // 6時間前まで
}

/**
 * 営業時間の検証
 * @param {number} hour - 時間（時）
 * @returns {boolean} 営業時間内の場合true
 */
function isBusinessHour(hour) {
  const openHour = parseInt(getEnv('OPEN_HOUR', '10'));
  const closeHour = parseInt(getEnv('CLOSE_HOUR', '21'));
  return hour >= openHour && hour < closeHour;
}

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed' 
    });
  }
  
  try {
    const { 
      reservation_id, 
      new_date, 
      new_time, 
      new_people 
    } = req.body;
    
    // 必須パラメータチェック
    if (!reservation_id) {
      return res.status(400).json({ 
        error: '予約IDが必要です' 
      });
    }
    
    // 変更内容がない場合
    if (!new_date && !new_time && !new_people) {
      return res.status(400).json({ 
        error: '変更内容が指定されていません' 
      });
    }
    
    // 仮の現在予約データ（実際はDBから取得）
    const currentReservation = {
      id: reservation_id,
      customer_name: 'ゲスト',
      date: '2024-12-25',
      time: '19:00',
      people: 2
    };
    
    // 変更後の予約データを作成
    const updatedReservation = {
      ...currentReservation,
      date: new_date || currentReservation.date,
      time: new_time || currentReservation.time,
      people: new_people || currentReservation.people
    };
    
    // 人数制限チェック
    if (new_people) {
      if (new_people < 1 || new_people > 20) {
        return res.status(400).json({ 
          error: '人数は1名と1名を620名で指定してください' 
        });
      }
    }
    
    // 新しい時間の営業時間チェック
    if (new_time) {
      const hour = parseInt(new_time.split(':')[0]);
      if (!isBusinessHour(hour)) {
        const openHour = getEnv('OPEN_HOUR', '10');
        const closeHour = getEnv('CLOSE_HOUR', '21');
        return res.status(400).json({ 
          error: `営業時間内（${openHour}:00〜${closeHour}:00）で指定してください` 
        });
      }
    }
    
    // 新しい予約日時を作成
    const newReservationDate = new Date(
      `${updatedReservation.date} ${updatedReservation.time}`
    );
    
    // 変更可能かチェック
    if (!isModifiable(newReservationDate)) {
      return res.status(400).json({ 
        error: '変更期限を過ぎています（6時間前まで）' 
      });
    }
    
    // 過去日付チェック
    if (new_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const requestedDate = new Date(new_date);
      if (requestedDate < today) {
        return res.status(400).json({ 
          error: '過去の日付は指定できません' 
        });
      }
    }
    
    // 変更処理（実際はDB更新）
    console.log('予約変更:', {
      reservation_id,
      changes: {
        date: new_date ? `${currentReservation.date} → ${new_date}` : null,
        time: new_time ? `${currentReservation.time} → ${new_time}` : null,
        people: new_people ? `${currentReservation.people} → ${new_people}` : null
      },
      modified_at: new Date().toISOString()
    });
    
    // 成功レスポンス
    return res.status(200).json({
      success: true,
      message: '予約を変更しました',
      reservation: {
        ...updatedReservation,
        modified_at: new Date().toISOString()
      },
      changes: {
        date: new_date ? true : false,
        time: new_time ? true : false,
        people: new_people ? true : false
      }
    });
    
  } catch (error) {
    console.error('Modification error:', error);
    return res.status(500).json({ 
      error: '変更処理に失敗しました',
      details: error.message 
    });
  }
}