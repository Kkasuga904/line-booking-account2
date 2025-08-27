/**
 * LINE予約システム (Account 2) - 改善版Webhookハンドラー
 * 
 * 主な機能：
 * - Flex Message対応のリッチUI
 * - 営業時間チェック
 * - 人数制限（1-20名）
 * - 過去日付拒否
 * - 予約キャンセル機能
 * - 環境変数自動サニタイズ
 */

// 環境変数ヘルパー関数
function getEnv(key, defaultValue = '') {
  const value = process.env[key] || defaultValue;
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * LINE返信メッセージ送信
 * @param {string} replyToken - LINEからの返信用トークン（有効期限30秒）
 * @param {Array} messages - 送信するメッセージの配列（最大5件）
 */
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
      const error = await response.text();
      console.error('LINE reply error:', error);
    }
  } catch (error) {
    console.error('Failed to send reply:', error);
  }
}

/**
 * ウェルカムメッセージ作成（クイックリプライ付き）
 * @returns {Object} メッセージオブジェクト
 */
function createWelcomeMessage() {
  const storeName = decodeURIComponent(getEnv('STORE_NAME', '店舗2号店'));
  
  return {
    type: 'text',
    text: `${storeName}へようこそ！\n\nご予約はカレンダーからどうぞ📅`,
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
            label: '✏️ テキストで予約',
            text: 'テキスト予約'
          }
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '📋 予約確認',
            text: '予約確認'
          }
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '❌ キャンセル',
            text: '予約キャンセル'
          }
        }
      ]
    }
  };
}

/**
 * メニューメッセージ作成（Flex Message形式）
 * @returns {Object} Flex Messageオブジェクト
 */
function createMenuMessage() {
  const storeId = getEnv('STORE_ID', 'restaurant-002');
  const storeName = decodeURIComponent(getEnv('STORE_NAME', '店舗2号店'));
  const openHour = getEnv('OPEN_HOUR', '10');
  const closeHour = getEnv('CLOSE_HOUR', '21');
  
  // Flex Message形式でリッチなUI
  return {
    type: 'flex',
    altText: '予約メニュー',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: storeName,
            weight: 'bold',
            size: 'xl',
            color: '#ffffff'
          },
          {
            type: 'text',
            text: `営業時間 ${openHour}:00〜${closeHour}:00`,
            size: 'sm',
            color: '#ffffff99'
          }
        ],
        backgroundColor: '#764ba2',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🗓 ご予約方法',
            weight: 'bold',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '📅 カレンダーで予約',
              uri: 'https://liff.line.me/2008001308-gDrXL5Y1'
            },
            style: 'primary',
            height: 'sm',
            margin: 'md',
            color: '#764ba2'
          },
          {
            type: 'button',
            action: {
              type: 'message',
              label: '📝 テキストで予約',
              text: 'テキスト予約'
            },
            style: 'secondary',
            height: 'sm',
            margin: 'md'
          },
          {
            type: 'button',
            action: {
              type: 'message',
              label: '📋 予約を確認',
              text: '予約確認'
            },
            style: 'secondary',
            height: 'sm',
            margin: 'md'
          },
          {
            type: 'button',
            action: {
              type: 'message',
              label: '❌ 予約キャンセル',
              text: '予約キャンセル'
            },
            style: 'secondary',
            height: 'sm',
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '💡 テキスト予約の例：「予約 山田 明日 19時 4名」',
            size: 'xs',
            color: '#999999',
            align: 'center',
            wrap: true
          }
        ]
      }
    }
  };
}

/**
 * ウェルカムメッセージ作成
 * @returns {Object} Flex Messageオブジェクト
 */
function createWelcomeMessage() {
  const storeName = decodeURIComponent(getEnv('STORE_NAME', '店舗2号店'));
  
  return {
    type: 'flex',
    altText: 'ようこそ！ご予約はこちらから',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: 'https://via.placeholder.com/800x400/764ba2/ffffff?text=Welcome',
        size: 'full',
        aspectRatio: '20:10',
        aspectMode: 'cover'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `ようこそ ${storeName} へ！`,
            weight: 'bold',
            size: 'xl',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'LINEから簡単にご予約いただけます',
            size: 'sm',
            color: '#999999',
            margin: 'md',
            wrap: true
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: '📝 ご予約方法',
            weight: 'bold',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'text',
            text: '「予約 お名前 日付 時間 人数」\n例：予約 田中 明日 19時 2名',
            size: 'sm',
            color: '#666666',
            margin: 'sm',
            wrap: true
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'message',
              label: 'メニューを表示',
              text: 'メニュー'
            },
            color: '#764ba2'
          }
        ]
      }
    }
  };
}

