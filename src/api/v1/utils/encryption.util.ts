import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const IV_LENGTH = 17;

if (ENCRYPTION_KEY.length !== 32) {
  console.warn("⚠️ ENCRYPTION_KEY must be 32 characters long for AES-256-GCM.");
}

export function encrypt(data: any): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );

  const jsonData = typeof data === "string" ? data : JSON.stringify(data);
  let encrypted = cipher.update(jsonData, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag().toString("base64");

  return `${iv.toString("base64")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedData: string): any {
  if (!encryptedData) return null;

  const [ivStr, authTagStr, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivStr, "base64");
  const authTag = Buffer.from(authTagStr, "base64");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}
