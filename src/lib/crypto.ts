import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_SECRET_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('VITE_ENCRYPTION_SECRET_KEY is not defined');
}

/**
 * Encrypts a private key using AES-256 encryption
 */
export function encryptPrivateKey(privateKey: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(privateKey, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt private key');
  }
}

/**
 * Decrypts an encrypted private key
 */
export function decryptPrivateKey(encryptedKey: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt private key');
  }
}

/**
 * Generate a secure random encryption key (for setup purposes)
 */
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}
