const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'src', 'assets', 'env.js');
const env = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8081/api'
};

const content = `window.__env = ${JSON.stringify(env, null, 2)};\n`;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content, 'utf8');
console.log(`Generated runtime env at ${outputPath}`);
