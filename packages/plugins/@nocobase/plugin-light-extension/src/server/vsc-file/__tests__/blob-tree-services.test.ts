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

import { VscError } from '../../../shared/vsc-file/errors';
import { BlobService } from '../services/BlobService';
import type { PreparedTree } from '../services/TreeService';
import { TreeService } from '../services/TreeService';
import { VscFileService } from '../services/VscFileService';

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

  it('restores shared files in tree order, resolves getFile by hash, and rejects incomplete pulls', async () => {
    const service = new VscFileService(db);
    const sharedContent = '\ufeff共享\r\nline 2\rline 3';
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'shared-blob-contract',
      name: 'main',
      initialFiles: [
        { path: 'z-last.txt', content: sharedContent },
        { path: 'a-first.txt', content: sharedContent },
      ],
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const blobFind = vi.spyOn(db.getRepository('vscFileBlobs'), 'find');

    const pull = await service.pullCommit({
      repoId: repository.id,
      commitId: initialCommit.id,
      includeContent: 'all',
    });

    expect(pull.files?.map((file) => file.path)).toEqual(['a-first.txt', 'z-last.txt']);
    expect(pull.files?.map((file) => file.content)).toEqual(['共享\nline 2\nline 3', '共享\nline 2\nline 3']);
    expect(new Set(pull.files?.map((file) => file.blobHash)).size).toBe(1);
    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(await db.getRepository('vscFileBlobs').count()).toBe(1);

    blobFind.mockClear();
    const selected = await service.pullCommit({
      repoId: repository.id,
      commitId: initialCommit.id,
      includeContent: 'selected',
      selectedPaths: ['z-last.txt', 'missing.txt'],
    });
    expect(selected.files?.filter((file) => typeof file.content === 'string')).toHaveLength(1);
    expect(blobFind).toHaveBeenCalledTimes(1);

    const treeEntryFindOne = vi.spyOn(db.getRepository('vscFileTreeEntries'), 'findOne');
    const blobFindOne = vi.spyOn(db.getRepository('vscFileBlobs'), 'findOne');
    const file = await service.getFile({ repoId: repository.id, path: 'a-first.txt' });
    expect(file).toMatchObject({
      path: 'a-first.txt',
      blobHash: pull.files?.[0].blobHash,
      content: '共享\nline 2\nline 3',
    });
    expect(treeEntryFindOne).toHaveBeenCalledTimes(1);
    expect(blobFindOne).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: file.blobHash }));
    expect(firstInvocationOrder(treeEntryFindOne)).toBeLessThan(firstInvocationOrder(blobFindOne));

    await db.getRepository('vscFileBlobs').destroy({ filterByTk: file.blobHash });
    await expect(
      service.pullCommit({ repoId: repository.id, commitId: initialCommit.id, includeContent: 'all' }),
    ).rejects.toMatchObject<VscError>({
      code: 'BLOB_NOT_FOUND',
      message: `Blob "${file.blobHash}" was not found`,
    });
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

  it('prepares canonical entries and persists them without resolving blobs again', async () => {
    const existing = await blobService.ensureBlob('existing\n');
    const blobFind = vi.spyOn(db.getRepository('vscFileBlobs'), 'find');
    const entries = [
      { path: 'z-existing.txt', blobHash: existing.hash, size: existing.size },
      { path: 'a-new.txt', content: '\ufeff你好\r\nline 2\r' },
      { path: 'nested/../invalid.txt', content: 'never reached' },
    ];

    await expect(treeService.prepareTree(entries)).rejects.toMatchObject<VscError>({ code: 'PATH_INVALID' });
    expect(blobFind).toHaveBeenCalledTimes(0);

    const prepared = await treeService.prepareTree(entries.slice(0, 2));

    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(prepared.entries.map((entry) => entry.path)).toEqual(['a-new.txt', 'z-existing.txt']);
    expect(prepared.canonicalBlobs).toEqual([
      expect.objectContaining({
        content: '你好\nline 2\n',
        size: Buffer.byteLength('你好\nline 2\n', 'utf8'),
      }),
    ]);
    expect(prepared.blobMetadata).toHaveLength(2);
    expect(prepared).toMatchObject({
      entryCount: 2,
      byteSize: existing.size + Buffer.byteLength('你好\nline 2\n', 'utf8'),
    });
    expect(Object.isFrozen(prepared)).toBe(true);
    expect(Object.isFrozen(prepared.entries)).toBe(true);
    expect(Object.isFrozen(prepared.entries[0])).toBe(true);

    blobFind.mockClear();
    const tree = await treeService.ensurePreparedTree(prepared);
    const storedEntries = await treeService.loadTreeEntries(tree.hash);

    expect(blobFind).toHaveBeenCalledTimes(0);
    expect(tree).toEqual({
      hash: prepared.hash,
      entryCount: prepared.entryCount,
      byteSize: prepared.byteSize,
    });
    expect(storedEntries).toEqual(prepared.entries);
  });

  it('keeps prepared and compatibility entry points canonically equivalent', async () => {
    const entries = [
      { path: 'src/index.ts', content: '\ufeffexport const value = "多字节";\r\n', language: ' typescript ' },
      { path: 'README.md', content: '# Demo\r' },
    ];
    const prepared = await treeService.prepareTree(entries);
    const hash = await treeService.hashTree(entries);
    const preparedTree = await treeService.ensurePreparedTree(prepared);
    const compatibilityTree = await treeService.ensureTree(entries);

    expect(hash).toBe(prepared.hash);
    expect(preparedTree).toEqual(compatibilityTree);
    expect(prepared.entries.find((entry) => entry.path === 'src/index.ts')).toMatchObject({
      size: Buffer.byteLength('export const value = "多字节";\n', 'utf8'),
      language: 'typescript',
      mode: '100644',
    });
    expect(await treeService.loadTreeEntries(prepared.hash)).toEqual(prepared.entries);
  });

  it('rejects forged prepared trees and explicit content size mismatches', async () => {
    const prepared = await treeService.prepareTree([{ path: 'README.md', content: '# Demo\n' }]);
    const otherTreeService = new TreeService(db, blobService);

    await expect(otherTreeService.ensurePreparedTree(prepared)).rejects.toMatchObject<VscError>({
      code: 'INTERNAL_ERROR',
    });
    await expect(treeService.ensurePreparedTree({} as unknown as PreparedTree)).rejects.toMatchObject<VscError>({
      code: 'INTERNAL_ERROR',
    });
    await expect(
      treeService.prepareTree([{ path: 'README.md', content: '# Demo\n', size: 1 }]),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });
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

function firstInvocationOrder(spy: { mock: { invocationCallOrder: number[] } }): number {
  const order = spy.mock.invocationCallOrder[0];
  if (typeof order !== 'number') {
    throw new Error('Expected spy to be invoked');
  }
  return order;
}
