/**
 * 管理者認証API
 * 
 * 主な機能：
 * - 管理パネルへのアクセス認証
 * - セッショントークン発行
 * - 環境変数の自動サニタイズ
 */

import { getEnv } from '../utils/env-helper.js';

/**
 * セッショントークン生成
 * @returns {string} ランダムトークン
 */
function generateToken() {
  // crypto使わずにランダム文字列生成
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random1}-${random2}`;
}

/**
 * パスワードのハッシュ化（簡易版）
 * @param {string} password - プレーンパスワード
 * @returns {string} ハッシュ化されたパスワード
 */
function hashPassword(password) {
  // 簡易ハッシュ（本番環境では適切なハッシュライブラリを使用すること）
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// メモリ上のセッションストア（簡易版）
const sessions = new Map();

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET: 認証状態確認
  if (req.method === 'GET') {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || !sessions.has(token)) {
      return res.status(401).json({ 
        authenticated: false,
        message: '未認証' 
      });
    }
    
    const session = sessions.get(token);
    const now = new Date();
    
    // セッション有効期限チェック（24時間）
    if (now - session.created_at > 24 * 60 * 60 * 1000) {
      sessions.delete(token);
      return res.status(401).json({ 
        authenticated: false,
        message: 'セッション期限切れ' 
      });
    }
    
    return res.status(200).json({
      authenticated: true,
      username: session.username,
      created_at: session.created_at,
      expires_at: new Date(session.created_at.getTime() + 24 * 60 * 60 * 1000)
    });
  }
  
  // POST: ログイン
  if (req.method === 'POST') {
    try {
      const { username, password } = req.body;
      
      // 入力検証
      if (!username || !password) {
        return res.status(400).json({ 
          error: 'ユーザー名とパスワードが必要です' 
        });
      }
      
      // 認証情報を環境変数から取得
      const adminUsername = getEnv('ADMIN_USERNAME', 'admin');
      const adminPasswordHash = getEnv('ADMIN_PASSWORD_HASH', 
        hashPassword('admin123')); // デフォルトパスワード
      
      // パスワード検証
      const inputPasswordHash = hashPassword(password);
      
      if (username !== adminUsername || inputPasswordHash !== adminPasswordHash) {
        // セキュリティのため、遅延を入れる
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return res.status(401).json({ 
          error: '認証失敗',
          message: 'ユーザー名またはパスワードが正しくありません' 
        });
      }
      
      // セッショントークン生成
      const token = generateToken();
      const session = {
        username: username,
        created_at: new Date(),
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      };
      
      // セッション保存
      sessions.set(token, session);
      
      // 古いセッションをクリーンアップ
      const now = new Date();
      for (const [key, value] of sessions.entries()) {
        if (now - value.created_at > 24 * 60 * 60 * 1000) {
          sessions.delete(key);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'ログイン成功',
        token: token,
        expires_in: 86400, // 24時間（秒）
        user: {
          username: username,
          role: 'admin'
        }
      });
      
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ 
        error: '認証処理に失敗しました',
        details: error.message 
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}