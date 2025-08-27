// Test LINE API Token validity
import https from 'https';

// You need to set this to your actual token
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YOUR_TOKEN_HERE';

console.log('Testing LINE API token...');
console.log('Token preview:', TOKEN.substring(0, 10) + '...' + TOKEN.slice(-4));

// Test by getting bot info
const options = {
  hostname: 'api.line.me',
  port: 443,
  path: '/v2/bot/info',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Token is VALID! Bot info:');
      console.log(JSON.parse(data));
    } else {
      console.log('\n❌ Token is INVALID or there\'s an API issue');
      if (res.statusCode === 401) {
        console.log('   → Token is incorrect or expired');
        console.log('   → Please get a new token from LINE Developers Console');
      }
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();