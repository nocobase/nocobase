/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { afterEach, expect, test } from 'vitest';
import {
  assertPublishCapability,
  defaultPublishDir,
  findManifestEntry,
  readManifest,
  resolveLocalPublishFile,
  upsertManifestEntry,
} from '../lib/publish.js';

let tempDir: string | undefined;

async function makeTempDir() {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-publish-test-'));
  return tempDir;
}

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

test('defaultPublishDir stores files under .nocobase/publish/<type>/<env>', async () => {
  const cwd = await makeTempDir();
  expect(defaultPublishDir('migration', 'dev', cwd)).toBe(path.join(cwd, '.nocobase', 'publish', 'migration', 'dev'));
});

test('manifest upsert records uploaded artifact id by type/source/target/file', async () => {
  const cwd = await makeTempDir();
  await upsertManifestEntry(
    {
      type: 'migration',
      sourceEnv: 'dev',
      targetEnv: 'test',
      fileName: 'migration_1.nbdata',
      localPath: 'migration_1.nbdata',
      uploadedArtifactId: 'artifact_1',
    },
    cwd,
  );
  await upsertManifestEntry(
    {
      type: 'migration',
      sourceEnv: 'dev',
      targetEnv: 'test',
      fileName: 'migration_1.nbdata',
      localPath: 'migration_1.nbdata',
      uploadedArtifactId: 'artifact_2',
    },
    cwd,
  );

  const manifest = await readManifest(cwd);
  expect(manifest.artifacts).toHaveLength(1);
  expect(manifest.artifacts[0].uploadedArtifactId).toBe('artifact_2');
  await expect(findManifestEntry({
    type: 'migration',
    sourceEnv: 'dev',
    targetEnv: 'test',
    fileName: 'migration_1.nbdata',
    cwd,
  })).resolves.toMatchObject({
    uploadedArtifactId: 'artifact_2',
  });
});

test('resolveLocalPublishFile requires --from for cached file names', async () => {
  const cwd = await makeTempDir();
  expect(() => resolveLocalPublishFile({
    type: 'backup',
    file: 'backup_1.nbdata',
    cwd,
  })).toThrow(/Missing --from/);
  expect(resolveLocalPublishFile({
    type: 'backup',
    file: 'backup_1.nbdata',
    sourceEnv: 'dev',
    cwd,
  })).toBe(path.join(cwd, '.nocobase', 'publish', 'backup', 'dev', 'backup_1.nbdata'));
});

test('assertPublishCapability rejects unsupported type actions', () => {
  const capabilities = {
    types: {
      backup: {
        generate: true,
      },
      database: {
        generate: false,
      },
    },
  };

  expect(() => assertPublishCapability(capabilities, 'backup', 'generate')).not.toThrow();
  expect(() => assertPublishCapability(capabilities, 'database', 'generate')).toThrow(/not supported/);
  expect(() => assertPublishCapability(capabilities, 'migration', 'execute')).toThrow(/not supported/);
});
