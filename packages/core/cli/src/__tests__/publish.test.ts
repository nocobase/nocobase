/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
  getPublishResponseData,
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

test('defaultPublishDir stores files under the global CLI home publish workspace', async () => {
  const root = await makeTempDir();
  const cliHomeDir = path.join(root, '.nocobase');
  expect(defaultPublishDir('migration', 'dev', cliHomeDir)).toBe(path.join(cliHomeDir, 'publish', 'migration', 'dev'));
});

test('manifest upsert records uploaded artifact id by type/source/target/file', async () => {
  const root = await makeTempDir();
  const cliHomeDir = path.join(root, '.nocobase');
  await upsertManifestEntry(
    {
      type: 'migration',
      sourceEnv: 'dev',
      targetEnv: 'test',
      fileName: 'migration_1.nbdata',
      localPath: 'migration_1.nbdata',
      uploadedArtifactId: 'artifact_1',
    },
    cliHomeDir,
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
    cliHomeDir,
  );

  const manifest = await readManifest(cliHomeDir);
  expect(manifest.artifacts).toHaveLength(1);
  expect(manifest.artifacts[0].uploadedArtifactId).toBe('artifact_2');
  await expect(findManifestEntry({
    type: 'migration',
    sourceEnv: 'dev',
    targetEnv: 'test',
    fileName: 'migration_1.nbdata',
    cliHomeDir,
  })).resolves.toMatchObject({
    uploadedArtifactId: 'artifact_2',
  });
});

test('resolveLocalPublishFile requires --from for cached file names', async () => {
  const root = await makeTempDir();
  const cliHomeDir = path.join(root, '.nocobase');
  expect(() => resolveLocalPublishFile({
    type: 'backup',
    file: 'backup_1.nbdata',
    cliHomeDir,
  })).toThrow(/Missing --from/);
  expect(resolveLocalPublishFile({
    type: 'backup',
    file: 'backup_1.nbdata',
    sourceEnv: 'dev',
    cliHomeDir,
  })).toBe(path.join(cliHomeDir, 'publish', 'backup', 'dev', 'backup_1.nbdata'));
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

test('getPublishResponseData unwraps NocoBase resource envelopes', () => {
  expect(getPublishResponseData({
    ok: true,
    status: 200,
    data: {
      data: {
        status: 'ok',
        data: {
          types: {
            backup: {
              generate: true,
            },
          },
        },
      },
    },
  })).toMatchObject({
    types: {
      backup: {
        generate: true,
      },
    },
  });
});
