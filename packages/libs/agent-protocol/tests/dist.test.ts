import { describe, expect, it } from 'vitest';

import {
  CliPackageSchema,
  compareVersions,
  currentTarget,
  DIST_ROUTES,
  DistArtifactSchema,
  HeartbeatResponseSchema,
  routePath,
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
