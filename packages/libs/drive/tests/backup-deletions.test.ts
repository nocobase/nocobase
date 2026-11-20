import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  createDriveManager,
  DriveBackupConflictError,
  tryStorageLock,
  withDriveBackup,
} from '../src/index.js';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'drive-defer-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const drive = () =>
  createDriveManager({
    default: 'local',
    disks: { local: { driver: 'fs', location: root, visibility: 'private' } },
  }).use();

it('keeps deletes and moves pending and reports replacement until the last backup releases its lease', async () => {
  const disk = drive();
  await disk.put('tree/remove', 'remove');
  await disk.put('tree/replace', 'original');
  await disk.put('source', 'move me');
  await expect(
    disk.put('tree/.nocobase-backup/readers.sqlite', 'reserved'),
  ).rejects.toThrow();
  await expect(
    withDriveBackup([root], async () => {
      await expect(
        withDriveBackup([root], async () => {
          await disk.deleteAll('tree');
          await disk.move('source', 'destination');
          await disk.put('tree/replace', 'replacement');
          expect(await disk.get('tree/remove')).toBe('remove');
          expect(await disk.get('source')).toBe('move me');
        }),
      ).rejects.toBeInstanceOf(DriveBackupConflictError);
      expect(await disk.get('tree/remove')).toBe('remove');
    }),
  ).rejects.toBeInstanceOf(DriveBackupConflictError);
  expect(await disk.exists('tree/remove')).toBe(false);
  expect(await disk.exists('source')).toBe(false);
  expect(await disk.get('tree/replace')).toBe('replacement');
  expect(await disk.get('destination')).toBe('move me');
  await expect(
    withDriveBackup([root], () => disk.get('tree/replace')),
  ).resolves.toBe('replacement');
});

it.each(['put', 'stream', 'copy', 'move', 'recreate'])(
  'rejects a cross-process %s replacement, preserving the write and permitting retry',
  async (key) => {
    const disk = drive();
    await disk.put(key, 'old');
    await disk.put('source', 'new');
    await disk.put('move-source', 'new');
    await expect(
      withDriveBackup([root], async () => {
        const exec = promisify(execFile);
        await exec(
          process.execPath,
          [
            '--import',
            'tsx',
            fileURLToPath(
              new URL('./fixtures/backup-writes.mjs', import.meta.url),
            ),
            root,
            key,
          ],
          { cwd: fileURLToPath(new URL('../../../../', import.meta.url)) },
        );
        expect(await disk.get(key)).toBe('new');
        expect(await disk.exists('move-source')).toBe(true);
      }),
    ).rejects.toMatchObject({ roots: [root] });
    expect(await disk.exists('move-source')).toBe(key !== 'move');
    await expect(withDriveBackup([root], () => disk.get(key))).resolves.toBe(
      'new',
    );
  },
);

it('does not block backup on an unfinished upload or publish bytes from a failed stream', async () => {
  const disk = drive();
  await disk.put('existing', 'old');
  const slow = new PassThrough();
  const upload = disk.putStream('existing', slow);
  slow.write('new');
  await expect(
    withDriveBackup([root], () => disk.get('existing')),
  ).resolves.toBe('old');
  await expect(
    withDriveBackup([root], async () => {
      slow.end();
      await upload;
    }),
  ).rejects.toBeInstanceOf(DriveBackupConflictError);
  expect(await disk.get('existing')).toBe('new');
  const failed = new PassThrough();
  await withDriveBackup([root], async () => {
    const failedUpload = disk.putStream('existing', failed);
    failed.write('partial upload');
    setImmediate(() => failed.destroy(new Error('upload failed')));
    await expect(failedUpload).rejects.toThrow();
    expect(await disk.get('existing')).toBe('new');
    await disk.put('new-key', 'new');
  });
});

it('excludes startup from an exclusive maintenance window', async () => {
  const filename = join(root, 'guard.sqlite');
  const first = await tryStorageLock(filename, 'shared');
  expect(first).toBeDefined();
  expect(await tryStorageLock(filename, 'exclusive')).toBeUndefined();
  first?.();
  const exclusive = await tryStorageLock(filename, 'exclusive');
  try {
    expect(exclusive).toBeDefined();
    expect(await tryStorageLock(filename, 'shared')).toBeUndefined();
    expect(await readFile(filename)).toBeDefined();
  } finally {
    exclusive?.();
  }
});