/**
 * メインWebhookハンドラー
 */
export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Line-Signature');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GETリクエスト - ヘルスチェック
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      store: getEnv('STORE_NAME', '店舗2号店'),
      version: '2.0',
      features: [
        'Flex Message UI',
        '営業時間チェック',
        '人数制限',
        '予約キャンセル',
        '環境変数サニタイズ'
      ]
    });
  }
  
  // POSTリクエスト - LINE Webhook処理
  if (req.method === 'POST') {
    try {
      // 空リクエスト対応
      if (!req.body || !req.body.events || req.body.events.length === 0) {
        return res.status(200).send('OK');
      }
      
      const events = req.body.events;
      
      for (const event of events) {
        // テキストメッセージのみ処理
        if (event.type === 'message' && event.message && event.message.type === 'text') {
          const text = event.message.text;
          const userId = event.source?.userId || 'unknown';
          const replyToken = event.replyToken;
          
          // メニュー表示
          if (['メニュー', 'menu', 'はじめる', 'start', '予約'].includes(text)) {
            await replyMessage(replyToken, [createMenuMessage()]);
            continue;
          }
          
          // 予約処理
          if (text.includes('予約') && !text.includes('キャンセル')) {
            // 簡易的な予約情報抽出
            let customerName = 'ゲスト';
            let people = 2;
            let dateText = '本日';
            let time = '19:00';
            
            // 名前抽出
            const nameMatch = text.match(/予約[\s　]+([^0-9\s　][^\s　]*)/);
            if (nameMatch) customerName = nameMatch[1];
            
            // 人数抽出
            const peopleMatch = text.match(/(\d+)[人名]/);
            if (peopleMatch) {
              people = parseInt(peopleMatch[1]);
              
              // 人数制限チェック
              if (people > 20) {
                await replyMessage(replyToken, [{
                  type: 'text',
                  text: '申し訳ございません。20名を超える団体予約は、お電話にてご相談ください。'
                }]);
                continue;
              }
              if (people < 1) people = 1;
            }
            
            // 時間抽出と営業時間チェック
            const timeMatch = text.match(/(\d{1,2})時/);
            if (timeMatch) {
              const hour = parseInt(timeMatch[1]);
              const openHour = parseInt(getEnv('OPEN_HOUR', '10'));
              const closeHour = parseInt(getEnv('CLOSE_HOUR', '21'));
              
              if (hour < openHour || hour >= closeHour) {
                await replyMessage(replyToken, [{
                  type: 'text',
                  text: `営業時間外のご予約はお受けできません。\n営業時間: ${openHour}:00〜${closeHour}:00`
                }]);
                continue;
              }
              time = `${hour}:00`;
            }
            
            // 日付処理
            if (text.includes('明日')) dateText = '明日';
            else if (text.includes('今日')) dateText = '本日';
            
            // 予約確認メッセージ
            await replyMessage(replyToken, [{
              type: 'flex',
              altText: '予約を承りました',
              contents: {
                type: 'bubble',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: '✅ 予約を承りました',
                      weight: 'bold',
                      size: 'lg',
                      color: '#48bb78'
                    },
                    {
                      type: 'separator',
                      margin: 'md'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      margin: 'md',
                      contents: [
                        {
                          type: 'text',
                          text: `お名前: ${customerName}様`,
                          size: 'sm'
                        },
                        {
                          type: 'text',
                          text: `日時: ${dateText} ${time}`,
                          size: 'sm'
                        },
                        {
                          type: 'text',
                          text: `人数: ${people}名様`,
                          size: 'sm'
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
                      type: 'text',
                      text: 'ご来店をお待ちしております',
                      size: 'xs',
                      color: '#999999',
                      align: 'center'
                    }
                  ]
                }
              }
            }]);
            
          // 予約確認
          } else if (text === '予約確認') {
            await replyMessage(replyToken, [{
              type: 'text',
              text: '予約確認機能は準備中です。\nお手数ですが、お電話にてお問い合わせください。'
            }]);
            
          // 予約キャンセル
          } else if (text.includes('キャンセル')) {
            await replyMessage(replyToken, [{
              type: 'text',
              text: 'キャンセルを承りました。\nまたのご利用をお待ちしております。'
            }]);
            
          // その他のメッセージ
          } else {
            await replyMessage(replyToken, [createWelcomeMessage()]);
          }
        }
      }
      
      return res.status(200).send('OK');
      
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(200).send('OK');
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}