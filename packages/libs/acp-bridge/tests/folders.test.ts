import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listFolders } from '../src/folders.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'acp-folders-'));
  for (const name of ['zeta', 'Alpha', '.hidden', 'beta'])
    await mkdir(path.join(root, name));
  await writeFile(path.join(root, 'notes.md'), '');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('listFolders', () => {
  it('lists the folders a person would see, sorted', async () => {
    await expect(listFolders([root], `${root}/`)).resolves.toEqual({
      path: root,
      folders: ['Alpha', 'beta', 'zeta'],
      truncated: false,
    });
  });

  it('refuses a directory outside the allowed ones, and a relative one', async () => {
    await expect(listFolders([path.join(root, 'beta')], root)).rejects.toThrow(
      /work only under/u,
    );
    await expect(listFolders([root], 'beta')).rejects.toThrow(
      /work only under/u,
    );
  });
});
