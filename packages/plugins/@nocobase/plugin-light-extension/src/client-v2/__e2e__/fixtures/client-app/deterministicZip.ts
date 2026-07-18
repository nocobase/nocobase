/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface DeterministicZipEntry {
  name: string;
  content: string | Uint8Array;
}

const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const ZIP_VERSION = 20;
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_DOS_DATE_1980_01_01 = 0x0021;
const ZIP_UNIX_REGULAR_FILE_MODE = 0o100644;
const MAX_ZIP_ENTRY_COUNT = 0xffff;
const MAX_ZIP_UINT32 = 0xffffffff;

export function createDeterministicZip(entries: readonly DeterministicZipEntry[]): Buffer {
  const normalized = normalizeEntries(entries);
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const entry of normalized) {
    const name = Buffer.from(entry.name, 'utf8');
    const content = toBuffer(entry.content);
    const crc = crc32(content);
    assertUint32(content.length, `ZIP entry "${entry.name}" size`);
    assertUint32(localOffset, 'ZIP local header offset');

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(ZIP_LOCAL_FILE_HEADER, 0);
    localHeader.writeUInt16LE(ZIP_VERSION, 4);
    localHeader.writeUInt16LE(ZIP_UTF8_FLAG, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(ZIP_DOS_DATE_1980_01_01, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localParts.push(localHeader, name, content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(ZIP_CENTRAL_DIRECTORY_HEADER, 0);
    centralHeader.writeUInt16LE((3 << 8) | ZIP_VERSION, 4);
    centralHeader.writeUInt16LE(ZIP_VERSION, 6);
    centralHeader.writeUInt16LE(ZIP_UTF8_FLAG, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(ZIP_DOS_DATE_1980_01_01, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt32LE((ZIP_UNIX_REGULAR_FILE_MODE << 16) >>> 0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, name);

    localOffset += localHeader.length + name.length + content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  assertUint32(localOffset, 'ZIP central directory offset');
  assertUint32(centralDirectory.length, 'ZIP central directory size');
  const end = Buffer.alloc(22);
  end.writeUInt32LE(ZIP_END_OF_CENTRAL_DIRECTORY, 0);
  end.writeUInt16LE(normalized.length, 8);
  end.writeUInt16LE(normalized.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function normalizeEntries(entries: readonly DeterministicZipEntry[]): DeterministicZipEntry[] {
  if (entries.length > MAX_ZIP_ENTRY_COUNT) {
    throw new Error(`ZIP cannot contain more than ${MAX_ZIP_ENTRY_COUNT} entries`);
  }
  const seen = new Set<string>();
  const normalized = entries.map((entry) => {
    if (!entry.name || entry.name.includes('\0')) {
      throw new Error('ZIP entry name must be a non-empty string without null bytes');
    }
    if (Buffer.byteLength(entry.name, 'utf8') > MAX_ZIP_ENTRY_COUNT) {
      throw new Error(`ZIP entry name "${entry.name}" is too long`);
    }
    if (seen.has(entry.name)) {
      throw new Error(`ZIP contains duplicate entry "${entry.name}"`);
    }
    seen.add(entry.name);
    return entry;
  });
  return normalized.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
}

function toBuffer(content: string | Uint8Array): Buffer {
  return typeof content === 'string' ? Buffer.from(content, 'utf8') : Buffer.from(content);
}

function assertUint32(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_ZIP_UINT32) {
    throw new Error(`${label} exceeds the deterministic ZIP limit`);
  }
}

function crc32(content: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of content) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC32_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});
