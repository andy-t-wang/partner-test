export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { addWebhookEvent } from "../webhook-events/route";

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAEfyfJbqviO6v
vxCMlSbm5K1tU7Zaujde+uWWooOSzM4QdFCTV7apEi3ptIAKdCpM/gZRAE0CYKio
DUPzlrpW7XaDpsv/mXCi9oeqFifT6zJdxWenVRHiVbdNYBzoXrn9q9tDhgFjSbp1
/J2li8WYtXWvsYv1Ioh5FiK3gJWK4QzoHiQdFGR6Bqj08TFOEup0AqxCxcX/9Ncd
udeuRsjRQx+y9FBTWlwxxDbTfUUfQfK3oAOcTw15KctggkE8E6kl+58zUwYGyELw
lDO03LZNFCc1bTvYAb3/lx5ojufrlyyj2aydIeE4g2xpjyoq/rgAjIqKnGBEPsy1
dMVzYNexAgMBAAECggEAAaBVXNfyBfj5Q78w1G6R4FbI2iS2kKZEKuzMbgitElyO
FR5rApMK+VEDAa1/1QwpQd13xQ6lLZ3kZ7HfD1cJd7bLMAUE9AKDAo+RqVYb2w6X
hAA/JwVQdrO7mYSKEh9Ki17oZyC2w8tfcGQlxehSUWnzQmbU33aTTxUp0OxzjQlk
NATKu3Er3J0Pb3ikgEtVwCffEHXwr1QCeP5B2nOwKm8YKgND5Pdsx/wfn7IsJfcJ
BIIh25BVekOfbobmyPRIdqiWc/f2mTavyhMGxnnfe8BK3iOSvciHkgD09tmOwgOt
fEO72kHUmPxCGzn8GiEcM5l6RErezegedt5N4VoU0QKBgQDh4GakHjsENYGbcxPa
u80JJATOqIP/TZwAbqIX99wzQA8zrR0DQYxhOpL2lCIa53WVhfJjnspOemTwXEuG
Z1MRS/+TCIgnvVN+zW6QkKgKA/PExqINq/EQHZuueQWsBEf06Ks/wYoX7SF5Z8zk
83dGH0rEBYxLmgH7vAVlI61x6QKBgQDZr2mmaJ1+WngJObUPtZoXNy1lgOG2u95L
IVHe1TDm74pMn0QaQTZ5Bv+bmOjnVqlFwu2el77HGaI0LSgrWNCzZ40Ly5D6k8Cn
Vma3PyAMEd7IQ8NucK2tD19KqDZCmRrvBXhCzdKE6Qgtmlcg6VACaQk/TV7scJtL
dqOpNNiSiQKBgBntq3qdacLi7XzNqfLK6g9pjg+28mgFHapDCOJddm5/pP8WmST9
ikLC+YnKmVujRDEkzh03Zhu6GwooXhcQl019/tl++jotln8Qz+dSY6e6qmnlL0cI
fMSP0YYmqEsFtsjbSIUqD1MNynDoRHHnrMJk5y03QdKP3DhsbeYdQVS5AoGBAMel
U1YlmFwsCO8dF+wieAJWvrHbNCftwYBSPM4L5N/ITaTcZQ9XQ+hX/NHtuZ2CI5kx
n9DWB0h/P/5uc+rdd/syO2/X8U1/eS9/1JC3umKXeSVe0LxXZ1HTSWglQi5uUP9q
mtNaBXuUZcW9Sa+Li6/KOYrvIOHknOjnFE65gu9RAoGBAIK9J2TY4JpfXGCz51hE
TzUgobtaUlqJenR8mbFHzrmoUOXTE52x+9fRTJpF+NccRBL++XfSWtEkt+3QCC34
EZAdKQYxafzGvnXGABXWGJzDlvo07KnA8EpXYCiO7JgTB0wKtbLKOieCdryWZyOL
F7F1pIA0385/RvWTnmYiyMza
-----END PRIVATE KEY-----`;

// The corresponding public key that would be shared with the webhook sender
// const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwBH8nyW6r4jur78QjJUm
// 5uStbVO2Wro3XvrllqKDkszOEHRQk1e2qRIt6bSACnQqTP4GUQBNAmCoqA1D85a6
// Vu12g6bL/5lwovaHqhYn0+syXcVnp1UR4lW3TWAc6F65/avbQ4YBY0m6dfydpYvF
// mLV1r7GL9SKIeRYit4CViuEM6B4kHRRkegao9PExThLqdAKsQsXF//TXHbnXrkbI
// 0UMfsvRQU1pcMcQ2031FH0Hyt6ADnE8NeSnLYIJBPBOpJfufM1MGBshC8JQztNy2
// TRQnNW072AG9/5ceaI7n65cso9msnSHhOINsaY8qKv64AIyKipxgRD7MtXTFc2DX
// sQIDAQAB
// -----END PUBLIC KEY-----`;

