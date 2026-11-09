import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const editions = ['studio', 'studio-ee'];
const architectures = ['amd64', 'arm64'];
const indexType = 'application/vnd.oci.image.index.v1+json';
const manifestTypes = [
  'application/vnd.oci.image.manifest.v1+json',
  'application/vnd.docker.distribution.manifest.v2+json',
];
const accept = [
  indexType,
  'application/vnd.docker.distribution.manifest.list.v2+json',
  ...manifestTypes,
].join(', ');
const hash = (bytes) =>
  `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
const digestPattern = /^sha256:[a-f0-9]{64}$/;

/** Registry credentials never enter artifacts or job outputs. */
export class Registry {
  constructor(host, password, scope = 'pull', fetcher = fetch) {
    this.origin = `https://${host}`;
    this.password = password;
    this.scope = scope;
    this.fetch = fetcher;
    this.tokens = new Map();
  }
  async token(repository) {
    if (!this.tokens.has(repository)) {
      const url = new URL('/-/docker/token', this.origin);
      url.searchParams.set('service', new URL(this.origin).host);
      url.searchParams.set('scope', `repository:${repository}:${this.scope}`);
      const response = await this.fetch(url, {
        headers: {
          Authorization: `Basic ${Buffer.from(`ci:${this.password}`).toString('base64')}`,
        },
        signal: AbortSignal.timeout(30_000),
        redirect: 'error',
      });
      if (!response.ok)
        throw new Error(
          `Registry authentication failed: HTTP ${response.status}`,
        );
      const result = await response.json();
      const token = result.token || result.access_token;
      if (!token) throw new Error('Registry issued no token.');
      this.tokens.set(repository, token);
    }
    return this.tokens.get(repository);
  }
  async request(repository, suffix, options = {}) {
    const url = new URL(suffix, `${this.origin}/v2/${repository}/`);
    if (
      url.origin !== this.origin ||
      !url.pathname.startsWith(`/v2/${repository}/`)
    )
      throw new Error('Registry pagination escaped its repository.');
    const response = await this.fetch(url, {
      ...options,
      headers: {
        Accept: accept,
        ...options.headers,
        Authorization: `Bearer ${await this.token(repository)}`,
      },
      signal: AbortSignal.timeout(30_000),
      redirect: 'error',
    });
    if (response.status !== 404 && !response.ok)
      throw new Error(
        `Registry ${options.method || 'GET'} ${url.pathname}: HTTP ${response.status}`,
      );
    return response;
  }
  async digest(repository, reference) {
    const response = await this.request(repository, `manifests/${reference}`, {
      method: 'HEAD',
    });
    if (response.status === 404) return null;
    const digest = response.headers.get('docker-content-digest');
    if (!digestPattern.test(digest || ''))
      throw new Error(`Missing digest: ${repository}:${reference}`);
    return digest;
  }
  async manifest(repository, digest) {
    const response = await this.request(repository, `manifests/${digest}`);
    if (response.status === 404)
      throw new Error(`Missing platform image: ${repository}@${digest}`);
    const body = Buffer.from(await response.arrayBuffer());
    if (hash(body) !== digest)
      throw new Error('Platform manifest digest mismatch.');
    const manifest = JSON.parse(body);
    if (!manifestTypes.includes(manifest.mediaType))
      throw new Error(
        'Expected a platform image, not an index or attestation.',
      );
    return { mediaType: manifest.mediaType, size: body.length, digest };
  }
  async tags(repository) {
    const tags = [];
    const seen = new Set();
    let next = 'tags/list?n=1000';
    while (next) {
      if (seen.has(next))
        throw new Error('Registry pagination repeated a page.');
      seen.add(next);
      const response = await this.request(repository, next);
      if (response.status === 404)
        throw new Error(`Cannot list tags for ${repository}.`);
      tags.push(...((await response.json()).tags || []));
      next = response.headers
        .get('link')
        ?.match(/<([^>]+)>;\s*rel="?next"?/i)?.[1];
    }
    return tags;
  }
  async put(repository, tag, body) {
    const response = await this.request(repository, `manifests/${tag}`, {
      method: 'PUT',
      headers: { 'Content-Type': indexType },
      body,
    });
    if (response.status !== 201)
      throw new Error(`Manifest publication failed: HTTP ${response.status}`);
    if ((await this.digest(repository, tag)) !== hash(body))
      throw new Error(`Published digest mismatch: ${repository}:${tag}`);
  }
}

/** Capture moving-tag baselines before building, so a delayed retry cannot roll back a newer release. */
export async function prepareImages(registry, { version, commit, channel }) {
  if (
    !semver.test(version) ||
    !/^[a-f0-9]{40}$/.test(commit) ||
    !['beta', 'latest'].includes(channel)
  )
    throw new Error('Invalid release identity.');
  const plan = { version, commit, channel, images: [] };
  for (const edition of editions) {
    const repository = `nocobase/${edition}`;
    if (registry && (await registry.digest(repository, version)))
      throw new Error(
        `${repository}:${version} already exists. Resume the original run's failed jobs; do not rebuild this version.`,
      );
    const aliases = {};
    const current = async (tag) =>
      registry ? registry.digest(repository, tag) : null;
    let reason;
    if (channel === 'latest') {
      aliases.latest = await current('latest');
      reason = 'channel=latest always moves latest';
    } else {
      aliases.beta = await current('beta');
      const latest = await current('latest');
      if (!registry)
        reason = 'registry not checked (dry run without credentials)';
      else if (!latest) {
        aliases.latest = null;
        reason = 'latest does not exist yet';
      } else {
        const matched = [];
        for (const tag of await registry.tags(repository)) {
          if (semver.test(tag) && (await current(tag)) === latest)
            matched.push(tag);
        }
        if (matched.length && matched.every((tag) => tag.includes('-'))) {
          aliases.latest = latest;
          reason = 'latest points only to prerelease versions';
        } else
          reason = matched.length
            ? 'latest is a stable release; unchanged'
            : 'latest has no matching version; unchanged';
      }
    }
    plan.images.push({
      edition,
      repository,
      aliases,
      tags: [version, ...Object.keys(aliases)],
      latestReason: reason,
    });
  }
  return plan;
}

