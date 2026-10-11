import { describe, expect, it } from 'vitest';

import {
  CliPackageSchema,
  compareVersions,
  currentTarget,
  DIST_ACCEPT_NPM,
  DIST_ROUTES,
  DistArtifactSchema,
  distAccepts,
  DistNpmPackageSchema,
  DistResolutionSchema,
  HeartbeatResponseSchema,
  isDistNpmPackage,
  NPM_UPGRADE_FEATURE,
  NpmUpgradeNoticeSchema,
  routePath,
  RUNNER_FEATURES,
} from '../src/index.js';

const SHA = 'a'.repeat(64);

describe('distribution', () => {
  it('orders versions as semver does', () => {
    const ascending = [
      '0.1.0-alpha.0',
      '0.1.0-alpha.1',
      '0.1.0-alpha.10',
      '0.1.0-beta',
      '0.1.0',
      '0.1.1',
      '0.2.0',
      '1.0.0',
    ];
    for (let i = 0; i < ascending.length - 1; i += 1) {
      expect(compareVersions(ascending[i], ascending[i + 1])).toBe(-1);
      expect(compareVersions(ascending[i + 1], ascending[i])).toBe(1);
    }
    expect(compareVersions('1.2.3', '1.2.3+build.5')).toBe(0);
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
  });

  it('names targets after Node', () => {
    expect(currentTarget('darwin', 'arm64')).toBe('darwin-arm64');
    expect(currentTarget()).toBe(`${process.platform}-${process.arch}`);
  });

  it('describes artifacts and the archive kind of CLI package', () => {
    const artifact = {
      product: 'acme',
      version: '0.2.0',
      target: 'linux-x64',
      url: routePath(DIST_ROUTES.file, {
        product: 'acme',
        version: '0.2.0',
        file: 'acme-v0.2.0-linux-x64.tar.gz',
      }),
      sha256: SHA,
      size: 10,
      channel: 'stable',
    };
    expect(DistArtifactSchema.parse(artifact).url).toBe(
      '/api/agents/dist/products/acme/versions/0.2.0/files/acme-v0.2.0-linux-x64.tar.gz',
    );
    expect(
      DistArtifactSchema.safeParse({ ...artifact, target: 'Linux x64' })
        .success,
    ).toBe(false);
    expect(
      CliPackageSchema.safeParse({
        kind: 'archive',
        version: '0.2.0',
        url: artifact.url,
        sha256: SHA,
      }).success,
    ).toBe(true);
    expect(
      CliPackageSchema.safeParse({
        kind: 'archive',
        version: '0.2.0',
        url: artifact.url,
        sha256: 'nope',
      }).success,
    ).toBe(false);
  });

  it('carries the checksum of an upgrade in the heartbeat answer', () => {
    const parsed = HeartbeatResponseSchema.parse({
      ok: true,
      serverTime: new Date(0).toISOString(),
      cancelRequested: [],
      release: [],
      upgrade: {
        minVersion: '0.0.0',
        latestVersion: '0.2.0',
        downloadUrl:
          '/api/agents/dist/products/acme/versions/0.2.0/files/x.tar.gz',
        reason: 'newer',
        sha256: SHA,
        channel: 'stable',
      },
    });
    expect(parsed.upgrade?.sha256).toBe(SHA);
  });
});

describe('npm answers', () => {
  const npm = {
    kind: 'npm',
    product: 'nocobase-runner',
    version: '1.0.0-beta.4',
    package: '@nocobase/agent-runner',
    channel: 'stable',
  } as const;
  const artifact = {
    product: 'acme',
    version: '0.2.0',
    target: 'linux-x64',
    url: '/api/agents/dist/products/acme/versions/0.2.0/files/x.tar.gz',
    sha256: SHA,
    size: 10,
    channel: 'stable',
  };

  it('names an exact version of a package, never a range', () => {
    expect(DistNpmPackageSchema.parse(npm)).toEqual(npm);
    for (const version of ['^1.0.0', '1.x', 'latest', '>=1.0.0', '1.0'])
      expect(DistNpmPackageSchema.safeParse({ ...npm, version }).success).toBe(
        false,
      );
    for (const name of ['Acme', '@scope', '../x', '@a/b/c'])
      expect(
        DistNpmPackageSchema.safeParse({ ...npm, package: name }).success,
      ).toBe(false);
    expect(
      DistNpmPackageSchema.safeParse({ ...npm, package: 'acme-cli' }).success,
    ).toBe(true);
  });

  it('keeps the artifact shape callers from before read, and tells the two apart', () => {
    const asArtifact = DistResolutionSchema.parse(artifact);
    expect(asArtifact).toEqual(artifact);
    expect(isDistNpmPackage(asArtifact)).toBe(false);
    const asNpm = DistResolutionSchema.parse(npm);
    expect(isDistNpmPackage(asNpm)).toBe(true);
    // An npm answer is not an artifact: a caller that reads only artifacts never mistakes one for it.
    expect(DistArtifactSchema.safeParse(npm).success).toBe(false);
  });

  it('reads the opt-in from a comma-separated accept list', () => {
    expect(distAccepts(undefined, DIST_ACCEPT_NPM)).toBe(false);
    expect(distAccepts('', DIST_ACCEPT_NPM)).toBe(false);
    expect(distAccepts('npm', DIST_ACCEPT_NPM)).toBe(true);
    expect(distAccepts('other, npm', DIST_ACCEPT_NPM)).toBe(true);
    expect(distAccepts('npmx', DIST_ACCEPT_NPM)).toBe(false);
  });

  it('carries an npm upgrade in the heartbeat answer, for the feature that asks for it', () => {
    expect(RUNNER_FEATURES).toContain(NPM_UPGRADE_FEATURE);
    const notice = {
      latestVersion: '1.0.0-beta.4',
      package: '@nocobase/agent-runner',
      reason: 'newer',
      channel: 'stable',
    };
    const parsed = HeartbeatResponseSchema.parse({
      ok: true,
      serverTime: new Date(0).toISOString(),
      cancelRequested: [],
      release: [],
      npmUpgrade: notice,
    });
    expect(parsed.npmUpgrade).toEqual(notice);
    expect(parsed.upgrade).toBeUndefined();
    expect(
      NpmUpgradeNoticeSchema.safeParse({ ...notice, latestVersion: '^1.0.0' })
        .success,
    ).toBe(false);
  });
});
