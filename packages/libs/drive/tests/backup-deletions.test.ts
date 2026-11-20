import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  createDriveManager,
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

it('keeps deletes and moves pending until the last backup releases its lease', async () => {
  const disk = createDriveManager({
    default: 'local',
    disks: { local: { driver: 'fs', location: root, visibility: 'private' } },
  }).use();
  await disk.put('tree/remove', 'remove');
  await disk.put('tree/replace', 'original');
  await disk.put('source', 'move me');
  await expect(
    disk.put('tree/.nocobase-backup/readers.sqlite', 'reserved'),
  ).rejects.toThrow();
  await withDriveBackup([root], async () => {
    await withDriveBackup([root], async () => {
      await disk.deleteAll('tree');
      await disk.move('source', 'destination');
      await disk.put('tree/replace', 'replacement');
      expect(await disk.get('tree/remove')).toBe('remove');
      expect(await disk.get('source')).toBe('move me');
    });
    expect(await disk.get('tree/remove')).toBe('remove');
  });
  expect(await disk.exists('tree/remove')).toBe(false);
  expect(await disk.exists('source')).toBe(false);
  expect(await disk.get('tree/replace')).toBe('replacement');
  expect(await disk.get('destination')).toBe('move me');
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
