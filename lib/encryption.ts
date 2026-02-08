import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export interface EncryptedPayload {
  encryptedSecret: string;
  iv: string;
  authTag: string;
}

function getEncryptionKey(): Buffer {
  const base64Key = process.env.ENCRYPTION_KEY;

  if (!base64Key) {
    throw new Error("ENCRYPTION_KEY is required.");
  }

  const key = Buffer.from(base64Key, "base64");

  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte base64 value.");
  }

  return key;
}

export function encrypt(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedSecret: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decrypt(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, "base64"));

  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedSecret, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
