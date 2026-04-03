import CryptoJS from "crypto-js";

/**
 * Encryption key derived from JWT_SECRET environment variable.
 * In production, use a dedicated encryption key stored in secrets manager.
 */
function getEncryptionKey(): string {
  const key = process.env.JWT_SECRET;
  if (!key) {
    throw new Error("JWT_SECRET not configured for encryption");
  }
  return key;
}

/**
 * Encrypt a plaintext value using AES-256.
 */
export function encryptValue(plaintext: string): string {
  const key = getEncryptionKey();
  const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
  return encrypted;
}

/**
 * Decrypt an encrypted value.
 */
export function decryptValue(encrypted: string): string {
  const key = getEncryptionKey();
  const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
  if (!decrypted) {
    throw new Error("Failed to decrypt value - possibly corrupted or wrong key");
  }
  return decrypted;
}

/**
 * Validate that a value can be encrypted and decrypted.
 */
export function validateEncryption(testValue: string = "test"): boolean {
  try {
    const encrypted = encryptValue(testValue);
    const decrypted = decryptValue(encrypted);
    return decrypted === testValue;
  } catch {
    return false;
  }
}
