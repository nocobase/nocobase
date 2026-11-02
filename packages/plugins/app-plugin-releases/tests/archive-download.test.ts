// @vitest-environment node
/**
 * Downloading a release's archive through the API (`GET /apps/:appId/releases/:releaseId/archive`): the uploaded bytes
 * with their name and checksum, refused to a caller who may not view the App, and not offered for an image release;
 * and `summarizeApps`, several Apps' summaries in one read.
 */
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { archiveFileName } from '../server/services/releases.js';
import {
  createApiServer,
  createArtifact,
  createHarness,
  streamOf,
  type Harness,
} from './harness.js';

describe('release archive download', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({
      id: 'staging',
      name: 'Staging',
      driver: 'fake',
    });
  });
  afterEach(async () => {
    await harness.close();
  });

  async function upload(appId: string, version: string) {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases
      .createApp(admin, { id: appId, name: appId, environmentId: 'staging' })
      .catch(() => null);
    const archive = await createArtifact(harness.rootDir, version);
    const release = await harness.services.releases.uploadRelease(
      admin,
      appId,
      { stream: streamOf(archive.bytes) },
    );
    return { archive, release };
  }

  it('answers the archive with its name, size and checksum', async () => {
    const { archive, release } = await upload('shop', '1.2.0');
    // A viewer of every App: related Apps alone would not include another's.
    harness.application.roles.set('reader', 'admin');
    const server = await createApiServer(harness.services);
    try {
      const response = await fetch(
        `${server.url}/apps/shop/releases/${release.id}/archive`,
        { headers: { 'x-test-user': 'reader' } },
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/gzip');
      expect(response.headers.get('content-disposition')).toBe(
        'attachment; filename="shop-1.2.0.tar.gz"',
      );
      expect(response.headers.get('x-artifact-sha256')).toBe(archive.checksum);
      expect(response.headers.get('content-length')).toBe(
        String(archive.bytes.length),
      );
      const bytes = Buffer.from(await response.arrayBuffer());
      expect(bytes.equals(archive.bytes)).toBe(true);
    } finally {
      await server.close();
    }
  });

  it('refuses a caller who may not view the App, and an unknown release', async () => {
    const { release } = await upload('shop', '1.2.0');
    harness.application.roles.set('stranger', 'nobody');
    // A viewer of every App: related Apps alone would not include another's.
    harness.application.roles.set('reader', 'admin');
    const server = await createApiServer(harness.services);
    try {
      const refused = await fetch(
        `${server.url}/apps/shop/releases/${release.id}/archive`,
        { headers: { 'x-test-user': 'stranger' } },
      );
      expect(refused.status).toBe(403);
      const missing = await fetch(
        `${server.url}/apps/shop/releases/00000000-0000-0000-0000-000000000000/archive`,
        { headers: { 'x-test-user': 'reader' } },
      );
      expect(missing.status).toBe(404);
    } finally {
      await server.close();
    }
  });

  it('answers 404 before any bytes when the archive is gone from the disk', async () => {
    const { release } = await upload('shop', '1.2.0');
    await rm(path.join(harness.rootDir, 'artifacts'), {
      recursive: true,
      force: true,
    });
    harness.application.roles.set('reader', 'admin');
    const server = await createApiServer(harness.services);
    try {
      const response = await fetch(
        `${server.url}/apps/shop/releases/${release.id}/archive`,
        { headers: { 'x-test-user': 'reader' } },
      );
      expect(response.status).toBe(404);
      expect(response.headers.get('content-disposition')).toBeNull();
      const body = (await response.json()) as { error: { reason: string } };
      expect(body.error.reason).toBe('RELEASE_ARCHIVE_NOT_FOUND');
    } finally {
      await server.close();
    }
  });

  it('has no archive for an image release', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'shop',
      name: 'shop',
      environmentId: 'staging',
    });
    const image = await harness.services.releases.registerImageRelease(
      admin,
      'shop',
      {
        version: '1.0.0',
        ref: 'localhost:5000/team/shop:a1b2c3d',
        digest: `sha256:${'a'.repeat(64)}`,
        platform: 'linux/amd64',
      },
    );
    await expect(
      harness.services.releases.openArchive(admin, 'shop', image.id),
    ).rejects.toMatchObject({
      reason: 'RELEASE_HAS_NO_ARCHIVE',
      status: 'FAILED_PRECONDITION',
    });
  });

  it('names archives safely', () => {
    expect(archiveFileName('shop', '1.2.0')).toBe('shop-1.2.0.tar.gz');
    expect(archiveFileName('shop', '../v1 "x"')).toBe('shop-_v1_x_.tar.gz');
  });
});

describe('summarizeApps', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({
      id: 'staging',
      name: 'Staging',
      driver: 'fake',
    });
    const admin = await harness.as('admin', 'admin');
    for (const id of ['a', 'b', 'c'])
      await harness.services.releases.createApp(admin, {
        id,
        name: id.toUpperCase(),
        environmentId: 'staging',
      });
  });
  afterEach(async () => {
    await harness.close();
  });

  it('answers the known Apps in the order asked, skipping the unknown', async () => {
    const summaries = await harness.services.releases.summarizeApps([
      'c',
      'missing',
      'a',
      'c',
    ]);
    expect(summaries.map((summary) => summary.app.id)).toEqual(['c', 'a']);
    expect(summaries[0]).toMatchObject({
      environment: { id: 'staging' },
      runtime: expect.objectContaining({ state: expect.any(String) }),
    });
    expect(await harness.services.releases.summarizeApps([])).toEqual([]);
  });
});
