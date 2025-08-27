// Environment variables checker for debugging
export default function handler(req, res) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const secret = process.env.LINE_CHANNEL_SECRET;
  
  res.status(200).json({
    status: 'Environment check - Account 2',
    has_token: !!token,
    token_preview: token ? `${token.substring(0, 10)}...${token.slice(-4)}` : 'NOT SET',
    has_secret: !!secret,
    secret_preview: secret ? `${secret.substring(0, 4)}...${secret.slice(-4)}` : 'NOT SET',
    store_id: process.env.STORE_ID || 'NOT SET (using restaurant-002)',
    timestamp: new Date().toISOString()
  });
}