/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs/promises';
import JSZip from 'jszip';
import os from 'os';
import path from 'path';

import { CLIENT_APP_ARCHIVE_LIMITS, prepareClientAppArchive } from '../services/ClientAppArchive';

describe('ClientAppArchive', () => {
  const temporaryPaths: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryPaths.splice(0).map((target) => fs.rm(target, { recursive: true, force: true })));
  });

  it('preserves binary assets and supports default and nested entry files', async () => {
    const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x7f, 0x80]);
    const defaultArchive = await createZip({
      'entry.json': JSON.stringify({ schemaVersion: 1, key: 'root-app' }),
      'index.html': '<html><script src="./app.js"></script></html>',
      'app.js': 'console.log("root")',
      'assets/logo.png': binary,
    });
    const preparedDefault = await prepareClientAppArchive(defaultArchive);
    expect(preparedDefault.entryHtml).toBe('index.html');
    expect(preparedDefault.staticRoot).toBe('');
    expect(preparedDefault.assets.map((asset) => asset.relativePath)).toEqual([
      'app.js',
      'assets/logo.png',
      'index.html',
    ]);
    const logoAsset = preparedDefault.assets.find((asset) => asset.relativePath === 'assets/logo.png');
    expect(logoAsset).toBeDefined();
    await expect(fs.readFile(requireValue(logoAsset).filePath)).resolves.toEqual(binary);
    await preparedDefault.dispose();

    const nestedArchive = await createZip({
      'package/entry.json': JSON.stringify({
        schemaVersion: 1,
        key: 'nested-app',
        entry: 'dist/application.html',
      }),
      'package/README.md': 'not served',
      'package/dist/application.html': '<html></html>',
      'package/dist/assets/app.css': 'body{}',
    });
    const preparedNested = await prepareClientAppArchive(nestedArchive);
    expect(preparedNested.entryHtml).toBe('dist/application.html');
    expect(preparedNested.staticRoot).toBe('dist');
    expect(preparedNested.assets.map((asset) => asset.relativePath)).toEqual(['application.html', 'assets/app.css']);
    await preparedNested.dispose();
  });

  it.each([
    {
      name: 'traversal',
      files: {
        'entry.json': JSON.stringify({ schemaVersion: 1, key: 'unsafe-app' }),
        'index.html': '<html></html>',
        '../escape.js': 'escape',
      },
      message: /invalid segment|must be relative|invalid relative path/u,
    },
    {
      name: 'case collision',
      files: {
        'entry.json': JSON.stringify({ schemaVersion: 1, key: 'unsafe-app' }),
        'index.html': '<html></html>',
        'App.js': 'one',
        'app.js': 'two',
      },
      message: /case-insensitive path collision/u,
    },
    {
      name: 'absolute path',
      files: {
        'entry.json': JSON.stringify({ schemaVersion: 1, key: 'unsafe-app' }),
        'index.html': '<html></html>',
        '/absolute.js': 'escape',
      },
      message: /must be relative|absolute path/u,
    },
    {
      name: 'missing entry file',
      files: {
        'entry.json': JSON.stringify({ schemaVersion: 1, key: 'unsafe-app', entry: 'dist/app.html' }),
        'index.html': '<html></html>',
      },
      message: /was not found/u,
    },
    {
      name: 'missing descriptor',
      files: {
        'index.html': '<html></html>',
      },
      message: /entry\.json/u,
    },
  ])('rejects $name archives', async ({ files, message }) => {
    const zipPath = await createZip(files);
    await expect(prepareClientAppArchive(zipPath)).rejects.toThrow(message);
  });

  it('rejects symlinks, excessive compression ratios, and file-count overflow', async () => {
    const symlinkZip = new JSZip();
    symlinkZip.file('entry.json', JSON.stringify({ schemaVersion: 1, key: 'symlink-app' }));
    symlinkZip.file('index.html', '<html></html>');
    symlinkZip.file('link.js', 'target.js', { unixPermissions: 0o120777 });
    const symlinkPath = await writeZip(symlinkZip, { platform: 'UNIX' });
    await expect(prepareClientAppArchive(symlinkPath)).rejects.toThrow(/regular file or directory/u);

    const compressedZip = new JSZip();
    compressedZip.file('entry.json', JSON.stringify({ schemaVersion: 1, key: 'compressed-app' }));
    compressedZip.file('index.html', '<html></html>');
    compressedZip.file('zeros.bin', Buffer.alloc(1024 * 1024));
    const compressedPath = await writeZip(compressedZip, { compression: 'DEFLATE', compressionOptions: { level: 9 } });
    await expect(prepareClientAppArchive(compressedPath)).rejects.toThrow(/compression-ratio/u);

    const overflowZip = new JSZip();
    overflowZip.file('entry.json', JSON.stringify({ schemaVersion: 1, key: 'many-files-app' }));
    overflowZip.file('index.html', '<html></html>');
    for (let index = 0; index < CLIENT_APP_ARCHIVE_LIMITS.files; index += 1) {
      overflowZip.file(`files/${index}.txt`, 'x');
    }
    const overflowPath = await writeZip(overflowZip);
    await expect(prepareClientAppArchive(overflowPath)).rejects.toThrow(/more than/u);
  }, 30_000);

  it('rejects duplicate and backslash central-directory paths', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-archive-test-'));
    temporaryPaths.push(root);
    const zipPath = path.join(root, 'duplicate.zip');
    await fs.writeFile(
      zipPath,
      createStoredZip([
        ['entry.json', Buffer.from(JSON.stringify({ schemaVersion: 1, key: 'duplicate-app' }))],
        ['index.html', Buffer.from('<html>first</html>')],
        ['index.html', Buffer.from('<html>second</html>')],
      ]),
    );
    await expect(prepareClientAppArchive(zipPath)).rejects.toThrow(/duplicate path/u);

    const backslashPath = path.join(root, 'backslash.zip');
    await fs.writeFile(
      backslashPath,
      createStoredZip([
        ['entry.json', Buffer.from(JSON.stringify({ schemaVersion: 1, key: 'backslash-app' }))],
        ['index.html', Buffer.from('<html></html>')],
        ['assets\\escape.js', Buffer.from('escape')],
      ]),
    );
    await expect(prepareClientAppArchive(backslashPath)).rejects.toThrow(/backslashes|invalid characters/u);
  });

  it('rejects paths that cannot fit the persisted relative-path field', async () => {
    const longPath = `${'a'.repeat(CLIENT_APP_ARCHIVE_LIMITS.pathBytes)}.js`;
    const zipPath = await createZip({
      'entry.json': JSON.stringify({ schemaVersion: 1, key: 'long-path-app' }),
      'index.html': '<html></html>',
      [longPath]: 'too long',
    });
    await expect(prepareClientAppArchive(zipPath)).rejects.toThrow(/path length limit/u);
  });

  async function createZip(files: Record<string, string | Buffer>): Promise<string> {
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files)) {
      zip.file(name, content);
    }
    return writeZip(zip);
  }

  async function writeZip(
    zip: JSZip,
    options: JSZip.JSZipGeneratorOptions<'nodebuffer'> = { type: 'nodebuffer' },
  ): Promise<string> {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-archive-test-'));
    temporaryPaths.push(root);
    const zipPath = path.join(root, 'fixture.zip');
    const buffer = await zip.generateAsync({ type: 'nodebuffer', ...options });
    await fs.writeFile(zipPath, buffer);
    return zipPath;
  }
});

function requireValue<T>(value: T | undefined): T {
  if (typeof value === 'undefined') {
    throw new Error('Expected value to be defined');
  }
  return value;
}

function createStoredZip(entries: Array<[string, Buffer]>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;
  for (const [name, content] of entries) {
    const encodedName = Buffer.from(name);
    const crc = crc32(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(encodedName.length, 26);
    localParts.push(localHeader, encodedName, content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE((3 << 8) | 20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(encodedName.length, 28);
    centralHeader.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, encodedName);
    localOffset += localHeader.length + encodedName.length + content.length;
  }
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, central, end]);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
