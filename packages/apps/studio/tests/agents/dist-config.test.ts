// @vitest-environment node

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import agents from '../../server/config/agents.js';

const paths = {
  storage: (relative = '') => path.join('/app/storage', relative),
} as unknown as Parameters<typeof agents>[0]['paths'];

const configWith = (env: Record<string, string | undefined>) =>
  agents({ paths, env } as unknown as Parameters<typeof agents>[0]);

describe('agents.dist.dir', () => {
  const directories: string[] = [];
  afterEach(() => {
    for (const directory of directories.splice(0))
      rmSync(directory, { recursive: true, force: true });
  });

  it('serves the tarballs the image baked in', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'studio-runners-'));
    directories.push(directory);
    mkdirSync(path.join(directory, 'stable'));
    expect(configWith({ NB_STUDIO_RUNNERS_DIST: directory }).dist).toEqual({
      dir: directory,
    });
  });

  it('keeps the plugin default without the variable or a baked channel', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'studio-runners-'));
    directories.push(directory);
    expect(configWith({}).dist).toBeUndefined();
    expect(
      configWith({ NB_STUDIO_RUNNERS_DIST: directory }).dist,
    ).toBeUndefined();
  });
});
