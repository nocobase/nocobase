// @vitest-environment node
/**
 * Image releases and registries: a registry's write-only pull credentials and its connection check, images CI pushed
 * registered by digest as releases (through the API with a scoped key, idempotently, never changed), carried along
 * when a release is promoted, handed to a driver that runs images with the registry's pull credentials, what each
 * deployment ran, and which releases an environment can run: archives in process, images in Docker.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { DeploymentDriver } from '../server/drivers/types.js';
import { checkRegistry } from '../server/services/registries.js';
import {
  createApiServer,
  createArtifact,
  createFakeDriver,
  createHarness,
  streamOf,
  type Harness,
} from './harness.js';

const DIGEST = `sha256:${'a'.repeat(64)}`;
const ARM = `sha256:${'c'.repeat(64)}`;
const OTHER = `sha256:${'b'.repeat(64)}`;

/** A driver that runs images: it pulls the release's linux/amd64 image, and has nothing to run without one. */
function imageDriver(): ReturnType<typeof createFakeDriver> {
  const fake = createFakeDriver('images');
  const base = fake.driver;
  const driver: DeploymentDriver = {
    ...base,
    capabilities: { ...base.capabilities, images: true },
    async open(environment, context) {
      const session = await base.open(environment, context);
      return {
        ...session,
        apply: (spec, onEvent) => {
          fake.state.applied.push(spec);
          const image = spec.images?.find(
            (item) => item.platform === 'linux/amd64',
          );
          if (!image)
            return Promise.resolve({
              state: 'failed',
              version: null,
              deploymentId: null,
              startedAt: null,
              error: 'no image',
            });
          onEvent?.({
            phase: 'preparing',
            msg: `pull ${image.ref}@${image.digest}`,
            sequence: 100,
            artifact: { kind: 'image', ...image },
          });
          fake.state.running.set(spec.appId, spec);
          return Promise.resolve({
            state: 'running',
            version: spec.release.version,
            deploymentId: spec.deploymentId,
            startedAt: new Date().toISOString(),
            error: null,
          });
        },
      };
    },
  };
  return { driver, state: fake.state };
}

