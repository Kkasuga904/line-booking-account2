// Account 2 - Complete webhook with restaurant reservation features
// Version: COMPLETE-1.0
// Store: restaurant-002

export default async function handler(req, res) {
  console.log('=== Account 2 Webhook COMPLETE v1.0 START ===');
  
  try {
    const body = req.body;
    const event = body?.events?.[0];
    
    // 返信不要なイベントは即200
    if (!event || event.type !== 'message' || !event.replyToken) {
      console.log('Skipping non-message event');
      res.status(200).json({ ok: true, skipped: true });
      return;
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!token) {
      console.error('CRITICAL: LINE_CHANNEL_ACCESS_TOKEN not set!');
      res.status(200).json({ ok: false, error: 'No token' });
      return;
    }

    console.log('Message received:', event.message?.text);
    
    // メッセージ内容に応じて返信を作成（レストラン版）
    const userMessage = event.message?.text || '';
    let replyText = '';
    
    if (userMessage.includes('予約')) {
      replyText = `🍽️ ご予約を承ります！

下記リンクから詳細をご入力ください：
https://liff.line.me/2008001308-gDrXL5Y1

【営業時間】
ランチ: 11:30-15:00 (L.O. 14:30)
ディナー: 17:30-22:00 (L.O. 21:00)

【定休日】月曜日

ご来店をお待ちしております！
[Account 2 - Restaurant: restaurant-002]`;
    } else if (userMessage.includes('キャンセル')) {
      replyText = `❌ ご予約のキャンセルを承ります。

恐れ入りますが、予約番号とお名前を
このメッセージに返信してお知らせください。

キャンセルポリシー：
・前日まで：無料
・当日：コース料金の50%

[Account 2 - Restaurant: restaurant-002]`;
    } else if (userMessage.includes('変更')) {
      replyText = `✏️ ご予約の変更を承ります。

恐れ入りますが、予約番号と
変更内容（日時・人数など）を
このメッセージに返信してお知らせください。

席の空き状況を確認後、ご連絡いたします。
[Account 2 - Restaurant: restaurant-002]`;
    } else if (userMessage.includes('メニュー') || userMessage.includes('コース')) {
      replyText = `📜 コースメニューのご案内

【ランチコース】
・Aコース: ¥2,500
・Bコース: ¥3,500
・特別コース: ¥5,000

【ディナーコース】
・季節のコース: ¥6,000
・シェフおまかせ: ¥8,000
・プレミアム: ¥12,000

詳細はこちら：
https://restaurant-example.com/menu

[Account 2 - Restaurant: restaurant-002]`;
    } else if (userMessage.includes('営業') || userMessage.includes('時間')) {
      replyText = `🕐 営業時間のご案内

【ランチタイム】
11:30-15:00 (L.O. 14:30)

【ディナータイム】
17:30-22:00 (L.O. 21:00)

【定休日】
毎週月曜日
※祝日の場合は翌日

【ご予約受付時間】
10:00-21:00（電話）
24時間受付（LINE）

[Account 2 - Restaurant: restaurant-002]`;
    } else if (userMessage.includes('場所') || userMessage.includes('アクセス')) {
      replyText = `📍 アクセス情報

【住所】
東京都港区〇〇2-3-4
〇〇タワー 2F

【最寄駅】
・地下鉄〇〇駅 A1出口 徒歩2分
・JR〇〇駅 南口 徒歩7分

【駐車場】
提携駐車場あり（2時間無料）

Googleマップ:
https://maps.google.com/restaurant-example

[Account 2 - Restaurant: restaurant-002]`;
    } else if (userMessage.includes('アレルギー') || userMessage.includes('対応')) {
      replyText = `🍴 アレルギー対応について

当店では各種アレルギーに対応しております。

【対応可能なアレルギー】
・卵、乳製品、小麦
・そば、落花生
・甲殻類（エビ・カニ）
・その他（要相談）

ご予約時に必ずお申し出ください。
可能な限り対応させていただきます。

[Account 2 - Restaurant: restaurant-002]`;
    } else if (userMessage.toLowerCase().includes('hello') || userMessage.includes('こんにちは')) {
      replyText = `こんにちは！レストランAccount 2へようこそ 🍽️

ご利用いただきありがとうございます。
以下のメニューからお選びください：

📅 「予約」- テーブル予約
📜 「メニュー」- コース案内
❌ 「キャンセル」- 予約取消
✏️ 「変更」- 予約変更
🕐 「営業時間」- 営業時間
📍 「アクセス」- 場所案内
🍴 「アレルギー」- 対応について

お気軽にメッセージをお送りください！
[Account 2 - Restaurant: restaurant-002]`;
    } else {
      replyText = `メッセージありがとうございます。

ご希望の内容をお選びください：

📅 「予約」- テーブル予約
📜 「メニュー」- コース案内
❌ 「キャンセル」- 予約取消
✏️ 「変更」- 予約変更
🕐 「営業時間」- 営業時間
📍 「アクセス」- 場所案内
🍴 「アレルギー」- 対応について

お電話でのお問い合わせ：
03-YYYY-YYYY（10:00-21:00）

[Account 2 - Restaurant: restaurant-002]`;
    }
    
    // awaitで同期的に送信
    console.log('Sending reply to LINE API...');
    
    const r = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replyToken: event.replyToken,
        messages: [{
          type: 'text',
          text: replyText
        }]
      })
    });

    const responseText = await r.text();
    
    if (!r.ok) {
      console.error('LINE API Error:', r.status, responseText);
      res.status(200).json({ ok: false, lineStatus: r.status });
      return;
    }

    console.log('✅ Reply sent successfully!');
    res.status(200).json({ ok: true, sent: true });
    
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(200).json({ ok: false, error: e.message });
  }
  
  console.log('=== Account 2 Webhook COMPLETE END ===');
}