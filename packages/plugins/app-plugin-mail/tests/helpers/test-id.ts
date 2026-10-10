import { createHash } from 'node:crypto';

/** Returns a stable UUID for a named database fixture, preserving non-UUID external IDs. */
export function testId(name: string): string {
  const bytes = createHash('sha256').update(name).digest().subarray(0, 16);
  // Version 8 identifies a custom UUID; retain the standard RFC 9562 variant.
  bytes[6] = (bytes[6]! & 0x0f) | 0x80;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
