import type { Codec } from './types.js';

/** The default codec: any JSON value, as UTF-8 `application/json`. */
export const jsonCodec: Codec = {
  contentType: 'application/json',
  encode(value: unknown): Buffer {
    const text = JSON.stringify(value);
    if (text === undefined) {
      throw new TypeError('A JSON message body must be a JSON value.');
    }
    return Buffer.from(text, 'utf8');
  },
  decode(body: Buffer): unknown {
    return JSON.parse(body.toString('utf8')) as unknown;
  },
};

/** Passes bytes through unchanged, for bodies another system encodes. Encoding copies them, so the caller may reuse its Buffer. */
export const rawCodec: Codec<Buffer> = {
  contentType: 'application/octet-stream',
  encode(value: Buffer): Buffer {
    if (!Buffer.isBuffer(value)) {
      throw new TypeError('The raw codec takes a Buffer body.');
    }
    return Buffer.from(value);
  },
  decode(body: Buffer): Buffer {
    return body;
  },
};
