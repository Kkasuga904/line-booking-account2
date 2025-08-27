/**
 * 予約キャンセルAPI
 * 
 * 主な機能：
 * - 予約IDによるキャンセル処理
 * - キャンセル可能期限チェック（24時間前まで）
 * - 環境変数の自動サニタイズ
 */

import { getEnv } from '../utils/env-helper.js';

/**
 * キャンセル可能かチェック
 * @param {Date} reservationDate - 予約日時
 * @returns {boolean} キャンセル可能な場合true
 */
function isCancellable(reservationDate) {
  const now = new Date();
  const hoursUntilReservation = (reservationDate - now) / (1000 * 60 * 60);
  return hoursUntilReservation >= 24; // 24時間前まで
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
    const { reservation_id, customer_name } = req.body;
    
    // 必須パラメータチェック
    if (!reservation_id) {
      return res.status(400).json({ 
        error: '予約IDが必要です' 
      });
    }
    
    // 仮の予約データ（実際はDBから取得）
    const mockReservation = {
      id: reservation_id,
      customer_name: customer_name || 'ゲスト',
      date: '2024-12-25',
      time: '19:00',
      people: 2,
      created_at: new Date().toISOString()
    };
    
    // 予約日時を作成
    const reservationDateTime = new Date(`${mockReservation.date} ${mockReservation.time}`);
    
    // キャンセル可能かチェック
    if (!isCancellable(reservationDateTime)) {
      return res.status(400).json({ 
        error: 'キャンセル期限を過ぎています（24時間前まで）',
        reservation: mockReservation
      });
    }
    
    // キャンセル処理（実際はDB更新）
    console.log('キャンセル処理:', {
      reservation_id,
      customer_name,
      cancelled_at: new Date().toISOString()
    });
    
    // 成功レスポンス
    return res.status(200).json({
      success: true,
      message: '予約をキャンセルしました',
      cancelled_reservation: {
        ...mockReservation,
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Cancel error:', error);
    return res.status(500).json({ 
      error: 'キャンセル処理に失敗しました',
      details: error.message 
    });
  }
}