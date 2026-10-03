import fs from 'node:fs';
import webpush from 'web-push';

const subject = process.argv[2];
if (!subject || !/^(mailto:|https:\/\/)/.test(subject)) {
  throw new Error('Usage: node scripts/setup-push.mjs https://your-store.example');
}
const file = '.env.push.local';
if (fs.existsSync(file)) throw new Error(`${file} already exists. Keep the existing keys; do not rotate them accidentally.`);
const keys = webpush.generateVAPIDKeys();
fs.writeFileSync(file, `VAPID_SUBJECT=${subject}\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`, {flag: 'wx', mode: 0o600});
console.log('Saved VAPID settings to ignored .env.push.local. Add these three settings to your hosting environment and redeploy. Never commit the private key.');
