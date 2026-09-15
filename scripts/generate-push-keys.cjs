// Run locally once: node scripts/generate-push-keys.cjs. Do not commit the output.
const push=require('web-push');const crypto=require('node:crypto');const k=push.generateVAPIDKeys();
console.log('WEB_PUSH_PUBLIC_KEY='+k.publicKey+'\nWEB_PUSH_PRIVATE_KEY='+k.privateKey+'\nWEB_PUSH_SUBJECT=https://www.factorboxes.com\nCRON_SECRET='+crypto.randomBytes(32).toString('hex'));
