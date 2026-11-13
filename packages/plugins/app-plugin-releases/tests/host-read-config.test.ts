// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadAppHostConfig } from '@nocobase/app-host';
import { expect, it } from 'vitest';

import { writeHostConfig } from '../server/drivers/host/driver.js';

it.each([undefined, { idleTimeoutMs: 125, timeoutMs: 750 }])(
  'passes artifact read settings through the generated child config: %s',
  async (artifactRead) => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'host-read-config-'));
    try {
      const configPath = path.join(rootDir, 'host.yml');
      await writeHostConfig(configPath, {
        artifact: { driver: 'fs', location: path.join(rootDir, 'artifacts') },
        appVolumesDir: path.join(rootDir, 'volumes'),
        artifactRead,
      });
      const config = await loadAppHostConfig({
        rootDir,
        configPath,
        environment: {},
      });
      expect(config.artifactRead).toEqual(
        artifactRead ?? { idleTimeoutMs: 60_000, timeoutMs: 600_000 },
      );
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  },
);
