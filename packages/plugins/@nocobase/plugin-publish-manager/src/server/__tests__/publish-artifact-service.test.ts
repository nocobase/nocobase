/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { afterEach, expect, it, vi } from 'vitest';
import { PublishArtifactService } from '../services/publish-artifact-service';

let tempDir: string | undefined;
let cwdSpy: ReturnType<typeof vi.spyOn> | undefined;

async function setupTempCwd() {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-publish-artifact-'));
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
  return tempDir;
}

afterEach(async () => {
  cwdSpy?.mockRestore();
  cwdSpy = undefined;
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

it('creates artifact metadata and checksum from a local file', async () => {
  const dir = await setupTempCwd();
  const sourceFile = path.join(dir, 'migration_1.nbdata');
  await fs.writeFile(sourceFile, 'test migration');
  const service = new PublishArtifactService({
    name: 'main',
    logger: {
      warn: vi.fn(),
    },
  } as any);

  const { meta, filePath } = await service.createFromFile({
    type: 'migration',
    filePath: sourceFile,
    state: 'generated',
  });

  expect(meta.artifactId).toMatch(/^artifact_/);
  expect(meta.checksum).toMatch(/^sha256:/);
  expect(filePath).toContain(path.join('storage', 'publish', 'main', 'migration'));
  await expect(service.readMeta('migration', meta.artifactId)).resolves.toMatchObject({
    artifactId: meta.artifactId,
    fileName: 'migration_1.nbdata',
    state: 'generated',
  });
});

it('rejects unsafe file names', async () => {
  const dir = await setupTempCwd();
  const sourceFile = path.join(dir, 'migration_1.nbdata');
  await fs.writeFile(sourceFile, 'test migration');
  const service = new PublishArtifactService({
    name: 'main',
    logger: {
      warn: vi.fn(),
    },
  } as any);

  await expect(
    service.createFromFile({
      type: 'migration',
      filePath: sourceFile,
      fileName: '../migration_1.nbdata',
    }),
  ).rejects.toThrow(/Invalid fileName/);
});

it('verifies checksum when an expected value is provided', async () => {
  await setupTempCwd();
  const service = new PublishArtifactService({
    name: 'main',
    logger: {
      warn: vi.fn(),
    },
  } as any);

  expect(() => service.verifyChecksum(undefined, 'sha256:actual')).not.toThrow();
  expect(() => service.verifyChecksum('sha256:actual', 'sha256:actual')).not.toThrow();
  expect(() => service.verifyChecksum('sha256:expected', 'sha256:actual')).toThrow(/checksum mismatch/);
});

it('only allows executable artifact states for each publish type', async () => {
  await setupTempCwd();
  const service = new PublishArtifactService({
    name: 'main',
    logger: {
      warn: vi.fn(),
    },
  } as any);
  const base = {
    artifactId: 'artifact_00000000-0000-0000-0000-000000000000',
    fileName: 'artifact.nbdata',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as const;

  expect(() =>
    service.assertExecutableArtifact({
      ...base,
      type: 'migration',
      state: 'ready',
    }),
  ).not.toThrow();
  expect(() =>
    service.assertExecutableArtifact({
      ...base,
      type: 'migration',
      state: 'staged',
    }),
  ).toThrow(/not ready/);
  expect(() =>
    service.assertExecutableArtifact({
      ...base,
      type: 'backup',
      state: 'staged',
    }),
  ).not.toThrow();
  expect(() =>
    service.assertExecutableArtifact({
      ...base,
      type: 'backup',
      state: 'executed',
    }),
  ).toThrow(/already been executed/);
});
