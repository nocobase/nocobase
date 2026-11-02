// @vitest-environment node
import { Readable } from 'node:stream';
import type { AppDriveConfig } from '@nocobase/drive';
import { expect, it, vi } from 'vitest';
import { createArtifact, createHarness, streamOf } from './harness.js';

const storage = vi.hoisted(() => ({
  objects: new Map<string, Buffer>(),
  configs: [] as AppDriveConfig[],
}));
// Replace only the storage boundary; uploads, promotions, recorded keys and deployment reads run production services.
vi.mock('@nocobase/drive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/drive')>()),
  createDriveManager: (config: AppDriveConfig) => {
    storage.configs.push(config);
    return {
      use: () => ({
        async putStream(key: string, source: AsyncIterable<Uint8Array>) {
          const chunks: Uint8Array[] = [];
          for await (const chunk of source) chunks.push(chunk);
          storage.objects.set(key, Buffer.concat(chunks));
        },
        copy: (from: string, to: string) => {
          storage.objects.set(to, storage.objects.get(from)!);
          return Promise.resolve();
        },
        getStream: (key: string) =>
          Promise.resolve(Readable.from([storage.objects.get(key)!])),
        delete: (key: string) => {
          storage.objects.delete(key);
          return Promise.resolve();
        },
      }),
    };
  },
}));

it('uses prefixed S3 object keys for uploads and promotion, and recorded keys for reads and deletion', async () => {
  const disk = {
    driver: 's3',
    bucket: 'artifacts',
    region: 'auto',
    credentials: {},
    visibility: 'private',
    forcePathStyle: true,
    supportsACL: false,
  } as const;
  const harness = await createHarness({
    artifact: { disk: 'oss', prefix: 'releases/' },
    drive: { default: 'oss', disks: { oss: disk } },
  });
  try {
    const admin = await harness.as('admin', 'admin');
    await harness.environment({
      id: 'staging',
      name: 'Staging',
      driver: 'fake',
    });
    for (const id of ['source', 'target'])
      await harness.services.releases.createApp(admin, {
        id,
        name: id,
        environmentId: 'staging',
      });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const source = await harness.services.releases.uploadRelease(
      admin,
      'source',
      { stream: streamOf(artifact.bytes) },
    );
    const target = await harness.services.releases.promoteRelease(
      admin,
      'source',
      source.id,
      'target',
    );
    expect(storage.configs.at(-1)?.disks.artifact).toEqual(disk);
    expect([...storage.objects.keys()].sort()).toEqual([
      `releases/source/${source.id}.tar.gz`,
      `releases/target/${target.id}.tar.gz`,
    ]);
    const deployment = await harness.services.releases.deploy(admin, 'target', {
      releaseId: target.id,
    });
    expect(
      await harness.services.releases.waitForDeployment(deployment.id),
    ).toMatchObject({ status: 'succeeded' });
    await harness.services.releases.deleteApp(admin, 'source', {
      confirm: 'source',
    });
    await harness.services.releases.deleteApp(admin, 'target', {
      confirm: 'target',
    });
    expect(storage.objects.size).toBe(0);
  } finally {
    await harness.close();
  }
});