describe('release artifacts and registries', () => {
  let harness: Harness;
  let images: ReturnType<typeof imageDriver>;

  beforeEach(async () => {
    images = imageDriver();
    harness = await createHarness({ drivers: [images.driver] });
  });
  afterEach(async () => {
    await harness.close();
  });

  async function setUp() {
    const admin = await harness.as('admin', 'admin');
    await harness.services.registries.create(admin, {
      id: 'local',
      name: 'Local registry',
      url: 'localhost:5000',
      namespace: 'team',
      pullUsername: 'puller',
      secretChanges: { pullPassword: 'pull-pass' },
    });
    for (const id of ['staging', 'production'])
      await harness.environment({
        id,
        name: id,
        driver: 'images',
        registryId: 'local',
      });
    for (const [id, environmentId] of [
      ['shop', 'staging'],
      ['shop-prod', 'production'],
    ] as const)
      await harness.services.releases.createApp(admin, {
        id,
        name: id,
        environmentId,
      });
    const release = await harness.services.releases.registerImageRelease(
      admin,
      'shop',
      {
        version: '1.0.0',
        ref: 'localhost:5000/team/shop:a1b2c3d',
        digest: DIGEST,
        platform: 'linux/amd64',
        sourceCommit: 'a1b2c3d4e5f6',
        build: 'ci-run-7',
      },
    );
    return { admin, release };
  }

  it('keeps registry passwords write-only', async () => {
    const admin = await harness.as('admin', 'admin');
    const created = await harness.services.registries.create(admin, {
      id: 'ghcr',
      name: 'GHCR',
      url: 'ghcr.io/',
      namespace: 'acme',
      pullUsername: 'bot',
      secretChanges: { pullPassword: 'ghp_secret' },
    });
    expect(created).toMatchObject({
      url: 'https://ghcr.io',
      host: 'ghcr.io',
      namespace: 'acme',
      pullUsername: 'bot',
      secretKeys: ['pullPassword'],
      environmentIds: [],
    });
    expect(JSON.stringify(created)).not.toContain('ghp_secret');
    expect(await harness.services.registries.pullAuth('ghcr')).toMatchObject({
      auth: {
        serveraddress: 'ghcr.io',
        username: 'bot',
        password: 'ghp_secret',
      },
    });
    const updated = await harness.services.registries.update(admin, 'ghcr', {
      secretChanges: { pullPassword: null },
    });
    expect(updated.secretKeys).toEqual([]);
    expect(
      (
        await harness.services.registries.create(admin, {
          id: 'local',
          name: 'Local',
          url: 'localhost:5000',
        })
      ).url,
    ).toBe('http://localhost:5000');
    // Only managers of environments change registries; readers see them.
    const viewer = await harness.as('vera', 'viewer');
    await expect(
      harness.services.registries.create(viewer, {
        id: 'x',
        name: 'x',
        url: 'x.io',
      }),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    expect(await harness.services.registries.list(viewer)).toHaveLength(2);
    // A registry in use stays.
    await harness.environment({
      id: 'staging',
      name: 'Staging',
      driver: 'images',
      registryId: 'ghcr',
    });
    await expect(
      harness.services.registries.remove(admin, 'ghcr'),
    ).rejects.toMatchObject({
      reason: 'REGISTRY_IN_USE',
      message: expect.stringContaining('(Staging)'),
    });
    await expect(
      harness.environment({
        id: 'other',
        name: 'Other',
        driver: 'images',
        registryId: 'missing',
      }),
    ).rejects.toMatchObject({ reason: 'UNKNOWN_REGISTRY' });
  });

  it('checks a registry anonymously, with Basic and with a Bearer token', async () => {
    const calls: string[] = [];
    const answer = (
      status: number,
      headers: Record<string, string> = {},
      body?: unknown,
    ) =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers,
      });
    const anonymous = await checkRegistry(
      { url: 'http://localhost:5000', namespace: null, pull: null },
      (() => Promise.resolve(answer(200))) as typeof fetch,
    );
    expect(anonymous).toMatchObject({ ok: true, details: { anonymous: true } });

    const bearer = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const auth = new Headers(init?.headers).get('authorization') ?? '';
      calls.push(`${url} ${auth.split(' ')[0] ?? ''}`);
      if (url.endsWith('/v2/'))
        return auth === 'Bearer t0k'
          ? answer(200)
          : answer(401, {
              'www-authenticate':
                'Bearer realm="https://ghcr.io/token",service="ghcr.io"',
            });
      if (url.startsWith('https://ghcr.io/token'))
        return auth === `Basic ${Buffer.from('bot:good').toString('base64')}`
          ? answer(
              200,
              { 'content-type': 'application/json' },
              { token: 't0k' },
            )
          : answer(401);
      return answer(404);
    }) as typeof fetch;
    expect(
      await checkRegistry(
        {
          url: 'https://ghcr.io',
          namespace: 'acme',
          pull: { username: 'bot', password: 'good' },
        },
        bearer,
      ),
    ).toMatchObject({ ok: true, details: { anonymous: false, pull: 'ok' } });
    expect(
      await checkRegistry(
        {
          url: 'https://ghcr.io',
          namespace: 'acme',
          pull: { username: 'bot', password: 'bad' },
        },
        bearer,
      ),
    ).toMatchObject({
      ok: false,
      details: { anonymous: false, pull: 'failed' },
    });
    expect(
      calls.some((call) =>
        call.includes('scope=repository%3Aacme%2Fprobe%3Apull'),
      ),
    ).toBe(true);
    expect(
      await checkRegistry(
        { url: 'https://ghcr.io', namespace: null, pull: null },
        bearer,
      ),
    ).toMatchObject({ ok: false, details: { pull: 'notSet' } });
    expect(
      await checkRegistry(
        { url: 'https://down.test', namespace: null, pull: null },
        (() => Promise.reject(new Error('ECONNREFUSED'))) as typeof fetch,
      ),
    ).toMatchObject({
      ok: false,
      message: expect.stringContaining('ECONNREFUSED'),
    });
  });

  it('registers an image release by digest through the API with a scoped key, never changing it', async () => {
    const { release } = await setUp();
    harness.application.roles.set('robot', 'admin');
    const server = await createApiServer(harness.services);
    try {
      const post = (body: unknown, scope = { actions: ['rel.apps/upload'] }) =>
        fetch(`${server.url}/apps/shop/imageReleases`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-test-user': 'robot',
            'x-test-key': JSON.stringify(scope),
          },
          body: JSON.stringify(body),
        });
      const image = {
        version: '1.0.0',
        ref: 'localhost:5000/team/shop:a1b2c3d',
        digest: DIGEST,
        platform: 'linux/amd64',
      };
      // The same digest answers its release.
      const again = await post(image);
      expect(again.status).toBe(200);
      expect(((await again.json()) as { data: unknown }).data).toMatchObject({
        id: release.id,
        kind: 'image',
        reused: true,
      });
      // Another platform's image joins the release of the same version.
      const arm = await post({
        ...image,
        digest: ARM,
        platform: 'linux/arm64',
      });
      expect(arm.status).toBe(200);
      expect(((await arm.json()) as { data: { id: string } }).data.id).toBe(
        release.id,
      );
      // Another digest for a platform the release has is refused.
      const changed = await post({ ...image, digest: OTHER });
      expect(changed.status).toBe(400);
      expect(await changed.json()).toMatchObject({
        error: { reason: 'IMAGE_CONFLICT' },
      });
      expect((await post({ ...image, digest: 'latest' })).status).toBe(400);
      expect(
        (await post({ ...image, version: undefined, digest: OTHER })).status,
      ).toBe(400);
      // A key that may only read cannot register.
      expect((await post(image, { actions: ['rel.apps/view'] })).status).toBe(
        403,
      );
      const next = await post({ ...image, version: '1.1.0', digest: OTHER });
      expect(next.status).toBe(201);
    } finally {
      await server.close();
    }
    const admin = await harness.as('admin', 'admin');
    const listed = await harness.services.releases.listReleases(admin, 'shop');
    expect(listed.find((item) => item.id === release.id)).toMatchObject({
      kind: 'image',
      version: '1.0.0',
      sourceCommit: 'a1b2c3d4e5f6',
      build: 'ci-run-7',
      // Newest first.
      artifacts: [
        { kind: 'oci-image', digest: ARM, platform: 'linux/arm64' },
        {
          kind: 'oci-image',
          ref: 'localhost:5000/team/shop',
          digest: DIGEST,
          platform: 'linux/amd64',
        },
      ],
    });
  });

  it('deploys the same digest to staging and, promoted, to production', async () => {
    const { admin, release } = await setUp();
    expect(
      (await harness.services.releases.getApp(admin, 'shop')).environment,
    ).toMatchObject({ runsImages: true });
    const staging = await harness.services.releases.deploy(admin, 'shop', {
      releaseId: release.id,
    });
    expect(
      await harness.services.releases.waitForDeployment(staging.id),
    ).toMatchObject({
      status: 'succeeded',
      artifact: {
        kind: 'image',
        ref: 'localhost:5000/team/shop',
        digest: DIGEST,
        platform: 'linux/amd64',
      },
    });
    const spec = images.state.applied.at(-1)!;
    expect(spec.artifact).toBeUndefined();
    expect(spec.images).toEqual([
      {
        ref: 'localhost:5000/team/shop',
        digest: DIGEST,
        platform: 'linux/amd64',
      },
    ]);
    expect(spec.registryAuth).toEqual({
      serveraddress: 'localhost:5000',
      username: 'puller',
      password: 'pull-pass',
    });

    const promoted = await harness.services.releases.promoteRelease(
      admin,
      'shop',
      release.id,
      'shop-prod',
    );
    const production = await harness.services.releases.deploy(
      admin,
      'shop-prod',
      { releaseId: promoted.id, confirm: 'shop-prod' },
    );
    expect(
      await harness.services.releases.waitForDeployment(production.id),
    ).toMatchObject({
      status: 'succeeded',
      artifact: { kind: 'image', digest: DIGEST },
    });
    expect(
      (
        await harness.services.releases.getRelease(
          admin,
          'shop-prod',
          promoted.id,
        )
      ).artifacts,
    ).toEqual([expect.objectContaining({ kind: 'oci-image', digest: DIGEST })]);
  });

  it('runs archives in process and images in Docker, and refuses the other', async () => {
    const { admin, release } = await setUp();
    // A Docker environment has nothing to run in an archive.
    const archive = await createArtifact(harness.rootDir, '2.0.0');
    const uploaded = await harness.services.releases.uploadRelease(
      admin,
      'shop',
      { stream: streamOf(archive.bytes) },
    );
    await expect(
      harness.services.releases.deploy(admin, 'shop', {
        releaseId: uploaded.id,
      }),
    ).rejects.toMatchObject({
      reason: 'IMAGE_REQUIRED',
      status: 'FAILED_PRECONDITION',
    });
    // An image outside the environment's registry is not pulled.
    await harness.services.registries.create(admin, {
      id: 'other',
      name: 'Other',
      url: 'registry.example.com',
    });
    await harness.services.environments.update(admin, 'staging', {
      registryId: 'other',
    });
    await expect(
      harness.services.releases.deploy(admin, 'shop', {
        releaseId: release.id,
      }),
    ).rejects.toMatchObject({ reason: 'IMAGE_REQUIRED' });
    // An in-process environment has nothing to run in an image.
    await harness.environment({ id: 'plain', name: 'Plain', driver: 'fake' });
    await harness.services.releases.createApp(admin, {
      id: 'plain-app',
      name: 'Plain',
      environmentId: 'plain',
    });
    const image = await harness.services.releases.registerImageRelease(
      admin,
      'plain-app',
      {
        version: '1.0.0',
        ref: 'localhost:5000/team/plain',
        digest: DIGEST,
      },
    );
    await expect(
      harness.services.releases.deploy(admin, 'plain-app', {
        releaseId: image.id,
      }),
    ).rejects.toMatchObject({
      reason: 'ARCHIVE_REQUIRED',
      status: 'FAILED_PRECONDITION',
    });
  });

  it('records a driver that runs no images as running the archive', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.environment({ id: 'plain', name: 'Plain', driver: 'fake' });
    await harness.services.releases.createApp(admin, {
      id: 'plain-app',
      name: 'Plain',
      environmentId: 'plain',
    });
    const artifact = await createArtifact(harness.rootDir, '2.0.0');
    const release = await harness.services.releases.uploadRelease(
      admin,
      'plain-app',
      { stream: streamOf(artifact.bytes), deploy: {} },
    );
    expect(
      await harness.services.releases.waitForDeployment(release.deploymentId!),
    ).toMatchObject({ status: 'succeeded', artifact: { kind: 'tarball' } });
    expect(harness.fake.applied.at(-1)?.images).toBeUndefined();
  });
});
