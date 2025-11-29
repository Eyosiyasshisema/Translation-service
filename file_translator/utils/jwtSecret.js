import crypto from 'crypto';

function generateSecretKey() {
  
  const secret = crypto.randomBytes(64).toString('base64');
  console.log(secret);
}

generateSecretKey();