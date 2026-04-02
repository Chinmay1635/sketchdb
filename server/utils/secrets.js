const crypto = require('crypto');

const KEY_HEX = process.env.DB_SECRET_ENCRYPTION_KEY;

if (!KEY_HEX) {
  throw new Error('DB_SECRET_ENCRYPTION_KEY is required and must be a 32-byte hex string.');
}

const KEY_BUFFER = Buffer.from(KEY_HEX, 'hex');

if (KEY_BUFFER.length !== 32) {
  throw new Error('DB_SECRET_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars).');
}

const encrypt = (text) => {
  if (typeof text !== 'string') {
    throw new Error('encrypt() expects a string');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
};

const decrypt = (cipherText) => {
  if (typeof cipherText !== 'string') {
    throw new Error('decrypt() expects a string');
  }

  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload');
  }

  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

module.exports = {
  encrypt,
  decrypt,
};
