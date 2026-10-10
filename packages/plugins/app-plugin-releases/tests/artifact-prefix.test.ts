// @vitest-environment node
import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { createReleases } from '../server/composition.js';
import { createArtifact, createHarness, streamOf } from './harness.js';

// The fake deployment driver reads the stored archive and verifies its checksum on every deployment.
describe('artifact key prefixes', () => {
  it('reads old keys after changing prefix, prefixes new uploads and promotions, rolls back and deletes recorded keys', async () => {
    const harness = await createHarness();
    let current = harness.services;
    try {
      const admin = await harness.as('admin', 'admin');
      await harness.environment({
        id: 'staging',
        name: 'Staging',
        driver: 'fake',
      });
      for (const id of ['shop', 'target'])
        await current.releases.createApp(admin, {
          id,
          name: id,
          environmentId: 'staging',
        });
      const one = await createArtifact(harness.rootDir, '1.0.0');
      const old = await current.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(one.bytes),
      });
      const diskRoot = path.join(harness.rootDir, 'artifacts');
      const oldKey = `shop/${old.id}.tar.gz`;
      expect(await readFile(path.join(diskRoot, oldKey))).toEqual(one.bytes);
      await current.releases.shutdown();
      current = createReleases({
        database: harness.database,
        config: {
          artifact: { disk: 'archives', prefix: 'releases/' },
          dataDir: path.join(harness.rootDir, 'data'),
        },
        drive: {
          default: 'archives',
          disks: {
            archives: {
              driver: 'fs',
              location: diskRoot,
              visibility: 'private',
            },
          },
        },
        drivers: harness.services.drivers,
        access: () => harness.application,
      });
      const first = await current.releases.deploy(admin, 'shop', {
        releaseId: old.id,
      });
      expect(await current.releases.waitForDeployment(first.id)).toMatchObject({
        status: 'succeeded',
      });
      expect(harness.fake.running.get('shop')?.artifact?.key).toBe(oldKey);
      const promoted = await current.releases.promoteRelease(
        admin,
        'shop',
        old.id,
        'target',
      );
      const promotedKey = `releases/target/${promoted.id}.tar.gz`;
      expect(await readFile(path.join(diskRoot, promotedKey))).toEqual(
        one.bytes,
      );
      const two = await createArtifact(harness.rootDir, '2.0.0');
      const uploaded = await current.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(two.bytes),
      });
      const newKey = `releases/shop/${uploaded.id}.tar.gz`;
      expect(await readFile(path.join(diskRoot, newKey))).toEqual(two.bytes);
      const second = await current.releases.deploy(admin, 'shop', {
        releaseId: uploaded.id,
      });
      expect(await current.releases.waitForDeployment(second.id)).toMatchObject(
        { status: 'succeeded' },
      );
      const rollback = await current.releases.rollback(admin, 'shop', {
        deploymentId: first.id,
      });
      expect(
        await current.releases.waitForDeployment(rollback.id),
      ).toMatchObject({ status: 'succeeded' });
      expect(harness.fake.running.get('shop')?.artifact?.key).toBe(oldKey);
      const target = await current.releases.deploy(admin, 'target', {
        releaseId: promoted.id,
      });
      expect(await current.releases.waitForDeployment(target.id)).toMatchObject(
        { status: 'succeeded' },
      );
      expect(harness.fake.running.get('target')?.artifact?.key).toBe(
        promotedKey,
      );
      await current.releases.deleteApp(admin, 'shop', { confirm: 'shop' });
      await current.releases.deleteApp(admin, 'target', { confirm: 'target' });
      for (const key of [oldKey, newKey, promotedKey])
        await expect(access(path.join(diskRoot, key))).rejects.toMatchObject({
          code: 'ENOENT',
        });
    } finally {
      await current.releases.shutdown();
      await harness.close();
    }
  });
});
