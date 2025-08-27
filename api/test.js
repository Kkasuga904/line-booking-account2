// Simple test endpoint
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    method: req.method,
    hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    tokenLength: process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0
  });
}