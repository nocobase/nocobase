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

import { diffMaxFileSize } from '../../shared/constants';
import { sha256Hex } from '../../shared/hash';
import { BlobService } from '../services/BlobService';
import { DiffService, type FileDiffEntry, type FileDiffResult } from '../services/DiffService';
import { VscFileService } from '../services/VscFileService';

const persistedCollections = [
  'vscFileBlobs',
  'vscFileTrees',
  'vscFileTreeEntries',
  'vscFileCommits',
  'vscFileRefs',
  'vscFileRepositories',
] as const;

type PersistedCollection = (typeof persistedCollections)[number];
type CollectionCounts = Record<PersistedCollection, number>;

describe('vsc-file diff service', () => {
  let db: Database;
  let service: VscFileService;
  let blobService: BlobService;
  let diffService: DiffService;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();

    service = new VscFileService(db);
    blobService = new BlobService(db);
    diffService = new DiffService(db);
  });

  afterEach(async () => {
    await db?.close();
  });

  it('classifies commit file changes and detects simple renames by matching blob hash', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
      initialFiles: baseFiles(),
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const next = await service.push({
      repoId: repository.id,
      baseCommitId: initialCommit.id,
      message: 'change files',
      files: changedFiles(),
    });
    const diff = await service.diffCommits({
      repoId: repository.id,
      fromCommitId: initialCommit.id,
      toCommitId: next.commit.id,
    });

    expect(diff.summary).toEqual({
      added: 1,
      modified: 1,
      deleted: 1,
      unchanged: 1,
      renamed: 1,
    });
    expect(fileByPath(diff, 'README.md')).toMatchObject({
      status: 'modified',
      additions: 2,
      deletions: 0,
      tooLarge: false,
    });
    expect(fileByPath(diff, 'src/add.ts')).toMatchObject({
      status: 'added',
      additions: 1,
      deletions: 0,
    });
    expect(fileByPath(diff, 'src/delete.ts')).toMatchObject({
      status: 'deleted',
      additions: 0,
      deletions: 1,
    });
    expect(fileByPath(diff, 'src/index.ts')).toMatchObject({
      status: 'unchanged',
      additions: 0,
      deletions: 0,
    });
    expect(fileByPath(diff, 'src/rename-new.ts')).toMatchObject({
      status: 'renamed',
      oldPath: 'src/rename-old.ts',
      additions: 0,
      deletions: 0,
    });
  });

  it('classifies metadata-only tree entry changes as modified', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
      initialFiles: [{ path: 'scripts/run.sh', content: 'echo demo\n', language: 'text', mode: '100644' }],
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const next = await service.push({
      repoId: repository.id,
      baseCommitId: initialCommit.id,
      message: 'make script executable',
      files: [{ path: 'scripts/run.sh', content: 'echo demo\n', language: 'shell', mode: '100755' }],
    });

    const diff = await service.diffCommits({
      repoId: repository.id,
      fromCommitId: initialCommit.id,
      toCommitId: next.commit.id,
    });

    expect(diff.summary).toEqual({
      added: 0,
      modified: 1,
      deleted: 0,
      unchanged: 0,
      renamed: 0,
    });
    expect(fileByPath(diff, 'scripts/run.sh')).toMatchObject({
      status: 'modified',
      additions: 0,
      deletions: 0,
      oldLanguage: 'text',
      language: 'shell',
      oldMode: '100644',
      mode: '100755',
      tooLarge: false,
    });
  });

  it('returns stable one-line and multi-line file hunks', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const oldOneLine = await blobService.ensureBlob('old\n');
    const newOneLine = await blobService.ensureBlob('new\n');
    const oneLineDiff = await diffService.diffFile({
      repoId: repository.id,
      from: { type: 'blob', blobHash: oldOneLine.hash },
      to: { type: 'blob', blobHash: newOneLine.hash },
    });

    expect(oneLineDiff).toMatchObject({
      tooLarge: false,
      additions: 1,
      deletions: 1,
    });
    expect(oneLineDiff.hunks).toEqual([
      {
        oldStart: 1,
        oldLines: 1,
        newStart: 1,
        newLines: 1,
        lines: [
          { type: 'delete', content: 'old', oldLineNumber: 1 },
          { type: 'insert', content: 'new', newLineNumber: 1 },
        ],
      },
    ]);

    const oldMultiLine = await blobService.ensureBlob('one\ntwo\nthree\n');
    const newMultiLine = await blobService.ensureBlob('one\nsecond\nthree\n');
    const multiLineDiff = await diffService.diffFile({
      repoId: repository.id,
      from: { type: 'blob', blobHash: oldMultiLine.hash },
      to: { type: 'blob', blobHash: newMultiLine.hash },
    });

    expect(multiLineDiff).toMatchObject({
      tooLarge: false,
      additions: 1,
      deletions: 1,
    });
    expect(multiLineDiff.hunks).toEqual([
      {
        oldStart: 1,
        oldLines: 3,
        newStart: 1,
        newLines: 3,
        lines: [
          { type: 'context', content: 'one', oldLineNumber: 1, newLineNumber: 1 },
          { type: 'delete', content: 'two', oldLineNumber: 2 },
          { type: 'insert', content: 'second', newLineNumber: 2 },
          { type: 'context', content: 'three', oldLineNumber: 3, newLineNumber: 3 },
        ],
      },
    ]);

    const oldSeparatedEdits = await blobService.ensureBlob('one\ntwo\nthree\nfour\nfive\n');
    const newSeparatedEdits = await blobService.ensureBlob('one\nsecond\nthree\nfour\nfifth\n');
    const separatedEditDiff = await diffService.diffFile({
      repoId: repository.id,
      from: { type: 'blob', blobHash: oldSeparatedEdits.hash },
      to: { type: 'blob', blobHash: newSeparatedEdits.hash },
    });

    expect(separatedEditDiff).toMatchObject({
      tooLarge: false,
      additions: 2,
      deletions: 2,
    });
    expect(separatedEditDiff.hunks[0].lines).toEqual([
      { type: 'context', content: 'one', oldLineNumber: 1, newLineNumber: 1 },
      { type: 'delete', content: 'two', oldLineNumber: 2 },
      { type: 'insert', content: 'second', newLineNumber: 2 },
      { type: 'context', content: 'three', oldLineNumber: 3, newLineNumber: 3 },
      { type: 'context', content: 'four', oldLineNumber: 4, newLineNumber: 4 },
      { type: 'delete', content: 'five', oldLineNumber: 5 },
      { type: 'insert', content: 'fifth', newLineNumber: 5 },
    ]);

    const withoutFinalNewline = await blobService.ensureBlob('final');
    const withFinalNewline = await blobService.ensureBlob('final\n');
    const addedFinalNewline = await diffService.diffFile({
      repoId: repository.id,
      from: { type: 'blob', blobHash: withoutFinalNewline.hash },
      to: { type: 'blob', blobHash: withFinalNewline.hash },
    });
    const removedFinalNewline = await diffService.diffFile({
      repoId: repository.id,
      from: { type: 'blob', blobHash: withFinalNewline.hash },
      to: { type: 'blob', blobHash: withoutFinalNewline.hash },
    });

    expect(addedFinalNewline).toMatchObject({
      tooLarge: false,
      additions: 1,
      deletions: 1,
    });
    expect(addedFinalNewline.hunks[0].lines).toEqual([
      { type: 'delete', content: 'final', oldLineNumber: 1 },
      { type: 'insert', content: 'final', newLineNumber: 1 },
    ]);
    expect(removedFinalNewline).toMatchObject({
      tooLarge: false,
      additions: 1,
      deletions: 1,
    });
    expect(removedFinalNewline.hunks[0].lines).toEqual([
      { type: 'delete', content: 'final', oldLineNumber: 1 },
      { type: 'insert', content: 'final', newLineNumber: 1 },
    ]);
  });

  it('resolves file endpoints from commits', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
      initialFiles: baseFiles(),
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const next = await service.push({
      repoId: repository.id,
      baseCommitId: initialCommit.id,
      message: 'update README',
      files: [{ path: 'README.md', operation: 'upsert', content: '# Demo\n\nCommit update\n' }],
    });

    const diff = await diffService.diffFile({
      repoId: repository.id,
      from: { type: 'commit', commitId: initialCommit.id, path: 'README.md' },
      to: { type: 'commit', commitId: next.commit.id, path: 'README.md' },
    });

    expect(diff).toMatchObject({
      tooLarge: false,
      additions: 2,
      deletions: 0,
    });
    expect(diff.hunks[0].lines.map((line) => line.type)).toEqual(['context', 'insert', 'insert']);
  });

  it('skips file hunks when either side exceeds the diff size limit', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const largeContent = 'x'.repeat(diffMaxFileSize + 1);
    const largeHash = sha256Hex(largeContent);
    await db.getRepository('vscFileBlobs').create({
      values: {
        hash: largeHash,
        size: Buffer.byteLength(largeContent, 'utf8'),
        content: largeContent,
      },
    });

    const diff = await diffService.diffFile({
      repoId: repository.id,
      from: { type: 'blob', blobHash: largeHash },
      to: null,
    });

    expect(diff).toEqual({
      tooLarge: true,
      hunks: [],
    });
  });

  it('rejects raw blob endpoints through the public service facade', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const blob = await blobService.ensureBlob('secret\n');

    await expect(
      service.diffFile({
        repoId: repository.id,
        from: { type: 'blob', blobHash: blob.hash },
        to: null,
      }),
    ).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
    });
  });

  it('skips file hunks when the line diff is over budget', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const lineCount = 10001;
    const oldContent = Array.from({ length: lineCount }, (item, index) => `old-${index}`).join('\n');
    const newContent = Array.from({ length: lineCount }, (item, index) => `new-${index}`).join('\n');
    const oldBlob = await blobService.ensureBlob(oldContent);
    const newBlob = await blobService.ensureBlob(newContent);

    expect(oldBlob.size).toBeLessThanOrEqual(diffMaxFileSize);
    expect(newBlob.size).toBeLessThanOrEqual(diffMaxFileSize);

    const diff = await diffService.diffFile({
      repoId: repository.id,
      from: { type: 'blob', blobHash: oldBlob.hash },
      to: { type: 'blob', blobHash: newBlob.hash },
    });

    expect(diff).toEqual({
      tooLarge: true,
      hunks: [],
    });
  });

  it('does not persist records while diffing', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
      initialFiles: baseFiles(),
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const next = await service.push({
      repoId: repository.id,
      baseCommitId: initialCommit.id,
      message: 'change files',
      files: changedFiles(),
    });
    const before = await countPersistedRows(db);

    await service.diffCommits({
      repoId: repository.id,
      fromCommitId: initialCommit.id,
      toCommitId: next.commit.id,
    });
    await service.diffFile({
      repoId: repository.id,
      from: { type: 'commit', commitId: initialCommit.id, path: 'README.md' },
      to: { type: 'commit', commitId: next.commit.id, path: 'README.md' },
    });

    expect(await countPersistedRows(db)).toEqual(before);
  });
});

function baseFiles() {
  return [
    { path: 'README.md', content: '# Demo\n' },
    { path: 'src/index.ts', content: 'export const value = 1;\n' },
    { path: 'src/delete.ts', content: 'export const removed = true;\n' },
    { path: 'src/rename-old.ts', content: 'export const renamed = true;\n' },
  ];
}

function changedFiles() {
  return [
    { path: 'README.md', content: '# Demo\n\nUpdated\n' },
    { path: 'src/delete.ts', operation: 'delete' as const },
    { path: 'src/add.ts', content: 'export const added = true;\n' },
    { path: 'src/rename-old.ts', operation: 'delete' as const },
    { path: 'src/rename-new.ts', content: 'export const renamed = true;\n' },
  ];
}

function fileByPath(diff: FileDiffResult, filePath: string): FileDiffEntry {
  const file = diff.files.find((entry) => entry.path === filePath);
  if (!file) {
    throw new Error(`Expected diff entry for ${filePath}`);
  }

  return file;
}

async function countPersistedRows(db: Database): Promise<CollectionCounts> {
  const counts = {} as CollectionCounts;

  for (const collectionName of persistedCollections) {
    counts[collectionName] = await db.getRepository(collectionName).count();
  }

  return counts;
}
