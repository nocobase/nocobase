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
