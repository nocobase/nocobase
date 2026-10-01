/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createAppHost, readHostRuntime, type AppHost } from '../dist/index.js';

const hosts: AppHost[] = [];
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(hosts.splice(0).map((host) => host.close('test cleanup')));
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

function expectedLibc(): 'glibc' | 'musl' | null {
  if (process.platform !== 'linux') return null;
  const report = process.report.getReport() as {
    header?: { glibcVersionRuntime?: string };
  };
  return report.header?.glibcVersionRuntime ? 'glibc' : 'musl';
}

const expectedRuntime = {
  platform: process.platform,
  arch: process.arch,
  libc: expectedLibc(),
  nodeAbi: Number(process.versions.modules),
  nodeMajor: Number(process.versions.node.split('.')[0]),
};

async function createHost(mode: 'managed' | 'standalone'): Promise<AppHost> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'app-host-runtime-'));
  tempDirs.push(root);
  const host = createAppHost({
    mode,
    appRevisionsDir: path.join(root, 'revisions'),
    appVolumesDir: path.join(root, 'volumes'),
    artifact: {
      driver: 'fs',
      location: path.join(root, 'artifacts'),
      visibility: 'private',
    },
    evictionIntervalMs: 0,
  });
  hosts.push(host);
  return host;
}

describe('host runtime', () => {
  it('describes the current process in the build-target shape', () => {
    expect(readHostRuntime()).toEqual(expectedRuntime);
  });

  it('returns a copy so a caller cannot change what later statuses report', () => {
    const runtime = readHostRuntime();
    runtime.platform = 'changed';
    expect(readHostRuntime().platform).toBe(process.platform);
  });

  it.each(['managed', 'standalone'] as const)(
    'is reported in %s host status',
    async (mode) => {
      const host = await createHost(mode);
      expect((await host.management.getStatus()).runtime).toEqual(
        expectedRuntime,
      );
    },
  );
});
