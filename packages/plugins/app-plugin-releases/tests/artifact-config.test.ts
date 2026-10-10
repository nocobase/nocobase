// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { AppDriveConfig, AppDriveDiskConfig } from '@nocobase/drive';
import { resolveArtifact } from '../server/artifact-config.js';
import type { ReleasesPluginConfig } from '../server/config.js';

const fs: AppDriveDiskConfig = {
  driver: 'fs',
  location: 'storage/artifacts',
  visibility: 'private',
};
const s3: AppDriveDiskConfig = {
  driver: 's3',
  bucket: 'archives',
  region: 'auto',
  credentials: {},
  forcePathStyle: true,
  supportsACL: false,
  visibility: 'private',
};
const drive: AppDriveConfig = {
  default: 'local',
  disks: { local: fs, oss: s3 },
};

describe('artifact disk references', () => {
  it.each(['local', 'oss'])(
    'copies %s without changing drive configuration',
    (disk) => {
      const before = structuredClone(drive);
      const resolved = resolveArtifact(
        { disk, prefix: 'releases/nested///' },
        drive,
      );
      expect(resolved).toEqual({
        disk: drive.disks[disk],
        prefix: 'releases/nested',
      });
      expect(resolved.disk).not.toBe(drive.disks[disk]);
      if (resolved.disk.driver === 's3') {
        expect(resolved.disk.credentials).not.toBe(s3.credentials);
        resolved.disk.credentials.accessKeyId = 'changed';
      } else resolved.disk.location = 'changed';
      expect(drive).toEqual(before);
    },
  );

  it.each([undefined, ''])('uses the root for prefix %s', (prefix) => {
    expect(resolveArtifact({ disk: 'local', prefix }, drive).prefix).toBe('');
  });

  it.each([
    '/absolute',
    'C:/absolute',
    'C:relative',
    '\\absolute',
    'a\\b',
    '.',
    '..',
    'a/./b',
    'a/../b',
    'a/..',
    'a\u0000b',
    null,
    123,
  ])('rejects prefix %s', (prefix) => {
    expect(() =>
      resolveArtifact(
        { disk: 'local', prefix } as ReleasesPluginConfig['artifact'],
        drive,
      ),
    ).toThrow('releases.artifact.prefix');
  });

  it.each([
    { disk: '' },
    { disk: ' ' },
    { disk: 'missing' },
    { disk: 'toString' },
    { disk: 'local', driver: 'fs' },
    { disk: 'oss', credentials: { secretAccessKey: 'never-echo-this' } },
  ])(
    'rejects invalid or mixed references without echoing credentials',
    (artifact) => {
      expect(() => resolveArtifact(artifact, drive)).toThrow(
        'releases.artifact',
      );
      try {
        resolveArtifact(artifact, drive);
      } catch (error) {
        expect(String(error)).not.toContain('never-echo-this');
      }
    },
  );

  it('requires drive only for a reference and preserves full configurations', () => {
    expect(() => resolveArtifact({ disk: 'local' })).toThrow('drive.disks');
    expect(resolveArtifact(fs)).toEqual({ disk: fs, prefix: '' });
    expect(resolveArtifact(s3)).toEqual({ disk: s3, prefix: '' });
  });

  it.each([
    { ...fs, location: '' },
    { ...fs, visibility: 'unknown' },
    { ...s3, bucket: '' },
    { ...s3, region: '' },
    { ...s3, credentials: null },
    { ...s3, driver: 'unknown' },
  ])('rejects unavailable disk configuration', (disk) => {
    expect(() =>
      resolveArtifact(
        { disk: 'bad' },
        { default: 'bad', disks: { bad: disk as AppDriveDiskConfig } },
      ),
    ).toThrow('drive.disks');
  });
});
