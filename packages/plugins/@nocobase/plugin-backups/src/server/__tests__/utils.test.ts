/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  humanFileSize,
  isQsTruly,
  toMajorVersion,
  EscapeQuoteTransform,
  Extractor,
  resolvePathWithinBase,
} from '../utils';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';

describe('humanFileSize', () => {
  it('should return size in B (bytes) for values less than 1024', () => {
    expect(humanFileSize(512)).toBe('512.0 B');
  });

  it('should return size in KiB for values larger than or equal to 1024', () => {
    expect(humanFileSize(2048)).toBe('2.0 KiB');
  });

  it('should handle larger sizes correctly (MB, GB, etc.)', () => {
    expect(humanFileSize(5 * 1024 * 1024)).toBe('5.0 MiB');
    expect(humanFileSize(3 * 1024 * 1024 * 1024)).toBe('3.0 GiB');
  });

  it('should handle SI units correctly when the si flag is true', () => {
    expect(humanFileSize(1500, true)).toBe('1.5 kB');
  });

  it('should return size with the specified decimal precision', () => {
    expect(humanFileSize(1536, false, 2)).toBe('1.50 KiB');
  });
});

describe('isQsTruly', () => {
  it('should return true for "true" (string)', () => {
    expect(isQsTruly('true')).toBe(true);
  });

  it('should return true for boolean true', () => {
    expect(isQsTruly(true)).toBe(true);
  });

  it('should return false for "false" (string)', () => {
    expect(isQsTruly('false')).toBe(false);
  });

  it('should return false for boolean false', () => {
    expect(isQsTruly(false)).toBe(false);
  });

  it('should return false for undefined or empty string', () => {
    expect(isQsTruly()).toBe(false);
    expect(isQsTruly('')).toBe(false);
  });

  it('should handle invalid JSON strings gracefully', () => {
    expect(isQsTruly('invalid')).toBe(false);
  });
});

describe('toMajorVersion', () => {
  it('should extract the version from a raw string with a valid version', () => {
    expect(toMajorVersion('PostgreSQL 13.3')).toBe('13');
    expect(toMajorVersion('MySQL 8.0.23')).toBe('8');
    expect(toMajorVersion('SQLite version 3.34.1')).toBe('3');
  });

  it('should handle strings with extra text before and after the version', () => {
    expect(toMajorVersion('version 5.7.25-alpha')).toBe('5');
  });

  it('should return undefined for strings without a valid version number', () => {
    expect(toMajorVersion('No version here')).toBeUndefined();
    expect(toMajorVersion('')).toBeUndefined();
  });
});

describe('resolvePathWithinBase', () => {
  const basePath = path.join(path.sep, 'tmp', 'backup-tests');

  it('should resolve files within the base path', () => {
    expect(resolvePathWithinBase(basePath, 'data/file.txt')).toBe(path.resolve(basePath, 'data/file.txt'));
  });

  it('should reject path traversal attempts', () => {
    expect(resolvePathWithinBase(basePath, '../evil.txt')).toBeUndefined();
  });

  it('should reject absolute paths', () => {
    expect(resolvePathWithinBase(basePath, path.join(path.sep, 'etc', 'passwd'))).toBeUndefined();
  });
});

describe('Extractor', () => {
  const pipelineAsync = promisify(pipeline);

  it('should finish when no chunks are written', async () => {
    const extractDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backups-extractor-'));

    try {
      const extractor = new Extractor({ path: extractDir });
      await expect(pipelineAsync(Readable.from([]), extractor)).resolves.toBeUndefined();
    } finally {
      await fs.rm(extractDir, { recursive: true, force: true });
    }
  });
});

