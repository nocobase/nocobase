/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { resolvePortalWorkspaceDirectory } from '../lib/portal-workspace.js';

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-portal-workspace-'));
  tempDirs.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

test('create and first pull use a portal-named directory under the current directory', async () => {
  const cwd = await makeTempDir();

  await expect(resolvePortalWorkspaceDirectory({ portal: 'ai', cwd, mode: 'create' })).resolves.toBe(
    path.join(cwd, 'ai'),
  );
  await expect(resolvePortalWorkspaceDirectory({ portal: 'ai', cwd, mode: 'pull' })).resolves.toBe(
    path.join(cwd, 'ai'),
  );
});

test('pull and existing commands use the current Portal workspace', async () => {
  const cwd = await makeTempDir();
  await writeFile(path.join(cwd, 'portal.config.json'), '{"portal":"ai","sourceStorage":"nocobase"}\n');

  await expect(resolvePortalWorkspaceDirectory({ portal: 'ai', cwd, mode: 'pull' })).resolves.toBe(cwd);
  await expect(resolvePortalWorkspaceDirectory({ portal: 'ai', cwd, mode: 'existing' })).resolves.toBe(cwd);
});

test('an explicit directory overrides the current directory', async () => {
  const cwd = await makeTempDir();

  await expect(
    resolvePortalWorkspaceDirectory({ portal: 'ai', cwd, directory: './custom-ai', mode: 'existing' }),
  ).resolves.toBe(path.join(cwd, 'custom-ai'));
});
