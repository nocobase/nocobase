// @vitest-environment node
/** The runner and CLI tarballs the application serves: who may download, checksums, platforms, updates, CLI source. */
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { HEADERS, PROTOCOL_VERSION } from '@nocobase/agent-protocol';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createDistService } from '../../server/distribution/index.js';
import { createHarness, type Harness } from './harness.js';

const root = mkdtempSync(path.join(os.tmpdir(), 'runners-dist-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const sha = (bytes: Buffer | string) =>
  createHash('sha256').update(bytes).digest('hex');

/** A distribution directory as `nocobase cli build` lays it out: a manifest per product. */
function writeDist(
  dir: string,
  products: Record<string, Record<string, readonly string[]>>,
): void {
  for (const [product, versions] of Object.entries(products)) {
    const manifest = {
      schema: 1,
      product,
      bin: product,
      versions: {} as Record<string, unknown>,
    };
    for (const [version, targets] of Object.entries(versions)) {
      const files: Record<string, unknown> = {};
      for (const target of targets) {
        const name = `${product}-v${version}-${target}.tar.gz`;
        const content = `${product} ${version} ${target}`;
        mkdirSync(path.join(dir, 'stable', product, version), {
          recursive: true,
        });
        writeFileSync(
          path.join(dir, 'stable', product, version, name),
          content,
        );
        files[target] = {
          file: `${version}/${name}`,
          sha256: sha(content),
          size: content.length,
        };
      }
      manifest.versions[version] = { targets: files };
    }
    writeFileSync(
      path.join(dir, 'stable', product, 'manifest.json'),
      JSON.stringify(manifest),
    );
  }
}

describe('distribution service', () => {
  it('serves the highest version unless one is pinned, and nothing outside the manifest', async () => {
    const dir = path.join(root, 'service');
    writeDist(dir, {
      acme: {
        '0.1.0': ['darwin-arm64'],
        '0.10.0-alpha.1': ['darwin-arm64', 'linux-x64'],
        '0.2.0': ['darwin-arm64'],
      },
    });
    const dist = createDistService({ dir });
    expect((await dist.manifest()).products['acme']).toEqual({
      version: '0.10.0-alpha.1',
      targets: ['darwin-arm64', 'linux-x64'],
    });
    const pinned = createDistService({
      dir,
      versions: { acme: '0.2.0' },
    });
    expect((await pinned.find('acme', 'darwin-arm64'))?.version).toBe('0.2.0');
    expect(await pinned.find('acme', 'linux-x64')).toBeNull();
    await expect(
      dist.file('acme', '0.1.0', '../manifest.json'),
    ).rejects.toMatchObject({ code: 'DIST_FILE_NOT_FOUND' });
    expect(
      await createDistService({ dir: path.join(root, 'nothing') }).manifest(),
    ).toEqual({ channel: 'stable', products: {} });
  });

  it("reads each product's own manifest, and no manifest of the whole channel", async () => {
    const dir = path.join(root, 'products');
    writeDist(dir, {
      acme: { '0.2.0': ['linux-x64'] },
      'nocobase-runner': { '0.3.0': ['linux-x64'] },
    });
    writeFileSync(
      path.join(dir, 'stable', 'manifest.json'),
      JSON.stringify({
        schema: 1,
        channel: 'stable',
        products: {
          other: {
            versions: {
              '1.0.0': {
                targets: {
                  'linux-x64': {
                    file: 'other/1.0.0/other.tar.gz',
                    sha256: sha('other'),
                    size: 5,
                  },
                },
              },
            },
          },
        },
      }),
    );
    const name = 'nocobase-runner-v0.3.0-linux-x64.tar.gz';
    const dist = createDistService({ dir });
    expect(await dist.manifest()).toEqual({
      channel: 'stable',
      products: {
        acme: { version: '0.2.0', targets: ['linux-x64'] },
        'nocobase-runner': { version: '0.3.0', targets: ['linux-x64'] },
      },
    });
    expect(await dist.find('nocobase-runner', 'linux-x64')).toMatchObject({
      url: `/api/agents/dist/products/nocobase-runner/versions/0.3.0/files/${name}`,
      sha256: sha('nocobase-runner 0.3.0 linux-x64'),
    });
    expect((await dist.file('nocobase-runner', '0.3.0', name)).path).toBe(
      path.join(dir, 'stable', 'nocobase-runner', '0.3.0', name),
    );
  });

  it('serves the universal tarball to a platform without one of its own, and the own one where there is', async () => {
    const dir = path.join(root, 'universal');
    writeDist(dir, {
      acme: { '0.4.0': ['universal', 'darwin-arm64'] },
      'nocobase-runner': { '0.5.0': ['universal'] },
    });
    const dist = createDistService({ dir });
    const universal = await dist.find('acme', 'linux-x64');
    expect(universal).toEqual({
      product: 'acme',
      version: '0.4.0',
      target: 'linux-x64',
      url: '/api/agents/dist/products/acme/versions/0.4.0/files/acme-v0.4.0-universal.tar.gz',
      sha256: sha('acme 0.4.0 universal'),
      size: 'acme 0.4.0 universal'.length,
      channel: 'stable',
      universal: true,
    });
    // A tarball built for the platform wins, and its answer is the one it always was.
    expect(await dist.find('acme', 'darwin-arm64')).toEqual({
      product: 'acme',
      version: '0.4.0',
      target: 'darwin-arm64',
      url: '/api/agents/dist/products/acme/versions/0.4.0/files/acme-v0.4.0-darwin-arm64.tar.gz',
      sha256: sha('acme 0.4.0 darwin-arm64'),
      size: 'acme 0.4.0 darwin-arm64'.length,
      channel: 'stable',
    });
    expect(await dist.resolve('nocobase-runner', 'linux-arm64')).toMatchObject({
      target: 'linux-arm64',
      universal: true,
    });
    // It is not a platform anyone asks for.
    await expect(dist.resolve('acme', 'universal')).rejects.toMatchObject({
      code: 'PLATFORM_UNSUPPORTED',
    });
    expect(
      (await dist.file('acme', '0.4.0', 'acme-v0.4.0-universal.tar.gz')).target,
    ).toBe('universal');
    expect((await dist.manifest()).products['acme']).toEqual({
      version: '0.4.0',
      targets: ['darwin-arm64', 'universal'],
    });
  });
});

describe('distribution routes', () => {
  const dir = path.join(root, 'routes');
  let harness: Harness;

  beforeEach(async () => {
    rmSync(dir, { recursive: true, force: true });
    writeDist(dir, {
      acme: { '0.5.0': ['darwin-arm64', 'linux-x64'] },
    });
    harness = await createHarness({ dist: { dir } });
  });
  afterEach(() => harness.close());

  const get = (url: string, headers: Record<string, string> = {}) =>
    harness.app.request(url, { headers });

  it('lets only a runner, an unused registration token or a person download', async () => {
    const url = '/agents/dist/products/acme/targets/darwin-arm64';
    expect((await get(url)).status).toBe(401);
    expect(
      (await get(url, { [HEADERS.registrationToken]: 'nope' })).status,
    ).toBe(401);
    expect((await get(url, { [HEADERS.runnerKey]: 'nope' })).status).toBe(401);

    const token = await harness.services.runners.createRegistrationToken(
      'owner',
      {},
    );
    expect(
      (await get(url, { [HEADERS.registrationToken]: token.token })).status,
    ).toBe(200);
    expect((await get(url, { 'x-test-user': 'someone' })).status).toBe(200);

    // A used token downloads nothing more; the runner it registered uses its key.
    const runner = await harness.registerRunner();
    expect((await get(url, { [HEADERS.runnerKey]: runner.key })).status).toBe(
      200,
    );
    const spent = await harness.services.runners.createRegistrationToken(
      'owner',
      {},
    );
    await harness.request('POST', '/agents/runners/register', {
      body: {
        registrationToken: spent.token,
        name: 'x',
        hostname: 'x',
        os: 'linux',
        arch: 'x64',
        version: '0.5.0',
        protocolVersion: PROTOCOL_VERSION,
        features: [],
        tools: [],
      },
    });
    const refused = await get(url, {
      [HEADERS.registrationToken]: spent.token,
    });
    expect(refused.status).toBe(401);
    expect(await refused.json()).toMatchObject({
      error: { reason: 'REGISTRATION_TOKEN_INVALID', domain: 'agents' },
    });
  });

  it('mints a download token for a signed-in person, which downloads the CLI for one platform a few times', async () => {
    expect(
      (await harness.request('POST', '/agents/dist/downloadTokens')).status,
    ).toBe(401);
    const minted = await harness.request(
      'POST',
      '/agents/dist/downloadTokens',
      {
        user: 'someone',
      },
    );
    expect(minted.status).toBe(201);
    const { token, expiresAt, maxDownloads } = minted.body.data;
    expect(token).toMatch(/^fgdl_/u);
    expect(maxDownloads).toBe(3);
    expect(Date.parse(expiresAt) - harness.clock.now().getTime()).toBe(
      30 * 60_000,
    );

    const auth = { [HEADERS.downloadToken]: token };
    expect((await get('/agents/dist/manifest', auth)).status).toBe(200);
    expect(
      (await get('/agents/dist/products/acme/targets/linux-x64', auth)).status,
    ).toBe(200);
    // The first platform binds it.
    const other = await get(
      '/agents/dist/products/acme/targets/darwin-arm64',
      auth,
    );
    expect(other.status).toBe(401);
    expect(await other.json()).toMatchObject({
      error: { reason: 'DOWNLOAD_TOKEN_INVALID' },
    });
    expect(
      (
        await get(
          '/agents/dist/products/acme/versions/0.5.0/files/acme-v0.5.0-darwin-arm64.tar.gz',
          auth,
        )
      ).status,
    ).toBe(401);
    const file =
      '/agents/dist/products/acme/versions/0.5.0/files/acme-v0.5.0-linux-x64.tar.gz';
    for (let attempt = 0; attempt < 3; attempt += 1)
      expect((await get(file, auth)).status).toBe(200);
    expect((await get(file, auth)).status).toBe(401);
    expect((await get('/agents/dist/manifest', auth)).status).toBe(401);
    // It registers no runner.
    const register = await harness.request('POST', '/agents/runners/register', {
      body: {
        registrationToken: token,
        name: 'x',
        hostname: 'x',
        os: 'linux',
        arch: 'x64',
        version: '0.5.0',
        protocolVersion: PROTOCOL_VERSION,
        features: [],
        tools: [],
      },
    });
    expect(register.status).toBe(401);
  });

  it('refuses a download token once it has expired, and an unknown one', async () => {
    const { token } = await harness.services.downloadTokens.create('someone');
    const url = '/agents/dist/products/acme/targets/linux-x64';
    expect(
      (await get(url, { [HEADERS.downloadToken]: 'fgdl_nope' })).status,
    ).toBe(401);
    harness.clock.advance(30 * 60_000);
    expect((await get(url, { [HEADERS.downloadToken]: token })).status).toBe(
      401,
    );
  });

  it('resolves a platform as JSON or shell lines, and names the platforms there are', async () => {
    const auth = { 'x-test-user': 'someone' };
    const { data: json } = await (
      await get('/agents/dist/products/acme/targets/linux-x64', auth)
    ).json();
    expect(json).toEqual({
      product: 'acme',
      version: '0.5.0',
      target: 'linux-x64',
      url: '/api/agents/dist/products/acme/versions/0.5.0/files/acme-v0.5.0-linux-x64.tar.gz',
      sha256: sha('acme 0.5.0 linux-x64'),
      size: 'acme 0.5.0 linux-x64'.length,
      channel: 'stable',
    });
    const env = await (
      await get('/agents/dist/products/acme/targets/linux-x64?format=env', auth)
    ).text();
    expect(env).toContain('version=0.5.0\n');
    expect(env).toContain(`sha256=${json.sha256}\n`);

    const unknown = await get(
      '/agents/dist/products/acme/targets/win32-x64',
      auth,
    );
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toMatchObject({
      error: {
        reason: 'PLATFORM_UNSUPPORTED',
        metadata: { targets: ['darwin-arm64', 'linux-x64'] },
      },
    });
    expect(
      (await get('/agents/dist/products/acme/targets/Not A Target', auth))
        .status,
    ).toBe(404);
    expect(
      (await get('/agents/dist/products/nothing/targets/linux-x64', auth))
        .status,
    ).toBe(404);
    expect((await get('/agents/dist/manifest', auth)).status).toBe(200);
  });

  it('answers the universal tarball with universal set, and lets a download token bound to a platform fetch it', async () => {
    writeDist(dir, { acme: { '0.6.0': ['universal'] } });
    const { token } = await harness.services.downloadTokens.create('someone');
    const auth = { [HEADERS.downloadToken]: token };
    const { data: json } = await (
      await get('/agents/dist/products/acme/targets/linux-x64', auth)
    ).json();
    expect(json).toMatchObject({
      version: '0.6.0',
      target: 'linux-x64',
      url: '/api/agents/dist/products/acme/versions/0.6.0/files/acme-v0.6.0-universal.tar.gz',
      universal: true,
    });
    const env = await (
      await get('/agents/dist/products/acme/targets/linux-x64?format=env', auth)
    ).text();
    expect(env).toContain('target=linux-x64\n');
    expect(env).toContain('universal=true\n');
    // Bound to linux-x64 by its first request, it still downloads the one tarball every platform gets, counted.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await get(json.url.replace(/^\/api/u, ''), auth);
      expect(response.status).toBe(200);
      expect(Buffer.from(await response.arrayBuffer()).toString()).toBe(
        'acme 0.6.0 universal',
      );
    }
    expect((await get(json.url.replace(/^\/api/u, ''), auth)).status).toBe(401);
    expect(
      (await get('/agents/dist/products/acme/targets/darwin-arm64', auth))
        .status,
    ).toBe(401);
  });

  it('answers a tarball built for the platform as before, without universal', async () => {
    const auth = { 'x-test-user': 'someone' };
    const env = await (
      await get('/agents/dist/products/acme/targets/linux-x64?format=env', auth)
    ).text();
    expect(env).toBe(
      [
        'product=acme',
        'version=0.5.0',
        'target=linux-x64',
        'url=/api/agents/dist/products/acme/versions/0.5.0/files/acme-v0.5.0-linux-x64.tar.gz',
        `sha256=${sha('acme 0.5.0 linux-x64')}`,
        `size=${'acme 0.5.0 linux-x64'.length}`,
        'channel=stable',
        '',
      ].join('\n'),
    );
  });

  it('serves a listed file with its checksum, and nothing else', async () => {
    const auth = { 'x-test-user': 'someone' };
    const response = await get(
      '/agents/dist/products/acme/versions/0.5.0/files/acme-v0.5.0-darwin-arm64.tar.gz',
      auth,
    );
    expect(response.status).toBe(200);
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(response.headers.get('x-checksum-sha256')).toBe(sha(bytes));
    expect(bytes.toString()).toBe('acme 0.5.0 darwin-arm64');
    expect(
      (
        await get(
          '/agents/dist/products/acme/versions/0.5.0/files/manifest.json',
          auth,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await get(
          '/agents/dist/products/acme/versions/9.9.9/files/acme-v0.5.0-darwin-arm64.tar.gz',
          auth,
        )
      ).status,
    ).toBe(404);
  });

  it('tells an older runner to update, on heartbeats and on the runtimes page', async () => {
    const runner = await harness.registerRunner();
    const heartbeat = await harness.request(
      'POST',
      '/agents/runners/heartbeat',
      {
        runnerKey: runner.key,
        body: {
          version: '0.4.9',
          product: 'acme',
          features: [],
          tools: [{ kind: 'claude', authenticated: true }],
          active: [],
          load: { slots: 1, free: 1 },
        },
      },
    );
    expect(heartbeat.body.data.upgrade).toMatchObject({
      latestVersion: '0.5.0',
      downloadUrl:
        '/api/agents/dist/products/acme/versions/0.5.0/files/acme-v0.5.0-darwin-arm64.tar.gz',
      sha256: sha('acme 0.5.0 darwin-arm64'),
      channel: 'stable',
    });
    const list = await harness.request('GET', '/agents/runners', {
      user: 'owner',
    });
    expect(list.body.data[0].updateVersion).toBe('0.5.0');

    const current = await harness.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: {
        version: '0.5.0',
        product: 'acme',
        features: [],
        tools: [{ kind: 'claude', authenticated: true }],
        active: [],
        load: { slots: 1, free: 1 },
      },
    });
    expect(current.body.data.upgrade).toBeUndefined();

    // A runner that reports no product may be carried by a CLI that no longer carries it: it is offered nothing.
    const unknown = await harness.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: {
        version: '0.4.9',
        features: [],
        tools: [{ kind: 'claude', authenticated: true }],
        active: [],
        load: { slots: 1, free: 1 },
      },
    });
    expect(unknown.body.data.upgrade).toBeUndefined();
  });
});

