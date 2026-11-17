import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { c as createTar } from 'tar';
import type { NocoBaseDriveDisk } from '@nocobase/drive';
import { expect, it, vi } from 'vitest';
import { DriveArtifactResolver, DeploymentCatalog } from '../dist/index.js';

it.each([undefined, { timeoutMs: 600_000 }])(
  'applies the configured deadline to real hash and extract workers: %s',
  async (artifactWorker) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'worker-config-'));
    const timer = vi.spyOn(globalThis, 'setTimeout');
    try {
      const source = path.join(root, 'source');
      await mkdir(path.join(source, 'dist/server'), { recursive: true });
      await writeFile(
        path.join(source, 'package.json'),
        JSON.stringify({
          name: 'customer',
          version: '1.0.0',
          type: 'module',
        }),
      );
      await writeFile(
        path.join(source, 'dist/server/embedded.js'),
        'export const createServer = () => ({});',
      );
      await createTar(
        { cwd: source, file: path.join(root, 'app.tar.gz'), gzip: true },
        ['package.json', 'dist'],
      );
      const checksum = createHash('sha256')
        .update(await readFile(path.join(root, 'app.tar.gz')))
        .digest('hex');
      const resolver = new DriveArtifactResolver(
        {} as NocoBaseDriveDisk,
        new DeploymentCatalog({
          deploymentsDir: path.join(root, 'revisions'),
          volumesDir: path.join(root, 'volumes'),
        }),
        { localArtifactDir: root, artifactWorker },
      );
      const artifact = await resolver.resolve({
        key: 'app.tar.gz',
        appId: 'customer',
        version: '1.0.0',
        checksum,
      });
      expect(artifact.cacheHit).toBe(false);
      expect(
        timer.mock.calls.filter(
          ([, delay]) => delay === (artifactWorker?.timeoutMs ?? 120_000),
        ),
      ).toHaveLength(2);
      expect(
        await readFile(
          path.join(
            root,
            'revisions/customer',
            checksum,
            'dist/server/embedded.js',
          ),
          'utf8',
        ),
      ).toContain('createServer');
      await artifact.rollback();
    } finally {
      timer.mockRestore();
      await rm(root, { recursive: true, force: true });
    }
  },
);

it.each([0, -1, 1.5, 2_147_483_648])(
  'rejects invalid resolver deadlines before doing work: %s',
  (timeoutMs) => {
    expect(
      () =>
        new DriveArtifactResolver(
          {} as NocoBaseDriveDisk,
          new DeploymentCatalog(),
          { artifactWorker: { timeoutMs } },
        ),
    ).toThrow('host.artifactWorker.timeoutMs');
  },
);
