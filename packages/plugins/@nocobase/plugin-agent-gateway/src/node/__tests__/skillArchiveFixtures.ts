/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { deflateRawSync } from 'zlib';

export interface SkillZipFixtureEntry {
  name: string;
  content?: Buffer | string;
  compression?: 'stored' | 'deflated';
  unixMode?: number;
  declaredCompressedSize?: number;
  declaredUncompressedSize?: number;
  localHeaderOffset?: number;
}

function crc32(content: Buffer) {
  let crc = 0xffffffff;
  for (const byte of content) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime() {
  const year = 2026;
  const month = 7;
  const day = 1;
  return {
    dosTime: 0,
    dosDate: ((year - 1980) << 9) | (month << 5) | day,
  };
}

export function createSkillZipFixture(entries: SkillZipFixtureEntry[]) {
  const localFileParts: Buffer[] = [];
  const centralDirectoryParts: Buffer[] = [];
  let offset = 0;
  const { dosDate, dosTime } = getDosDateTime();

  for (const fixture of entries) {
    const name = Buffer.from(fixture.name);
    const content = Buffer.isBuffer(fixture.content) ? fixture.content : Buffer.from(fixture.content || '');
    const compressionMethod = fixture.compression === 'deflated' ? 8 : 0;
    const compressedContent = compressionMethod === 8 ? deflateRawSync(content) : content;
    const crc = crc32(content);
    const declaredCompressedSize = fixture.declaredCompressedSize ?? compressedContent.length;
    const declaredUncompressedSize = fixture.declaredUncompressedSize ?? content.length;
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(compressionMethod, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(declaredCompressedSize, 18);
    localHeader.writeUInt32LE(declaredUncompressedSize, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localFileParts.push(localHeader, name, compressedContent);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE((3 << 8) | 20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(compressionMethod, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(declaredCompressedSize, 20);
    centralHeader.writeUInt32LE(declaredUncompressedSize, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    const unixMode = fixture.unixMode ?? (fixture.name.endsWith('/') ? 0o040755 : 0o100644);
    centralHeader.writeUInt32LE((unixMode << 16) >>> 0, 38);
    centralHeader.writeUInt32LE(fixture.localHeaderOffset ?? offset, 42);
    centralDirectoryParts.push(centralHeader, name);
    offset += localHeader.length + name.length + compressedContent.length;
  }

  const centralDirectory = Buffer.concat(centralDirectoryParts);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(entries.length, 8);
  endOfCentralDirectory.writeUInt16LE(entries.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDirectory.writeUInt32LE(offset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);
  return Buffer.concat([...localFileParts, centralDirectory, endOfCentralDirectory]);
}

export function createValidSkillZipFixture(skillText = '# Test Skill\n') {
  return createSkillZipFixture([{ name: 'SKILL.md', content: skillText, compression: 'deflated' }]);
}