const npmSources = {
  'nocobase-runner': { package: '@nocobase/agent-runner', version: '1.2.0' },
  acme: { package: '@acme/cli', version: '0.9.0' },
};

describe('npm distribution', () => {
  it('names a product on npm only when the directory has none of it, and only when configured', async () => {
    const dir = path.join(root, 'npm-service');
    writeDist(dir, { acme: { '0.5.0': ['linux-x64'] } });
    const dist = createDistService({ dir, npm: npmSources });
    // The directory wins: acme is served as a tarball, never from npm.
    expect(await dist.npmPackage('acme')).toBeNull();
    expect(await dist.npmPackage('nocobase-runner')).toEqual({
      kind: 'npm',
      product: 'nocobase-runner',
      version: '1.2.0',
      package: '@nocobase/agent-runner',
      channel: 'stable',
    });
    // Nothing about the tarballs changes.
    expect(await dist.find('nocobase-runner', 'linux-x64')).toBeNull();
    expect((await dist.manifest()).products).toEqual({
      acme: { version: '0.5.0', targets: ['linux-x64'] },
    });
    expect(
      await createDistService({ dir }).npmPackage('nocobase-runner'),
    ).toBeNull();
    // A pinned version the directory does not have leaves the product to npm.
    expect(
      await createDistService({
        dir,
        versions: { acme: '9.9.9' },
        npm: npmSources,
      }).npmPackage('acme'),
    ).toMatchObject({ kind: 'npm', package: '@acme/cli', version: '0.9.0' });
    expect(
      await createDistService({
        dir: path.join(root, 'nothing'),
        npm: npmSources,
      }).npmPackage('acme'),
    ).toMatchObject({ kind: 'npm', version: '0.9.0' });
  });

  it('refuses a range or a malformed package when it starts', () => {
    expect(() =>
      createDistService({
        npm: { acme: { package: '@acme/cli', version: '^0.9.0' } },
      }),
    ).toThrow(/agents\.dist\.npm/u);
    expect(() =>
      createDistService({
        npm: { acme: { package: 'Not A Package', version: '0.9.0' } },
      }),
    ).toThrow(/agents\.dist\.npm/u);
  });
});

