const ENCRYPTION_ALGORITHM = "AES-GCM";
const KEY_WRAP_ALGORITHM = "RSA-OAEP";
const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function exportPublicKey(publicKey: CryptoKey) {
  const exportedKey = await crypto.subtle.exportKey("spki", publicKey);
  return bytesToBase64(new Uint8Array(exportedKey));
}

async function exportPrivateKey(privateKey: CryptoKey) {
  const exportedKey = await crypto.subtle.exportKey("pkcs8", privateKey);
  return bytesToBase64(new Uint8Array(exportedKey));
}

async function importPublicKey(serializedKey: string) {
  return crypto.subtle.importKey(
    "spki",
    base64ToBytes(serializedKey),
    {
      name: KEY_WRAP_ALGORITHM,
      hash: "SHA-256",
    },
    true,
    ["encrypt"],
  );
}

async function importPrivateKey(serializedKey: string) {
  return crypto.subtle.importKey(
    "pkcs8",
    base64ToBytes(serializedKey),
    {
      name: KEY_WRAP_ALGORITHM,
      hash: "SHA-256",
    },
    true,
    ["decrypt"],
  );
}

function getKeyStorageKey(userId: string) {
  return `opencord:e2ee:${userId}`;
}

export async function ensureLocalEncryptionKeys(userId: string) {
  const storageKey = getKeyStorageKey(userId);
  const storedKeys = localStorage.getItem(storageKey);

  if (storedKeys) {
    const parsedKeys = JSON.parse(storedKeys) as {
      privateKey: string;
      publicKey: string;
    };

    return {
      privateKey: await importPrivateKey(parsedKeys.privateKey),
      publicKey: await importPublicKey(parsedKeys.publicKey),
      serializedPublicKey: parsedKeys.publicKey,
    };
  }

  const generatedKeys = await crypto.subtle.generateKey(
    {
      name: KEY_WRAP_ALGORITHM,
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  const serializedPublicKey = await exportPublicKey(generatedKeys.publicKey);
  const serializedPrivateKey = await exportPrivateKey(generatedKeys.privateKey);

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      publicKey: serializedPublicKey,
      privateKey: serializedPrivateKey,
    }),
  );

  return {
    privateKey: generatedKeys.privateKey,
    publicKey: generatedKeys.publicKey,
    serializedPublicKey,
  };
}

export async function encryptChatMessage(args: {
  recipients: Array<{ publicKey: string; userId: string }>;
  text: string;
}) {
  const messageKey = await crypto.subtle.generateKey(
    {
      name: ENCRYPTION_ALGORITHM,
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv,
    },
    messageKey,
    TEXT_ENCODER.encode(args.text),
  );
  const exportedMessageKey = await crypto.subtle.exportKey("raw", messageKey);
  const envelopes = await Promise.all(
    args.recipients.map(async (recipient) => {
      const recipientKey = await importPublicKey(recipient.publicKey);
      const encryptedKey = await crypto.subtle.encrypt(
        {
          name: KEY_WRAP_ALGORITHM,
        },
        recipientKey,
        exportedMessageKey,
      );

      return {
        userId: recipient.userId,
        algorithm: KEY_WRAP_ALGORITHM,
        encryptedKey: bytesToBase64(new Uint8Array(encryptedKey)),
      };
    }),
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    encryptionAlgorithm: ENCRYPTION_ALGORITHM,
    envelopes,
    iv: bytesToBase64(iv),
  };
}

export async function decryptChatMessage(args: {
  ciphertext: string;
  encryptedKey: string;
  iv: string;
  privateKey: CryptoKey;
}) {
  const rawMessageKey = await crypto.subtle.decrypt(
    {
      name: KEY_WRAP_ALGORITHM,
    },
    args.privateKey,
    base64ToBytes(args.encryptedKey),
  );
  const messageKey = await crypto.subtle.importKey(
    "raw",
    rawMessageKey,
    {
      name: ENCRYPTION_ALGORITHM,
      length: 256,
    },
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: base64ToBytes(args.iv),
    },
    messageKey,
    base64ToBytes(args.ciphertext),
  );

  return TEXT_DECODER.decode(plaintext);
}

export const chatKeyAlgorithm = KEY_WRAP_ALGORITHM;
