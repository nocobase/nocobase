import { createECDH } from 'node:crypto';

/** Config generators produce 32 bytes encoded as hex; VAPID exports usually use base64url. */
export function vapidKeys(value: string): {
  privateKey: string;
  publicKey: string;
} {
  const bytes = /^[a-f\d]{64}$/iu.test(value)
    ? Buffer.from(value, 'hex')
    : Buffer.from(value, 'base64url');
  if (bytes.length !== 32)
    throw new Error('Web Push requires a 32-byte P-256 private key.');
  const key = createECDH('prime256v1');
  key.setPrivateKey(bytes);
  return {
    privateKey: bytes.toString('base64url'),
    publicKey: key.getPublicKey().toString('base64url'),
  };
}
