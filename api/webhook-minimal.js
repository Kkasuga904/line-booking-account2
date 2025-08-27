// 超最小限 - 200を返すだけ
export default function handler(req, res) {
  console.log('Webhook called!');
  res.status(200).json({ message: 'ok' });
}