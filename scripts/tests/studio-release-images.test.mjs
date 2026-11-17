import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  Registry,
  prepareImages,
  publishImages,
} from '../studio-release-images.mjs';

const commit = 'a'.repeat(40);
const version = '1.0.0-beta.70';
const digest = (body) =>
  `sha256:${createHash('sha256').update(body).digest('hex')}`;
function fixture() {
  const tags = new Map();
  const writes = [];
  const platforms = ['studio', 'studio-ee'].flatMap((edition) =>
    ['amd64', 'arm64'].map((architecture) => ({
      edition,
      architecture,
      version,
      commit,
      digest: digest(`${edition}/${architecture}`),
    })),
  );
  const registry = {
    digest: async (repo, tag) => tags.get(`${repo}:${tag}`) || null,
    tags: async (repo) =>
      [...tags.keys()]
        .filter((key) => key.startsWith(`${repo}:`))
        .map((key) => key.slice(repo.length + 1)),
    manifest: async (repo, hash) => ({
      mediaType: 'application/vnd.oci.image.manifest.v1+json',
      digest: hash,
      size: 123,
    }),
    put: async (repo, tag, body) => {
      writes.push([repo, tag]);
      tags.set(`${repo}:${tag}`, digest(body));
    },
  };
  return {
    tags,
    writes,
    platforms,
    registry,
    prepare: () =>
      prepareImages(registry, { version, commit, channel: 'beta' }),
  };
}

test('prepares ordinary and EE independently, leaving stable latest untouched', async () => {
  const f = fixture();
  f.tags.set('nocobase/studio:latest', digest('stable'));
  f.tags.set('nocobase/studio:1.0.0', digest('stable'));
  f.tags.set('nocobase/studio-ee:latest', digest('beta'));
  f.tags.set('nocobase/studio-ee:1.0.0-beta.69', digest('beta'));
  const plan = await f.prepare();
  assert.deepEqual(
    plan.images.map((image) => image.tags),
    [
      [version, 'beta'],
      [version, 'beta', 'latest'],
    ],
  );
  assert.equal(plan.images[1].aliases.latest, digest('beta'));
  assert.equal(f.writes.length, 0);
});

test('unknown latest stays unchanged; latest channel explicitly takes it in both editions', async () => {
  const f = fixture();
  f.tags.set('nocobase/studio:latest', digest('unknown'));
  assert.deepEqual((await f.prepare()).images[0].tags, [version, 'beta']);
  const plan = await prepareImages(f.registry, {
    version,
    commit,
    channel: 'latest',
  });
  assert.deepEqual(
    plan.images.map((image) => image.tags),
    [
      [version, 'latest'],
      [version, 'latest'],
    ],
  );
});

test('an existing version in either repository blocks a new release', async () => {
  const f = fixture();
  f.tags.set(`nocobase/studio-ee:${version}`, digest('old'));
  await assert.rejects(f.prepare(), /already exists/);
});

test('credential-free dry runs make no claims about latest and perform no writes', async () => {
  const plan = await prepareImages(null, { version, commit, channel: 'beta' });
  assert.deepEqual(
    plan.images.map((image) => image.tags),
    [
      [version, 'beta'],
      [version, 'beta'],
    ],
  );
  assert.match(plan.images[0].latestReason, /not checked/);
});

test('publishes two separate multi-architecture indexes, then aliases; an identical retry does nothing', async () => {
  const f = fixture();
  const plan = await f.prepare();
  const bodies = [];
  const put = f.registry.put;
  f.registry.put = async (...args) => {
    bodies.push(JSON.parse(args[2]));
    await put(...args);
  };
  const result = await publishImages(f.registry, plan, f.platforms);
  assert.deepEqual(f.writes.slice(0, 2), [
    ['nocobase/studio', version],
    ['nocobase/studio-ee', version],
  ]);
  assert.equal(result.length, 2);
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(
      bodies[i].manifests.map((item) => item.platform),
      [
        { os: 'linux', architecture: 'amd64' },
        { os: 'linux', architecture: 'arm64' },
      ],
    );
    assert.deepEqual(
      bodies[i].manifests.map((item) => item.digest),
      f.platforms.slice(i * 2, i * 2 + 2).map((item) => item.digest),
    );
    assert.equal(
      bodies[i].annotations['org.opencontainers.image.revision'],
      commit,
    );
  }
  const count = f.writes.length;
  assert.deepEqual(await publishImages(f.registry, plan, f.platforms), result);
  assert.equal(f.writes.length, count);
});

test('resumes a partial publication without rewriting the successful edition', async () => {
  const f = fixture();
  const plan = await f.prepare();
  const put = f.registry.put;
  f.registry.put = async (...args) => {
    if (args[0] === 'nocobase/studio-ee')
      throw new Error('network interrupted');
    await put(...args);
  };
  await assert.rejects(
    publishImages(f.registry, plan, f.platforms),
    /network interrupted/,
  );
  assert.deepEqual(f.writes, [['nocobase/studio', version]]);
  f.registry.put = put;
  await publishImages(f.registry, plan, f.platforms);
  assert.equal(
    f.writes.filter(
      ([repo, tag]) => repo === 'nocobase/studio' && tag === version,
    ).length,
    1,
  );
  assert.equal(
    f.tags.get(`nocobase/studio-ee:${version}`),
    f.tags.get('nocobase/studio-ee:beta'),
  );
});

