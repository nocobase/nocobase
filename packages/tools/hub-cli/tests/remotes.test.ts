// @vitest-environment node
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  parseRemoteUrl,
  readRemotes,
  REMOTES_FILE,
  remotesIgnoredByGit,
  resolveRemote,
  writeRemotes,
} from '../src/remotes.ts';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-remotes-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('remote URLs', () => {
  it.each([
    ['https://hub.example/main/apps/crm', 'https://hub.example/main', 'crm'],
    ['https://hub.example/apps/crm/', 'https://hub.example', 'crm'],
    ['http://localhost:13000/apps/a_b-1', 'http://localhost:13000', 'a_b-1'],
    // The last /apps/ segment divides the Hub from the App, whatever the Hub is mounted under.
    [
      'https://hub.example/apps/hub/apps/crm',
      'https://hub.example/apps/hub',
      'crm',
    ],
  ])('splits %s', (input, hub, appId) => {
    expect(parseRemoteUrl(input)).toEqual({
      url: `${hub}/apps/${appId}`,
      hub,
      appId,
    });
  });

  it.each([
    'hub.example/apps/crm',
    'ftp://hub.example/apps/crm',
    'https://user:secret@hub.example/apps/crm',
    'https://hub.example/apps/crm?x=1',
    'https://hub.example/apps/crm#top',
    'https://hub.example/main',
    'https://hub.example/apps/',
    'https://hub.example/apps/crm/releases',
  ])('rejects %s', (input) => {
    expect(() => parseRemoteUrl(input)).toThrow(
      expect.objectContaining({ code: 'INVALID_REMOTE_URL', exitCode: 2 }),
    );
  });
});

describe('the remotes file', () => {
  it('reads as empty when absent, and round-trips with the default first', async () => {
    expect(await readRemotes(root)).toEqual({ remotes: {} });
    await writeRemotes(root, {
      remotes: { origin: 'https://hub.example/apps/crm' },
      default: 'origin',
    });
    const text = await readFile(path.join(root, REMOTES_FILE), 'utf8');
    expect(Object.keys(JSON.parse(text) as object)).toEqual([
      'default',
      'remotes',
    ]);
    expect(await readRemotes(root)).toEqual({
      default: 'origin',
      remotes: { origin: 'https://hub.example/apps/crm' },
    });
  });

  it.each([
    'not json',
    '[]',
    '{"remotes": []}',
    '{"remotes": {"origin": 1}}',
    '{"remotes": {"bad name": "https://hub.example/apps/crm"}}',
    '{"default": 1, "remotes": {}}',
  ])('rejects %s', async (content) => {
    await mkdir(path.join(root, '.nocobase'));
    await writeFile(path.join(root, REMOTES_FILE), content);
    await expect(readRemotes(root)).rejects.toMatchObject({
      code: 'INVALID_REMOTES_FILE',
    });
  });

  it('resolves the named remote, then the default, and says what is missing', async () => {
    await expect(resolveRemote(root, undefined)).rejects.toMatchObject({
      code: 'NO_REMOTE',
      message: expect.stringContaining('No remote is configured'),
    });
    await writeRemotes(root, {
      remotes: {
        origin: 'https://hub.example/apps/crm',
        us: 'https://hub-us.example/apps/xyz',
      },
    });
    await expect(resolveRemote(root, undefined)).rejects.toMatchObject({
      code: 'NO_REMOTE',
      message: expect.stringContaining('No default remote'),
    });
    await expect(resolveRemote(root, 'eu')).rejects.toMatchObject({
      code: 'NO_REMOTE',
    });
    // A name that is a property of every object is still not a remote.
    await expect(resolveRemote(root, 'constructor')).rejects.toMatchObject({
      code: 'NO_REMOTE',
    });
    expect(await resolveRemote(root, 'us')).toEqual({
      name: 'us',
      url: 'https://hub-us.example/apps/xyz',
      hub: 'https://hub-us.example',
      appId: 'xyz',
    });
    await writeRemotes(root, {
      default: 'origin',
      remotes: { origin: 'https://hub.example/apps/crm' },
    });
    expect((await resolveRemote(root, undefined)).name).toBe('origin');
  });

  it('tells when .gitignore keeps the remotes file out of version control', async () => {
    expect(await remotesIgnoredByGit(root)).toBe(false);
    await writeFile(path.join(root, '.gitignore'), 'node_modules/\n/.env\n');
    expect(await remotesIgnoredByGit(root)).toBe(false);
    for (const line of ['/.nocobase/', '.nocobase', '/.nocobase/hub.json']) {
      await writeFile(
        path.join(root, '.gitignore'),
        `node_modules/\n${line}\n`,
      );
      expect(await remotesIgnoredByGit(root)).toBe(true);
    }
  });
});
