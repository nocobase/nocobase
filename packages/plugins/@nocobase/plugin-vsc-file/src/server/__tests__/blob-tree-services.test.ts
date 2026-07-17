/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import path from 'path';
import { vi } from 'vitest';

import { VscError } from '../../shared/errors';
import { BlobService } from '../services/BlobService';
import { TreeService } from '../services/TreeService';

describe('vsc-file blob and tree services', () => {
  let db: Database;
  let blobService: BlobService;
  let treeService: TreeService;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();

    blobService = new BlobService(db);
    treeService = new TreeService(db, blobService);
  });

  afterEach(async () => {
    await db?.close();
  });

  it('writes one blob for identical normalized content', async () => {
    const first = await blobService.ensureBlob('\ufeffhello\n');
    const second = await blobService.ensureBlob('hello\n');

    expect(second.hash).toBe(first.hash);
    expect(await db.getRepository('vscFileBlobs').count()).toBe(1);
  });

  it('deduplicates CRLF and LF content when line endings are normalized', async () => {
    const crlf = await blobService.ensureBlob('line 1\r\nline 2\r\n');
    const lf = await blobService.ensureBlob('line 1\nline 2\n');

    expect(lf.hash).toBe(crlf.hash);
    expect(await db.getRepository('vscFileBlobs').count()).toBe(1);
  });

  it('loads unique blob content and metadata in one collection query', async () => {
    const first = await blobService.ensureBlob('\ufeff你好\r\nline 2\rline 3');
    const second = await blobService.ensureBlob('second\n');
    const blobFind = vi.spyOn(db.getRepository('vscFileBlobs'), 'find');
    const transaction = await db.sequelize.transaction();

    const blobs = await blobService.loadBlobs([first.hash, second.hash, first.hash], { transaction });

    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(blobFind).toHaveBeenCalledWith({
      filter: {
        hash: { $in: [first.hash, second.hash] },
      },
      fields: ['hash', 'size', 'content'],
      transaction,
    });
    expect([...blobs.keys()]).toEqual(expect.arrayContaining([first.hash, second.hash]));
    expect(blobs.get(first.hash)).toEqual(first);
    expect(blobs.get(second.hash)).toEqual(second);
    expect(blobs.get(first.hash)?.content).toBe('你好\nline 2\nline 3');
    expect(blobs.get(first.hash)?.size).toBe(Buffer.byteLength('你好\nline 2\nline 3', 'utf8'));

    blobFind.mockClear();
    const metadata = await blobService.loadBlobMetadata([second.hash, first.hash, second.hash], { transaction });

    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(blobFind).toHaveBeenCalledWith({
      filter: {
        hash: { $in: [second.hash, first.hash] },
      },
      fields: ['hash', 'size'],
      transaction,
    });
    expect(metadata.get(first.hash)).toEqual({ hash: first.hash, size: first.size });
    expect(metadata.get(second.hash)).toEqual({ hash: second.hash, size: second.size });
    expect(metadata.get(first.hash)).not.toHaveProperty('content');

    await transaction.rollback();
  });

  it('does not query blobs for empty batch inputs', async () => {
    const blobFind = vi.spyOn(db.getRepository('vscFileBlobs'), 'find');

    await expect(blobService.loadBlobs([])).resolves.toEqual(new Map());
    await expect(blobService.loadBlobMetadata([])).resolves.toEqual(new Map());

    expect(blobFind).toHaveBeenCalledTimes(0);
  });

  it('rejects incomplete content and metadata batches before returning partial results', async () => {
    const stored = await blobService.ensureBlob('stored\n');
    const missingHash = 'a'.repeat(64);

    await expect(blobService.loadBlobs([stored.hash, missingHash])).rejects.toMatchObject<VscError>({
      code: 'BLOB_NOT_FOUND',
      message: `Blob "${missingHash}" was not found`,
    });
    await expect(blobService.loadBlobMetadata([missingHash, stored.hash])).rejects.toMatchObject<VscError>({
      code: 'BLOB_NOT_FOUND',
      message: `Blob "${missingHash}" was not found`,
    });
  });

  it('keeps tree hashes stable regardless of input order', async () => {
    const first = await treeService.ensureTree([
      { path: 'src/index.ts', content: 'export const value = 1;\n' },
      { path: 'README.md', content: '# Demo\n' },
    ]);
    const second = await treeService.ensureTree([
      { path: 'README.md', content: '# Demo\n' },
      { path: 'src/index.ts', content: 'export const value = 1;\n' },
    ]);
    const hashOnly = await treeService.hashTree([
      { path: 'src/index.ts', content: 'export const value = 1;\n' },
      { path: 'README.md', content: '# Demo\n' },
    ]);

    expect(second.hash).toBe(first.hash);
    expect(hashOnly).toBe(first.hash);
    expect(await db.getRepository('vscFileTrees').count()).toBe(1);
  });

  it('rejects case-only duplicate paths in the same tree', async () => {
    await expect(
      treeService.ensureTree([
        { path: 'Foo.ts', content: 'export const foo = 1;\n' },
        { path: 'foo.ts', content: 'export const foo = 2;\n' },
      ]),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });
  });

  it('rejects dot path segments before hashing tree entries', async () => {
    await expect(
      treeService.ensureTree([{ path: './src/index.ts', content: 'export const value = 1;\n' }]),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });

    await expect(
      treeService.ensureTree([{ path: 'src/./index.ts', content: 'export const value = 1;\n' }]),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });
  });

  it('derives hash-only tree entry size from the stored blob', async () => {
    const blob = await blobService.ensureBlob('export const value = 1;\n');
    const tree = await treeService.ensureTree([{ path: 'src/index.ts', blobHash: blob.hash }]);
    const entries = await treeService.loadTreeEntries(tree.hash);

    expect(entries[0]).toMatchObject({
      blobHash: blob.hash,
      size: blob.size,
    });
  });

  it('rejects hash-only tree entries when the blob is missing or has a mismatched size', async () => {
    await expect(
      treeService.ensureTree([{ path: 'src/missing.ts', blobHash: 'a'.repeat(64) }]),
    ).rejects.toMatchObject<VscError>({
      code: 'BLOB_NOT_FOUND',
    });

    const blob = await blobService.ensureBlob('export const value = 1;\n');

    await expect(
      treeService.ensureTree([{ path: 'src/index.ts', blobHash: blob.hash, size: blob.size + 1 }]),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });
  });

  it('rejects tree entry metadata that exceeds persisted field limits', async () => {
    await expect(
      treeService.ensureTree([
        { path: 'src/index.ts', content: 'export const value = 1;\n', language: 'x'.repeat(65) },
      ]),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });

    await expect(
      treeService.ensureTree([{ path: 'src/index.ts', content: 'export const value = 1;\n', mode: 'x'.repeat(17) }]),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });
  });

  it('loads tree entries without blob content', async () => {
    const tree = await treeService.ensureTree([
      { path: 'src/index.ts', content: 'export const value = 1;\n' },
      { path: 'README.md', content: '# Demo\n' },
    ]);
    const entries = await treeService.loadTreeEntries(tree.hash);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      path: 'README.md',
      language: 'markdown',
      mode: '100644',
    });
    expect(entries[1]).toMatchObject({
      path: 'src/index.ts',
      language: 'typescript',
      mode: '100644',
    });
    expect(entries[0]).not.toHaveProperty('content');
    expect(entries[1]).not.toHaveProperty('content');
  });
});