test('recovers an acknowledged write whose response was lost', async () => {
  const f = fixture();
  const plan = await f.prepare();
  const put = f.registry.put;
  f.registry.put = async (...args) => {
    await put(...args);
    throw new Error('response lost');
  };
  await assert.rejects(
    publishImages(f.registry, plan, f.platforms),
    /response lost/,
  );
  f.registry.put = put;
  await publishImages(f.registry, plan, f.platforms);
  assert.equal(
    f.writes.filter(
      ([repo, tag]) => repo === 'nocobase/studio' && tag === version,
    ).length,
    1,
  );
});

test('conflicting EE version or a newer moving alias causes zero writes', async () => {
  for (const tag of [version, 'beta']) {
    const f = fixture();
    const plan = await f.prepare();
    f.tags.set(`nocobase/studio-ee:${tag}`, digest('someone else'));
    await assert.rejects(
      publishImages(f.registry, plan, f.platforms),
      /Refusing/,
    );
    assert.deepEqual(f.writes, []);
  }
});

test('missing, duplicate, wrong-source and wrong-edition platform records cannot publish', async () => {
  for (const mutate of [
    (p) => p.slice(1),
    (p) => [p[0], p[0], ...p.slice(2)],
    (p) => p.map((item) => ({ ...item, commit: 'b'.repeat(40) })),
    (p) => p.map((item) => ({ ...item, edition: 'studio' })),
  ]) {
    const f = fixture();
    await assert.rejects(
      publishImages(f.registry, await f.prepare(), mutate(f.platforms)),
    );
    assert.deepEqual(f.writes, []);
  }
});

test('registry distinguishes a missing tag from an unavailable server and validates digests', async () => {
  let status = 404;
  let tokenRequests = 0;
  const client = new Registry(
    'registry.test',
    'secret',
    'pull',
    async (url, options) => {
      if (url.pathname === '/-/docker/token') {
        tokenRequests++;
        assert.equal(
          url.searchParams.get('scope'),
          'repository:nocobase/studio:pull',
        );
        return Response.json({ token: 'read-token' });
      }
      assert.equal(options.headers.Authorization, 'Bearer read-token');
      return new Response(null, { status });
    },
  );
  assert.equal(await client.digest('nocobase/studio', version), null);
  status = 503;
  await assert.rejects(client.digest('nocobase/studio', version), /HTTP 503/);
  status = 200;
  await assert.rejects(
    client.digest('nocobase/studio', version),
    /Missing digest/,
  );
  assert.equal(tokenRequests, 1);
});

test('registry validates platform content and refuses indexes as platform manifests', async () => {
  let body = JSON.stringify({
    mediaType: 'application/vnd.oci.image.manifest.v1+json',
  });
  const client = new Registry('registry.test', 'secret', 'pull', async (url) =>
    url.pathname === '/-/docker/token'
      ? Response.json({ token: 'token' })
      : new Response(body),
  );
  const record = await client.manifest('nocobase/studio', digest(body));
  assert.equal(record.size, Buffer.byteLength(body));
  await assert.rejects(
    client.manifest('nocobase/studio', digest('other')),
    /digest mismatch/,
  );
  body = JSON.stringify({
    mediaType: 'application/vnd.oci.image.index.v1+json',
  });
  await assert.rejects(
    client.manifest('nocobase/studio', digest(body)),
    /not an index/,
  );
});

test('registry pagination never forwards credentials to another origin', async () => {
  const client = new Registry('registry.test', 'secret', 'pull', async (url) =>
    url.pathname === '/-/docker/token'
      ? Response.json({ token: 'token' })
      : Response.json(
          { tags: [] },
          {
            headers: {
              link: '<https://other.test/v2/nocobase/studio/tags/list>; rel="next"',
            },
          },
        ),
  );
  await assert.rejects(client.tags('nocobase/studio'), /escaped/);
});

test('resumes interrupted alias updates without republishing version tags', async () => {
  const f = fixture();
  const plan = await f.prepare();
  const put = f.registry.put;
  f.registry.put = async (...args) => {
    if (args[1] === 'latest') throw new Error('alias interrupted');
    await put(...args);
  };
  await assert.rejects(
    publishImages(f.registry, plan, f.platforms),
    /alias interrupted/,
  );
  assert.equal(f.writes.filter(([, tag]) => tag === version).length, 2);
  f.registry.put = put;
  await publishImages(f.registry, plan, f.platforms);
  assert.equal(f.writes.filter(([, tag]) => tag === version).length, 2);
  assert.equal(
    f.tags.get('nocobase/studio:latest'),
    f.tags.get(`nocobase/studio:${version}`),
  );
  assert.equal(
    f.tags.get('nocobase/studio-ee:latest'),
    f.tags.get(`nocobase/studio-ee:${version}`),
  );
});

test('registry PUT sends the exact index bytes and verifies the published digest', async () => {
  const body = JSON.stringify({
    schemaVersion: 2,
    mediaType: 'application/vnd.oci.image.index.v1+json',
    manifests: [],
  });
  let head = digest(body);
  const client = new Registry(
    'registry.test',
    'secret',
    'pull,push',
    async (url, options) => {
      if (url.pathname === '/-/docker/token') {
        assert.equal(
          url.searchParams.get('scope'),
          'repository:nocobase/studio:pull,push',
        );
        return Response.json({ token: 'write-token' });
      }
      if (options.method === 'PUT') {
        assert.equal(options.body, body);
        assert.equal(
          options.headers['Content-Type'],
          'application/vnd.oci.image.index.v1+json',
        );
        return new Response(null, { status: 201 });
      }
      assert.equal(options.method, 'HEAD');
      return new Response(null, { headers: { 'docker-content-digest': head } });
    },
  );
  await client.put('nocobase/studio', version, body);
  head = digest('unexpected');
  await assert.rejects(
    client.put('nocobase/studio', version, body),
    /Published digest mismatch/,
  );
});