export async function publishImages(registry, plan, platforms) {
  if (
    !semver.test(plan.version) ||
    !/^[a-f0-9]{40}$/.test(plan.commit) ||
    !['beta', 'latest'].includes(plan.channel) ||
    JSON.stringify(plan.images.map((image) => image.edition)) !==
      JSON.stringify(editions) ||
    platforms.length !== 4
  )
    throw new Error('Invalid release plan.');
  const ready = [];
  for (const image of plan.images) {
    if (
      image.repository !== `nocobase/${image.edition}` ||
      JSON.stringify(image.tags) !==
        JSON.stringify([plan.version, ...Object.keys(image.aliases)]) ||
      Object.keys(image.aliases).some(
        (tag) => !['beta', 'latest'].includes(tag),
      ) ||
      Object.values(image.aliases).some(
        (digest) => digest !== null && !digestPattern.test(digest),
      )
    )
      throw new Error('Invalid image plan.');
    const manifests = [];
    for (const architecture of architectures) {
      const records = platforms.filter(
        (item) =>
          item.edition === image.edition && item.architecture === architecture,
      );
      if (records.length !== 1)
        throw new Error(
          `Expected exactly one ${image.edition}/${architecture} artifact.`,
        );
      const item = records[0];
      if (
        item.commit !== plan.commit ||
        item.version !== plan.version ||
        !digestPattern.test(item.digest)
      )
        throw new Error('Platform artifact does not match the release plan.');
      manifests.push({
        ...(await registry.manifest(image.repository, item.digest)),
        platform: { os: 'linux', architecture },
      });
    }
    const body = JSON.stringify({
      schemaVersion: 2,
      mediaType: indexType,
      manifests,
      annotations: {
        'org.opencontainers.image.description':
          image.edition === 'studio' ? 'NocoBase Studio' : 'NocoBase Studio EE',
        'org.opencontainers.image.revision': plan.commit,
        'org.opencontainers.image.version': plan.version,
        'com.nocobase.studio.edition': image.edition,
      },
    });
    const digest = hash(body);
    const existing = await registry.digest(image.repository, plan.version);
    if (existing && existing !== digest)
      throw new Error(
        `Refusing to overwrite ${image.repository}:${plan.version}.`,
      );
    // Validate both editions before performing any write.
    for (const [tag, before] of Object.entries(image.aliases)) {
      const now = await registry.digest(image.repository, tag);
      if (now !== before && now !== digest)
        throw new Error(
          `${image.repository}:${tag} changed since preparation. Refusing to roll it back.`,
        );
    }
    ready.push({ ...image, body, digest });
  }
  // Publish both immutable versions before advancing any moving tag.
  for (const image of ready) {
    const current = await registry.digest(image.repository, plan.version);
    if (current && current !== image.digest)
      throw new Error(
        `Refusing to overwrite ${image.repository}:${plan.version}.`,
      );
    if (!current)
      await registry.put(image.repository, plan.version, image.body);
  }
  for (const image of ready) {
    for (const tag of Object.keys(image.aliases)) {
      const current = await registry.digest(image.repository, tag);
      if (current !== image.aliases[tag] && current !== image.digest)
        throw new Error(
          `${image.repository}:${tag} changed during publication.`,
        );
      if (current !== image.digest)
        await registry.put(image.repository, tag, image.body);
    }
  }
  return ready.map(({ edition, digest }) => ({ edition, digest }));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const output = (key, value) =>
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  const command = process.argv[2];
  const password = process.env.DOCKER_PUBLISH_TOKEN;
  if (command === 'prepare') {
    if (!password && process.env.DRY_RUN !== 'true')
      throw new Error('Registry credentials are required.');
    const plan = await prepareImages(
      password ? new Registry(process.env.REGISTRY, password) : null,
      {
        version: process.env.VERSION,
        commit: process.env.COMMIT,
        channel: process.env.CHANNEL,
      },
    );
    output('image_plan', JSON.stringify(plan));
    for (const image of plan.images) {
      const prefix = image.edition === 'studio' ? '' : 'ee_';
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `${prefix}tags<<EOF\n${image.tags.join('\n')}\nEOF\n`,
      );
      output(`${prefix}latest_reason`, image.latestReason);
    }
  } else if (command === 'publish') {
    if (!password) throw new Error('Registry credentials are required.');
    const platforms = editions.flatMap((edition) =>
      architectures.map((arch) =>
        JSON.parse(
          readFileSync(
            path.join(process.env.DIGESTS, `${edition}-${arch}.json`),
            'utf8',
          ),
        ),
      ),
    );
    const result = await publishImages(
      new Registry(process.env.REGISTRY, password, 'pull,push'),
      JSON.parse(process.env.IMAGE_PLAN),
      platforms,
    );
    for (const { edition, digest } of result)
      output(edition === 'studio' ? 'digest' : 'ee_digest', digest);
  } else throw new Error('Use prepare or publish.');
}
