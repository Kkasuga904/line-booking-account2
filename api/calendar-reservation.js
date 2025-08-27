/**
 * カレンダーからの予約受付API - Version 2.0.1
 * Deploy Date: 2025-08-27
 * 
 * 主な機能：
 * - LIFFカレンダーUIからの予約受付
 * - バリデーション処理
 * - Supabaseデータベースへの保存（確実に保存）
 * - 予約ID発行
 * - 環境変数の自動サニタイズ
 */

import { createClient } from '@supabase/supabase-js';

// Supabase設定（Account 2専用）
const SUPABASE_URL = 'https://faenvzzeguvlconvrqgp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZW52enplZ3V2bGNvbnZycWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzQyOTgsImV4cCI6MjA3MTc1MDI5OH0.U_v82IYSDM3waCFfFr4e7MpbTQmZFRPCNaA-2u5R3d8';

// Supabaseクライアント初期化
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 環境変数ヘルパー関数
function getEnv(key, defaultValue = '') {
  const value = process.env[key] || defaultValue;
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * 予約ID生成
 * @returns {string} 予約ID
 */
function generateReservationId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `RES-${timestamp}-${random}`.toUpperCase();
}

/**
 * 営業時間チェック
 * @param {string} time - 時刻文字列 (HH:MM:SS)
 * @returns {boolean} 営業時間内ならtrue
 */
function isWithinBusinessHours(time) {
  const hour = parseInt(time.split(':')[0]);
  const openHour = parseInt(getEnv('OPEN_HOUR', '10'));
  const closeHour = parseInt(getEnv('CLOSE_HOUR', '21'));
  return hour >= openHour && hour < closeHour;
}

/**
 * 日付の妥当性チェック
 * @param {string} dateStr - 日付文字列 (YYYY-MM-DD)
 * @returns {Object} 検証結果
 */
function validateDate(dateStr) {
  const requestedDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  requestedDate.setHours(0, 0, 0, 0);
  
  // 過去日付チェック
  if (requestedDate < today) {
    return { valid: false, error: '過去の日付は指定できません' };
  }
  
  // 30日以上先の日付チェック
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  if (requestedDate > maxDate) {
    return { valid: false, error: '30日以上先の予約は受け付けておりません' };
  }
  
  return { valid: true };
}

export default async function handler(req, res) {
  console.log('=== Calendar Reservation API v2.0.1 Start ===');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body));
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'POSTメソッドのみ対応しています'
    });
  }
  
  try {
    const {
      store_id,
      customer_name,
      user_id,
      date,
      time,
      people,
      note,
      phone,
      email
    } = req.body;
    
    // 必須フィールドの検証
    if (!customer_name || !date || !time) {
      return res.status(400).json({ 
        error: '必須項目が入力されていません',
        required: ['customer_name', 'date', 'time']
      });
    }
    
    // 日付検証
    const dateValidation = validateDate(date);
    if (!dateValidation.valid) {
      return res.status(400).json({ 
        error: dateValidation.error 
      });
    }
    
    // 営業時間チェック
    if (!isWithinBusinessHours(time)) {
      const openHour = getEnv('OPEN_HOUR', '10');
      const closeHour = getEnv('CLOSE_HOUR', '21');
      return res.status(400).json({ 
        error: `営業時間外です。営業時間: ${openHour}:00〜${closeHour}:00` 
      });
    }
    
    // 人数検証
    const peopleCount = parseInt(people) || 2;
    if (peopleCount < 1 || peopleCount > 20) {
      return res.status(400).json({ 
        error: '人数は1名から20名までで指定してください' 
      });
    }
    
    // 時間フォーマット調整（HH:MM → HH:MM:SS）
    const formattedTime = time.length === 5 ? `${time}:00` : time;
    
    // 予約データを作成（store_idを確実にrestaurant-002に設定）
    const reservation = {
      store_id: 'restaurant-002',  // Account 2は必ずrestaurant-002
      customer_name: customer_name.trim(),
      user_id: user_id || 'guest',
      date: date,
      time: formattedTime,
      people: peopleCount,
      message: note || `カレンダーから予約: ${date} ${time}`,
      phone: phone || null,
      email: email || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('新規予約を保存中 (Account 2):', reservation);
    
    // Supabaseに保存
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservation])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase保存エラー:', error);
      return res.status(500).json({ 
        error: '予約の保存に失敗しました',
        details: error.message 
      });
    }
    
    console.log('予約保存成功 (ID:', data.id, ')');
    
    // 成功レスポンス
    return res.status(200).json({
      success: true,
      message: '予約を受け付けました',
      reservation: data,
      reservation_id: data.id
    });
    
  } catch (error) {
    console.error('Reservation error:', error);
    return res.status(500).json({ 
      error: '予約処理に失敗しました',
      message: error.message 
    });
  }
}