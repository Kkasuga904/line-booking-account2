// LINE Webhook for Account 2 - Direct minimal handler
export default function handler(req, res) {
  console.log('Webhook called at:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body));
  
  // LINE requires 200 response
  res.status(200).json({ status: 'ok' });
}