#!/usr/bin/env node
import crypto from "crypto";

// Helper: convert a base64 string into a Buffer.
const bufferFromBase64 = (base64) => Buffer.from(base64, "base64");

const decryptBridgePayload = (keyBase64, ivBase64, encryptedPayload) => {
  // The provided key is URL-encoded, so decode it first.
  const decodedKeyBase64 = decodeURIComponent(keyBase64);
  const keyBuffer = bufferFromBase64(decodedKeyBase64);

  // For AES-256-GCM the key must be 32 bytes.
  if (keyBuffer.length !== 32) {
    console.error("Invalid key length. Expected 32 bytes for AES-256-GCM.");
    process.exit(1);
  }

  // Decode IV and payload.
  const ivBuffer = bufferFromBase64(ivBase64);
  const payloadBuffer = bufferFromBase64(encryptedPayload);

  // In many implementations the auth tag is appended to the ciphertext.
  // Here we assume the last 16 bytes of the payload are the auth tag.
  const authTag = payloadBuffer.slice(payloadBuffer.length - 16);
  const ciphertext = payloadBuffer.slice(0, payloadBuffer.length - 16);

  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      keyBuffer,
      ivBuffer
    );
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const decryptedString = decrypted.toString("utf8");
    // Try to parse JSON; if it fails, just return the string.
    try {
      return JSON.parse(decryptedString);
    } catch (jsonError) {
      console.error("Failed to parse JSON:", jsonError);
      return decryptedString;
    }
  } catch (error) {
    console.error("Failed to decrypt payload:", error);
    process.exit(1);
  }
};

// Example values (replace with your actual values)
const key = "8%2BnXZeI3ijhV8YAVk3gdR7BGGKixxUedbiY076G4QTI%3D";
const iv = "UfZflToKI2XrTLUx=";
const encryptedPayload =
  "OK9jkMeW1bbozPUm2aK9trHH8LQ9GlrhIU9VUi2ZM4+16VlZakV1dp8IJgXJbZqaWYMDtT3sATuBWc/vKzvXiq/JW5z/f9yuuVy3p96Bw3szxDodVlIFYKAfDD4suHS+A0Q4G89q0hbfq0HV5S3zhDs0UWNmFgX4nwn6TboQJtgeNnavYjmxJAFlQlOobapYIKWohW9InyQzG4nkQtBIv74SSQhnV55S4kejQ5BKIzEXWA5+zSMz6idZs5H1DXivspLIGSSY85TkECos990GcSxVdRqOuM7Pzl6M5lv2sA==";

const decrypted = decryptBridgePayload(key, iv, encryptedPayload);
console.log("Decrypted payload:", decrypted);