describe('EscapeQuoteTransform', () => {
  const pipelineAsync = promisify(pipeline);

  // Helper function to transform data through the stream
  const transformData = async (input: string | Buffer): Promise<string> => {
    const chunks: Buffer[] = [];
    const transform = new EscapeQuoteTransform();

    const readable = new Readable({
      read() {
        this.push(input);
        this.push(null);
      },
    });

    await pipelineAsync(readable, transform, async function* (source) {
      for await (const chunk of source) {
        chunks.push(chunk);
        yield chunk;
      }
    });

    // @ts-ignore
    return Buffer.concat(chunks).toString('utf8');
  };

  // Helper function to transform data in multiple chunks
  const transformDataInChunks = async (chunks: (string | Buffer)[]): Promise<string> => {
    const resultChunks: Buffer[] = [];
    const transform = new EscapeQuoteTransform();

    const readable = new Readable({
      read() {
        if (chunks.length > 0) {
          this.push(chunks.shift());
        } else {
          this.push(null);
        }
      },
    });

    await pipelineAsync(readable, transform, async function* (source) {
      for await (const chunk of source) {
        resultChunks.push(chunk);
        yield chunk;
      }
    });

    // @ts-ignore
    return Buffer.concat(resultChunks).toString('utf8');
  };

  describe('basic escape quote transformation', () => {
    it('should replace backslash-quote with double quotes', async () => {
      const input = "INSERT INTO table VALUES ('John\\'s book');";
      const expected = "INSERT INTO table VALUES ('John''s book');";
      const result = await transformData(input);
      expect(result).toBe(expected);
    });

    it('should handle multiple escape quotes in one string', async () => {
      const input = "INSERT INTO table VALUES ('It\\'s John\\'s book');";
      const expected = "INSERT INTO table VALUES ('It''s John''s book');";
      const result = await transformData(input);
      expect(result).toBe(expected);
    });

    it('should handle empty string', async () => {
      const input = '';
      const expected = '';
      const result = await transformData(input);
      expect(result).toBe(expected);
    });

    it('should handle string without escape quotes', async () => {
      const input = "INSERT INTO table VALUES ('normal text');";
      const expected = "INSERT INTO table VALUES ('normal text');";
      const result = await transformData(input);
      expect(result).toBe(expected);
    });

    it('should handle only escape quotes', async () => {
      const input = "\\'\\'\\'";
      const expected = "''''''";
      const result = await transformData(input);
      expect(result).toBe(expected);
    });
  });

  describe('UTF-8 character boundary handling', () => {
    it('should handle Chinese characters correctly', async () => {
      const input = "INSERT INTO table VALUES ('用户\\'s 数据');";
      const expected = "INSERT INTO table VALUES ('用户''s 数据');";
      const result = await transformData(input);
      expect(result).toBe(expected);
    });

    it('should handle emoji characters correctly', async () => {
      const input = "INSERT INTO table VALUES ('Hello 😀\\' World 🌍');";
      const expected = "INSERT INTO table VALUES ('Hello 😀'' World 🌍');";
      const result = await transformData(input);
      expect(result).toBe(expected);
    });

    it('should handle UTF-8 character split across chunks', async () => {
      // Chinese character "用" (U+7528) in UTF-8 is [0xE7, 0x94, 0xA8]
      const chineseChar = '用';
      const chineseBytes = Buffer.from(chineseChar, 'utf8');

      // Split the character across chunks
      // @ts-ignore
      const chunk1 = Buffer.concat([Buffer.from("test\\'"), chineseBytes.subarray(0, 2)]);
      // @ts-ignore
      const chunk2 = Buffer.concat([chineseBytes.subarray(2), Buffer.from('test')]);

      const result = await transformDataInChunks([chunk1, chunk2]);
      expect(result).toBe("test''用test");
    });

    it('should handle 4-byte UTF-8 character split across chunks', async () => {
      // Emoji "😀" (U+1F600) in UTF-8 is [0xF0, 0x9F, 0x98, 0x80]
      const emoji = '😀';
      const emojiBytes = Buffer.from(emoji, 'utf8');

      // Split the emoji across chunks
      // @ts-ignore
      const chunk1 = Buffer.concat([Buffer.from("test\\'"), emojiBytes.subarray(0, 3)]);
      // @ts-ignore
      const chunk2 = Buffer.concat([emojiBytes.subarray(3), Buffer.from('test')]);

      const result = await transformDataInChunks([chunk1, chunk2]);
      expect(result).toBe("test''😀test");
    });
  });

  describe('escape sequence boundary handling', () => {
    it('should handle backslash at chunk boundary', async () => {
      const chunk1 = "INSERT INTO table VALUES ('John\\";
      const chunk2 = "'s book');";

      const result = await transformDataInChunks([chunk1, chunk2]);
      expect(result).toBe("INSERT INTO table VALUES ('John''s book');");
    });

    it('should handle multiple backslashes at chunk boundary', async () => {
      const chunk1 = 'test\\\\\\';
      const chunk2 = "'test";

      const result = await transformDataInChunks([chunk1, chunk2]);
      expect(result).toBe("test\\\\''test");
    });

    it('should handle backslash at end without following quote', async () => {
      const chunk1 = 'test\\';
      const chunk2 = 'test';

      const result = await transformDataInChunks([chunk1, chunk2]);
      expect(result).toBe('test\\test');
    });

    it('should handle single backslash at very end', async () => {
      const input = 'test\\';
      const result = await transformData(input);
      expect(result).toBe('test\\');
    });
  });

  describe('stream behavior with multiple chunks', () => {
    it('should handle data split across many small chunks', async () => {
      const input = "INSERT INTO table VALUES ('John\\'s book', 'Mary\\'s data');";
      const chunks = input.split('').map((char) => Buffer.from(char, 'utf8'));

      const result = await transformDataInChunks(chunks);
      expect(result).toBe("INSERT INTO table VALUES ('John''s book', 'Mary''s data');");
    });

    it('should handle large data with escape quotes', async () => {
      const largeText = "data\\'".repeat(1000);
      const input = `INSERT INTO table VALUES ('${largeText}');`;
      const expected = `INSERT INTO table VALUES ('${"data''".repeat(1000)}');`;

      const result = await transformData(input);
      expect(result).toBe(expected);
    });

    it('should handle mixed content with various escape patterns', async () => {
      const chunks = [
        "INSERT INTO users VALUES ('John\\'s', ",
        "'It\\'s a test\\', 'Mary\\'s data', ",
        "'Normal text', 'Another\\'s item');",
      ];

      const result = await transformDataInChunks(chunks);
      expect(result).toBe(
        "INSERT INTO users VALUES ('John''s', 'It''s a test'', 'Mary''s data', 'Normal text', 'Another''s item');",
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle Buffer input correctly', async () => {
      const input = Buffer.from("test\\'data", 'utf8');
      const result = await transformData(input);
      expect(result).toBe("test''data");
    });

    it('should handle very small chunks (single bytes)', async () => {
      const input = "a\\'b";
      const chunks = Array.from(Buffer.from(input, 'utf8')).map((byte) => Buffer.from([byte]));

      const result = await transformDataInChunks(chunks);
      expect(result).toBe("a''b");
    });

    it('should handle chunks with only backslashes', async () => {
      const chunks = ['\\', '\\', "'", 'test'];

      const result = await transformDataInChunks(chunks);
      expect(result).toBe("\\''test");
    });

    it('should handle real-world SQL dump scenario', async () => {
      const sqlDump = `
INSERT INTO \`users\` VALUES (1,'John\\'s Account','john@example.com','It\\'s a test description');
INSERT INTO \`posts\` VALUES (1,'Title with \\'quotes\\'','Content with \\'escaped\\' quotes',1);
INSERT INTO \`comments\` VALUES (1,'User\\'s comment','More \\'quoted\\' text',1,1);
      `.trim();

      const expected = `
INSERT INTO \`users\` VALUES (1,'John''s Account','john@example.com','It''s a test description');
INSERT INTO \`posts\` VALUES (1,'Title with ''quotes''','Content with ''escaped'' quotes',1);
INSERT INTO \`comments\` VALUES (1,'User''s comment','More ''quoted'' text',1,1);
      `.trim();

      const result = await transformData(sqlDump);
      expect(result).toBe(expected);
    });

    it('should handle mixed UTF-8 and escape sequences', async () => {
      const input = "用户\\'s 数据 with emoji 😀\\' and more 中文\\'text";
      const expected = "用户''s 数据 with emoji 😀'' and more 中文''text";

      const result = await transformData(input);
      expect(result).toBe(expected);
    });

    it('should handle stream with no data', async () => {
      const transform = new EscapeQuoteTransform();
      const chunks: Buffer[] = [];

      const readable = new Readable({
        read() {
          this.push(null); // End immediately
        },
      });

      await pipelineAsync(readable, transform, async function* (source) {
        for await (const chunk of source) {
          chunks.push(chunk);
          yield chunk;
        }
      });

      // @ts-ignore
      const result = Buffer.concat(chunks).toString('utf8');
      expect(result).toBe('');
    });
  });
});
