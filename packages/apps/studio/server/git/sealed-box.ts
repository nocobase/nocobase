/**
 * libsodium's sealed box (`crypto_box_seal`), how GitHub takes a repository secret: the value is encrypted to the
 * repository's public key with a one-time key pair whose secret half is thrown away, so only GitHub can open it.
 *
 * `ephemeral public key (32) ‖ crypto_box(message, nonce, recipient, ephemeral secret)`, the nonce being
 * BLAKE2b-192 of both public keys. X25519 is Node's; HSalsa20, XSalsa20-Poly1305 and BLAKE2b are `@noble/ciphers` and
 * `@noble/hashes` (audited, no dependencies of their own).
 */
import {
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  type KeyObject,
} from 'node:crypto';

import { hsalsa, secretbox } from '@noble/ciphers/salsa.js';
import { blake2b } from '@noble/hashes/blake2.js';

const KEY_BYTES = 32;
/** "expand 32-byte k", the Salsa20 constants. */
const SIGMA = new Uint32Array([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);
/** A PKCS #8 X25519 private key, before its 32 raw bytes. */
const PKCS8_X25519 = Buffer.from('302e020100300506032b656e04220420', 'hex');

/** The bytes as native 32-bit words, as noble's own ciphers read them. */
function words(bytes: Uint8Array): Uint32Array {
  return new Uint32Array(Uint8Array.from(bytes).buffer);
}

function rawPublicKey(key: KeyObject): Uint8Array {
  const jwk = key.export({ format: 'jwk' });
  return new Uint8Array(Buffer.from(jwk.x ?? '', 'base64url'));
}

function publicKeyOf(raw: Uint8Array): KeyObject {
  return createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      x: Buffer.from(raw).toString('base64url'),
    },
    format: 'jwk',
  });
}

/** An X25519 private key from its 32 raw bytes. */
export function x25519PrivateKey(raw: Uint8Array): KeyObject {
  return createPrivateKey({
    key: Buffer.concat([PKCS8_X25519, Buffer.from(raw)]),
    format: 'der',
    type: 'pkcs8',
  });
}

/** `crypto_box_beforenm`: HSalsa20 of the X25519 shared secret with a zero input. */
function boxKey(privateKey: KeyObject, publicKey: Uint8Array): Uint8Array {
  const shared = diffieHellman({
    privateKey,
    publicKey: publicKeyOf(publicKey),
  });
  const out = new Uint32Array(8);
  hsalsa(SIGMA, words(shared), new Uint32Array(4), out);
  return new Uint8Array(out.buffer);
}

function nonceOf(ephemeral: Uint8Array, recipient: Uint8Array): Uint8Array {
  const input = new Uint8Array(KEY_BYTES * 2);
  input.set(ephemeral, 0);
  input.set(recipient, KEY_BYTES);
  return blake2b(input, { dkLen: 24 });
}

/**
 * Seals `message` to `recipient` (a raw X25519 public key). `ephemeralSecret` fixes the one-time key, for tests only;
 * leaving it out draws a fresh one, as a sealed box must.
 */
export function sealedBox(
  recipient: Uint8Array,
  message: Uint8Array,
  ephemeralSecret?: Uint8Array,
): Uint8Array {
  if (recipient.length !== KEY_BYTES)
    throw new Error('A sealed box needs a 32-byte public key.');
  const privateKey = ephemeralSecret
    ? x25519PrivateKey(ephemeralSecret)
    : generateKeyPairSync('x25519').privateKey;
  const ephemeral = rawPublicKey(createPublicKey(privateKey));
  const sealed = secretbox(
    boxKey(privateKey, recipient),
    nonceOf(ephemeral, recipient),
  ).seal(message);
  const out = new Uint8Array(KEY_BYTES + sealed.length);
  out.set(ephemeral, 0);
  out.set(sealed, KEY_BYTES);
  return out;
}

/** Opens a sealed box with the recipient's raw secret key; null when it does not open. */
export function openSealedBox(
  recipientSecret: Uint8Array,
  box: Uint8Array,
): Uint8Array | null {
  if (box.length < KEY_BYTES + 16) return null;
  const privateKey = x25519PrivateKey(recipientSecret);
  const recipient = rawPublicKey(createPublicKey(privateKey));
  const ephemeral = box.subarray(0, KEY_BYTES);
  try {
    return secretbox(
      boxKey(privateKey, ephemeral),
      nonceOf(ephemeral, recipient),
    ).open(box.subarray(KEY_BYTES));
  } catch {
    return null;
  }
}
