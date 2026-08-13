/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import JSZip from 'jszip';

import { maxFileSize, maxFilesPerRepo } from '../../shared/constants';
import { defaultRunJSWorkspaceZipLimits, readRunJSWorkspaceZip } from '../runjs-sources';

describe('RunJS workspace ZIP limits', () => {
  it('rejects a highly compressed entry before unbounded decompression', async () => {
    const zip = new JSZip();
    zip.file('src/main.ts', 'a'.repeat(maxFileSize + 1));
    const zipBase64 = await zip.generateAsync({
      compression: 'DEFLATE',
      type: 'base64',
    });

    await expect(readRunJSWorkspaceZip(zipBase64)).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
      status: 413,
    });
  });

  it('rejects archives with too many files before reading their contents', async () => {
    const zip = new JSZip();
    for (let index = 0; index <= maxFilesPerRepo; index += 1) {
      zip.file(`src/file-${index}.ts`, '');
    }
    const zipBase64 = await zip.generateAsync({
      compression: 'DEFLATE',
      type: 'base64',
    });

    await expect(readRunJSWorkspaceZip(zipBase64)).rejects.toMatchObject({
      code: 'REPO_LIMIT_EXCEEDED',
      status: 413,
    });
  });

  it('rejects symbolic links', async () => {
    const zip = new JSZip();
    zip.file('src/link.ts', '../target.ts', { unixPermissions: 0o120777 });
    const zipBase64 = await zip.generateAsync({ platform: 'UNIX', type: 'base64' });

    await expect(readRunJSWorkspaceZip(zipBase64)).rejects.toMatchObject({
      code: 'PATH_INVALID',
      message: expect.stringContaining('symbolic link'),
      status: 400,
    });
  });

  it('rejects invalid UTF-8 source files', async () => {
    const zip = new JSZip();
    zip.file('src/main.ts', Buffer.from([0xff, 0xfe]));
    const zipBase64 = await zip.generateAsync({ type: 'base64' });

    await expect(readRunJSWorkspaceZip(zipBase64)).rejects.toMatchObject({
      code: 'TEXT_ENCODING_INVALID',
      message: expect.stringContaining('valid UTF-8'),
      status: 400,
    });
  });

  it('rejects case-insensitive duplicate paths', async () => {
    const zip = new JSZip();
    zip.file('src/main.ts', 'export default 1;');
    zip.file('src/Main.ts', 'export default 2;');
    const zipBase64 = await zip.generateAsync({ type: 'base64' });

    await expect(readRunJSWorkspaceZip(zipBase64)).rejects.toMatchObject({
      code: 'PATH_INVALID',
      message: expect.stringContaining('Duplicate file path'),
      status: 400,
    });
  });

  it('rejects unsafe compression ratios', async () => {
    const zip = new JSZip();
    zip.file('src/main.ts', 'a'.repeat(256 * 1024));
    const zipBase64 = await zip.generateAsync({ compression: 'DEFLATE', type: 'base64' });

    await expect(readRunJSWorkspaceZip(zipBase64)).rejects.toMatchObject({
      code: 'REPO_LIMIT_EXCEEDED',
      message: 'ZIP compression ratio is too high',
      status: 413,
    });
  });

  it('normalizes invalid archives to the public error contract', async () => {
    await expect(readRunJSWorkspaceZip(Buffer.from('not a zip').toString('base64'))).rejects.toMatchObject({
      code: 'PATH_INVALID',
      status: 400,
    });
  });

  it('applies configurable compressed, file-count, per-file, total, and compression-ratio limits', async () => {
    const twoFileZip = await createZipBase64({
      'src/first.ts': '1234',
      'src/second.ts': '5678',
    });
    const compressedBytes = Buffer.from(twoFileZip, 'base64').byteLength;

    await expect(
      readRunJSWorkspaceZip(twoFileZip, { limits: { maxCompressedBytes: compressedBytes - 1 } }),
    ).rejects.toMatchObject({
      code: 'REPO_LIMIT_EXCEEDED',
      details: { maxCompressedBytes: compressedBytes - 1 },
    });
    await expect(readRunJSWorkspaceZip(twoFileZip, { limits: { maxFiles: 1 } })).rejects.toMatchObject({
      code: 'REPO_LIMIT_EXCEEDED',
      details: { maxFiles: 1 },
    });
    await expect(readRunJSWorkspaceZip(twoFileZip, { limits: { maxFileBytes: 3 } })).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
      details: { maxFileBytes: 3 },
    });
    await expect(readRunJSWorkspaceZip(twoFileZip, { limits: { maxTotalBytes: 7 } })).rejects.toMatchObject({
      code: 'REPO_LIMIT_EXCEEDED',
      details: { maxTotalBytes: 7 },
    });

    const highlyCompressedZip = await createZipBase64({ 'src/main.ts': 'a'.repeat(128 * 1024) });
    await expect(
      readRunJSWorkspaceZip(highlyCompressedZip, { limits: { maxCompressionRatio: 1 } }),
    ).rejects.toMatchObject({
      code: 'REPO_LIMIT_EXCEEDED',
      details: { maxCompressionRatio: 1 },
    });
  });

  it('checks compression ratio per entry so unrelated archive bytes cannot hide a zip bomb', async () => {
    const zip = new JSZip();
    zip.file('src/bomb.ts', 'a'.repeat(128 * 1024));
    zip.file('README.md', randomText(64 * 1024));
    const zipBase64 = await zip.generateAsync({
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
      type: 'base64',
    });

    await expect(
      readRunJSWorkspaceZip(zipBase64, {
        limits: { maxCompressionRatio: 10 },
      }),
    ).rejects.toMatchObject({
      code: 'REPO_LIMIT_EXCEEDED',
      message: 'ZIP compression ratio is too high',
    });
  });

  it('enforces decompression limits before reading a malicious entry stream', async () => {
    const zipBase64 = await createZipBase64({ 'src/bomb.ts': 'a'.repeat(128 * 1024) });
    const streamSpy = vi.spyOn(JSZip as unknown as { loadAsync: typeof JSZip.loadAsync }, 'loadAsync');
    try {
      const loadedZip = await JSZip.loadAsync(Buffer.from(zipBase64, 'base64'));
      const bombEntry = loadedZip.file('src/bomb.ts');
      if (!bombEntry) {
        throw new Error('Expected ZIP bomb fixture entry');
      }
      const entryStreamSpy = vi.spyOn(bombEntry, 'nodeStream');
      streamSpy.mockResolvedValueOnce(loadedZip);

      await expect(readRunJSWorkspaceZip(zipBase64, { limits: { maxCompressionRatio: 10 } })).rejects.toMatchObject({
        code: 'REPO_LIMIT_EXCEEDED',
        message: 'ZIP compression ratio is too high',
      });
      expect(entryStreamSpy).not.toHaveBeenCalled();
    } finally {
      streamSpy.mockRestore();
    }
  });

  it('preserves the existing defaults when custom options are omitted', () => {
    expect(defaultRunJSWorkspaceZipLimits).toEqual({
      maxCompressedBytes: 10 * 1024 * 1024,
      maxFiles: 200,
      maxFileBytes: 1024 * 1024,
      maxTotalBytes: 10 * 1024 * 1024,
      maxCompressionRatio: 20,
    });
  });

  it('optionally strips one shared top-level directory and ignores platform metadata', async () => {
    const zipBase64 = await createZipBase64({
      'example/README.md': '# Example\n',
      'example/src/main.ts': 'export default 1;\n',
      'example/.DS_Store': 'metadata',
      '__MACOSX/example/._README.md': 'metadata',
    });

    const files = await readRunJSWorkspaceZip(zipBase64, {
      stripSingleTopLevelDirectory: true,
      ignoreMetadata: true,
    });

    expect(files).toEqual([
      { path: 'README.md', operation: 'upsert', content: '# Example\n' },
      { path: 'src/main.ts', operation: 'upsert', content: 'export default 1;\n' },
    ]);
  });

  it('does not strip mixed roots or allow stripping to bypass workspace path validation', async () => {
    const mixedRootZip = await createZipBase64({
      'first/src/main.ts': 'export default 1;\n',
      'second/src/main.ts': 'export default 2;\n',
    });
    const nonWorkspaceZip = await createZipBase64({
      'example/package.json': '{}',
    });

    await expect(readRunJSWorkspaceZip(mixedRootZip, { stripSingleTopLevelDirectory: true })).rejects.toMatchObject({
      code: 'PATH_INVALID',
    });
    await expect(readRunJSWorkspaceZip(nonWorkspaceZip, { stripSingleTopLevelDirectory: true })).rejects.toMatchObject({
      code: 'PATH_INVALID',
    });
  });

  it('detects case-only duplicates after stripping and ignores metadata before file-count checks', async () => {
    const duplicateZip = await createZipBase64({
      'example/src/main.ts': 'export default 1;\n',
      'example/src/Main.ts': 'export default 2;\n',
    });
    const metadataZip = await createZipBase64({
      'example/src/main.ts': 'export default 1;\n',
      'example/.DS_Store': 'metadata',
      '__MACOSX/example/._main.ts': 'metadata',
    });

    await expect(readRunJSWorkspaceZip(duplicateZip, { stripSingleTopLevelDirectory: true })).rejects.toMatchObject({
      code: 'PATH_INVALID',
      message: expect.stringContaining('Duplicate file path'),
    });
    await expect(
      readRunJSWorkspaceZip(metadataZip, {
        limits: { maxFiles: 1 },
        stripSingleTopLevelDirectory: true,
        ignoreMetadata: true,
      }),
    ).resolves.toHaveLength(1);
  });

  it('retains strict default metadata handling and supports a custom metadata predicate', async () => {
    const zipBase64 = await createZipBase64({
      'src/main.ts': 'export default 1;\n',
      'notes.txt': 'ignored by caller',
    });

    await expect(readRunJSWorkspaceZip(zipBase64)).rejects.toMatchObject({ code: 'PATH_INVALID' });
    await expect(readRunJSWorkspaceZip(zipBase64, { ignoreMetadata: (path) => path === 'notes.txt' })).resolves.toEqual(
      [{ path: 'src/main.ts', operation: 'upsert', content: 'export default 1;\n' }],
    );
  });

  it('preserves canonical compile checks when only archive transport limits are customized', async () => {
    const zipBase64 = await createZipBase64({
      'src/main.ts': 'export default 1;\n',
      'src/Main.ts': 'export default 2;\n',
    });

    await expect(
      readRunJSWorkspaceZip(zipBase64, {
        limits: { maxCompressedBytes: Buffer.from(zipBase64, 'base64').byteLength + 1 },
      }),
    ).rejects.toMatchObject({
      code: 'PATH_INVALID',
      message: expect.stringContaining('Duplicate file path'),
    });
  });

  it('rejects backslash paths, arbitrary comma prefixes, and impossible zero compressed sizes', async () => {
    const backslashZip = await createZipBase64({ 'src\\main.ts': 'export default 1;\n' });
    await expect(readRunJSWorkspaceZip(backslashZip)).rejects.toMatchObject({ code: 'PATH_INVALID' });

    const validZip = await createZipBase64({ 'src/main.ts': 'export default 1;\n' });
    await expect(readRunJSWorkspaceZip(`not-a-data-uri,${validZip}`)).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_LOCATOR_INVALID',
    });
    await expect(readRunJSWorkspaceZip(`data:application/zip;base64,${validZip}`)).resolves.toHaveLength(1);

    const loadedZip = await JSZip.loadAsync(Buffer.from(validZip, 'base64'));
    const entry = loadedZip.file('src/main.ts');
    if (!entry) {
      throw new Error('Expected ZIP fixture entry');
    }
    const entryData = (entry as unknown as { _data: { compressedSize: number } })._data;
    entryData.compressedSize = 0;
    const loadSpy = vi
      .spyOn(JSZip as unknown as { loadAsync: typeof JSZip.loadAsync }, 'loadAsync')
      .mockResolvedValueOnce(loadedZip);
    try {
      await expect(readRunJSWorkspaceZip(validZip)).rejects.toMatchObject({
        code: 'REPO_LIMIT_EXCEEDED',
        message: 'ZIP compression ratio is too high',
      });
    } finally {
      loadSpy.mockRestore();
    }
  });

  it.each([
    { name: 'zero', limits: { maxFiles: 0 } },
    { name: 'fractional', limits: { maxCompressionRatio: 1.5 } },
  ])('rejects $name custom limits', async ({ limits }) => {
    const zipBase64 = await createZipBase64({ 'src/main.ts': 'export default 1;\n' });

    await expect(readRunJSWorkspaceZip(zipBase64, { limits })).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_LOCATOR_INVALID',
    });
  });
});

async function createZipBase64(files: Record<string, string | Buffer>): Promise<string> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }

  return zip.generateAsync({
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    type: 'base64',
  });
}

function randomText(length: number): string {
  let state = 0x12345678;
  let value = '';
  for (let index = 0; index < length; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    value += String.fromCharCode(32 + (state % 95));
  }
  return value;
}
