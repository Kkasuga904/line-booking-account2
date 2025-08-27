export default async function handler(req, res) {
  try {
    const body = req.body ?? await readJson(req);
    const ev = body?.events?.[0];
    if (!ev?.replyToken) return res.status(200).json({ ok: true, skip: true });

    // A2 専用トークン（A1と混在させない）
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    const r = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replyToken: ev.replyToken,
        messages: [{ type: 'text', text: 'pong (Account 2)' }]
      })
    });

    const txt = await r.text();
    console.log('A2 LINE reply', r.status, txt);
    if (!r.ok) return res.status(500).json({ ok: false, status: r.status, txt });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('A2 webhook error', e);
    return res.status(200).json({ ok: true });
  }
}
function readJson(req){return new Promise((resolve,reject)=>{let d='';req.on('data',c=>d+=c);req.on('end',()=>{try{resolve(JSON.parse(d||'{}'))}catch(e){reject(e)}});req.on('error',reject)})}