describe('npm distribution routes', () => {
  const dir = path.join(root, 'npm-routes');
  let harness: Harness;

  beforeEach(async () => {
    rmSync(dir, { recursive: true, force: true });
    writeDist(dir, { acme: { '0.5.0': ['darwin-arm64', 'linux-x64'] } });
    harness = await createHarness({ dist: { dir, npm: npmSources } });
  });
  afterEach(() => harness.close());

  const auth = { 'x-test-user': 'someone' };
  const get = (url: string) => harness.app.request(url, { headers: auth });

  it('answers npm only to a caller that opted in, and the old answer to everyone else', async () => {
    const runnerUrl = '/agents/dist/products/nocobase-runner/targets/linux-x64';
    // Without the opt-in: exactly as before, 404.
    const before = await get(runnerUrl);
    expect(before.status).toBe(404);
    expect((await get(`${runnerUrl}?format=env`)).status).toBe(404);
    expect((await get(`${runnerUrl}?accept=other`)).status).toBe(404);

    const json = await get(`${runnerUrl}?accept=npm`);
    expect(json.status).toBe(200);
    expect((await json.json()).data).toEqual({
      kind: 'npm',
      product: 'nocobase-runner',
      version: '1.2.0',
      package: '@nocobase/agent-runner',
      channel: 'stable',
    });
    const env = await get(`${runnerUrl}?accept=other,npm&format=env`);
    expect(await env.text()).toBe(
      'kind=npm\nproduct=nocobase-runner\nversion=1.2.0\npackage=@nocobase/agent-runner\nchannel=stable\n',
    );
    // Still a platform name.
    expect(
      (
        await get(
          '/agents/dist/products/nocobase-runner/targets/Not%20A%20Target?accept=npm',
        )
      ).status,
    ).toBe(404);

    // A product with a tarball is answered the same either way, with no kind.
    const acmeUrl = '/agents/dist/products/acme/targets/linux-x64';
    const plain = await (await get(acmeUrl)).json();
    const optedIn = await (await get(`${acmeUrl}?accept=npm`)).json();
    expect(optedIn).toEqual(plain);
    expect(plain.data).not.toHaveProperty('kind');
    expect(await (await get(`${acmeUrl}?accept=npm&format=env`)).text()).toBe(
      await (await get(`${acmeUrl}?format=env`)).text(),
    );
    // And a platform it was not built for stays PLATFORM_UNSUPPORTED: the directory has the product.
    const unsupported = await get(
      '/agents/dist/products/acme/targets/win32-x64?accept=npm',
    );
    expect(unsupported.status).toBe(404);
    expect(await unsupported.json()).toMatchObject({
      error: { reason: 'PLATFORM_UNSUPPORTED' },
    });
  });

  const heartbeat = (
    key: string,
    body: { version: string; product?: string; features: string[] },
  ) =>
    harness.request('POST', '/agents/runners/heartbeat', {
      runnerKey: key,
      body: {
        ...body,
        tools: [{ kind: 'claude', authenticated: true }],
        active: [],
        load: { slots: 1, free: 1 },
      },
    });

  it('offers the npm package only to a runner with the npm feature, and the tarball whenever there is one', async () => {
    const runner = await harness.registerRunner();

    // Without the feature: nothing new, as before npm answers existed.
    const old = await heartbeat(runner.key, {
      version: '1.0.0',
      product: 'nocobase-runner',
      features: [],
    });
    expect(old.body.data.upgrade).toBeUndefined();
    expect(old.body.data.npmUpgrade).toBeUndefined();
    const listed = await harness.request('GET', '/agents/runners', {
      user: 'owner',
    });
    expect(listed.body.data[0].updateVersion).toBeNull();

    const capable = await heartbeat(runner.key, {
      version: '1.0.0',
      product: 'nocobase-runner',
      features: ['npm'],
    });
    expect(capable.body.data.upgrade).toBeUndefined();
    expect(capable.body.data.npmUpgrade).toEqual({
      latestVersion: '1.2.0',
      package: '@nocobase/agent-runner',
      channel: 'stable',
      reason: expect.stringContaining('@nocobase/agent-runner@1.2.0'),
    });
    expect(
      (await harness.request('GET', '/agents/runners', { user: 'owner' })).body
        .data[0].updateVersion,
    ).toBe('1.2.0');

    // The pinned version, not a newer one: a runner already on it, or ahead of it, is offered nothing.
    for (const version of ['1.2.0', '1.3.0']) {
      const current = await heartbeat(runner.key, {
        version,
        product: 'nocobase-runner',
        features: ['npm'],
      });
      expect(current.body.data.npmUpgrade).toBeUndefined();
      expect(current.body.data.upgrade).toBeUndefined();
    }

    // A product the directory serves is offered as a tarball, also to a runner with the feature.
    const carried = await heartbeat(runner.key, {
      version: '0.4.0',
      product: 'acme',
      features: ['npm'],
    });
    expect(carried.body.data.npmUpgrade).toBeUndefined();
    expect(carried.body.data.upgrade).toMatchObject({ latestVersion: '0.5.0' });
  });
});