// Define types for logger to fix linter errors
interface LogData {
  [key: string]: unknown;
}

const logger = {
  info: (message: string, data?: LogData) => {
    const logEntry = {
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      ...(data && { data }),
    };
    console.log(JSON.stringify(logEntry));
  },
  error: (message: string, error?: Error | LogData) => {
    const logEntry = {
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      ...(error && {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      }),
    };
    console.error(JSON.stringify(logEntry));
  },
  warn: (message: string, data?: LogData) => {
    const logEntry = {
      level: "warn",
      timestamp: new Date().toISOString(),
      message,
      ...(data && { data }),
    };
    console.warn(JSON.stringify(logEntry));
  },
};

class WebhookPayload {
  public encryptedKey: string;
  public iv: string;
  public authTag: string;
  public ciphertext: string;

  public constructor(
    encryptedKey: string,
    iv: string,
    authTag: string,
    ciphertext: string
  ) {
    this.encryptedKey = encryptedKey;
    this.iv = iv;
    this.authTag = authTag;
    this.ciphertext = ciphertext;
  }
}

export async function POST(req: Request) {
  logger.info("Webhook request received", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });

  const contentType = req.headers.get("content-type");
  if (contentType !== "application/json") {
    logger.warn("Invalid content type received", { contentType });
    // Add a failed webhook event
    addWebhookEvent(false, { error: "Invalid content type" });
    return NextResponse.json(
      { error: "Invalid content type. Expected application/json" },
      { status: 400 }
    );
  }

  try {
    const encrypted = (await req.json()) as WebhookPayload;

    // Log encrypted payload structure (without sensitive data)
    logger.info("Encrypted payload received", {
      hasEncryptedKey: !!encrypted.encryptedKey,
      hasIv: !!encrypted.iv,
      hasAuthTag: !!encrypted.authTag,
      hasCiphertext: !!encrypted.ciphertext,
    });

    const decrypted = decryptData(encrypted, PRIVATE_KEY);
    const result = JSON.parse(decrypted);

    logger.info("Webhook payload processed successfully", { payload: result });

    // Add a successful webhook event
    addWebhookEvent(true, { payload: result });

    // Return a success response
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const typedError = error as Error;
    logger.error("Error processing webhook", typedError);

    // Add a failed webhook event
    addWebhookEvent(false, {
      error: typedError.message || "Unknown error",
    });

    return NextResponse.json(
      { error: "Failed to process webhook payload" },
      { status: 500 }
    );
  }
}

// Helper function to decrypt webhook payload
function decryptData(encryptedData: WebhookPayload, privKey: string): string {
  logger.info("Decrypting webhook payload");

  // The data is expected to have Base64-encoded fields:
  const { encryptedKey, iv, authTag, ciphertext } = encryptedData;

  // Convert the Base64 strings to Buffers
  const encryptedKeyBuffer = Buffer.from(encryptedKey, "base64");
  const ivBuffer = Buffer.from(iv, "base64");
  const authTagBuffer = Buffer.from(authTag, "base64");
  const ciphertextBuffer = Buffer.from(ciphertext, "base64");

  // Create a private key object from the PEM
  const privateKey = crypto.createPrivateKey({
    key: privKey,
    format: "pem",
  });

  // Step 1: Decrypt the symmetric key using RSA
  const symmetricKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedKeyBuffer
  );

  // Step 2: Decrypt the ciphertext using AES-256-GCM
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    symmetricKey,
    ivBuffer
  );
  // Set the authentication tag for GCM mode
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(ciphertextBuffer, undefined, "utf8");
  decrypted += decipher.final("utf8");

  logger.info("Webhook payload successfully decrypted");
  return decrypted;
}
