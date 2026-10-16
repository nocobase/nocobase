import type { S3Driver } from 'flydrive/drivers/s3';
import { describe, expect, it } from 'vitest';

import {
  createDriveManager,
  DriveDiskConfigError,
  parseDriveDiskConfig,
} from '../src/index.js';

describe('parseDriveDiskConfig', () => {
  it('copies only the fields the drivers read', () => {
    const credentials = { accessKeyId: 'id', secretAccessKey: 'secret' };
    const disk = {
      driver: 's3',
      bucket: 'assets',
      region: 'auto',
      endpoint: 'https://s3.example.com',
      forcePathStyle: true,
      supportsACL: false,
      credentials,
      visibility: 'private',
      unknown: 'ignored',
    };
    const parsed = parseDriveDiskConfig(disk);

    expect(parsed).toEqual({
      driver: 's3',
      bucket: 'assets',
      region: 'auto',
      endpoint: 'https://s3.example.com',
      forcePathStyle: true,
      supportsACL: false,
      credentials,
      visibility: 'private',
    });
    expect(parsed).not.toBe(disk);
    expect(parsed.driver === 's3' && parsed.credentials).not.toBe(credentials);
    expect(
      parseDriveDiskConfig({
        driver: 'fs',
        location: 'storage/files',
        url: '/files',
        visibility: 'public',
      }),
    ).toEqual({
      driver: 'fs',
      location: 'storage/files',
      url: '/files',
      visibility: 'public',
    });
  });

  it('leaves omitted S3 options to the driver defaults, as createDriveManager does', () => {
    const disk = {
      driver: 's3',
      bucket: 'assets',
      region: 'auto',
      credentials: {},
      visibility: 'private',
    } as const;
    const parsed = parseDriveDiskConfig(disk);

    expect(parsed).toEqual(disk);
    expect(parsed).not.toHaveProperty('forcePathStyle');
    expect(parsed).not.toHaveProperty('supportsACL');
    const direct = createDriveManager({
      default: 'a',
      disks: { a: disk },
    }).use().driver as S3Driver;
    const viaParsed = createDriveManager({
      default: 'a',
      disks: { a: parsed },
    }).use().driver as S3Driver;
    expect(viaParsed.options).toEqual(direct.options);
  });

  it.each([
    [null, ''],
    [{ driver: 'fs', location: 'files' }, 'visibility'],
    [{ driver: 'ftp', visibility: 'private' }, 'driver'],
    [{ driver: 'fs', location: ' ', visibility: 'private' }, 'location'],
    [{ driver: 'fs', location: 'a', url: 1, visibility: 'private' }, 'url'],
    [
      { driver: 's3', region: 'auto', credentials: {}, visibility: 'private' },
      'bucket',
    ],
    [
      { driver: 's3', bucket: 'b', credentials: {}, visibility: 'private' },
      'region',
    ],
    [
      { driver: 's3', bucket: 'b', region: 'r', visibility: 'private' },
      'credentials',
    ],
    [
      {
        driver: 's3',
        bucket: 'b',
        region: 'r',
        credentials: {},
        supportsACL: 'no',
        visibility: 'private',
      },
      'supportsACL',
    ],
    [
      {
        driver: 's3',
        bucket: 'b',
        region: 'r',
        credentials: { secretAccessKey: 42 },
        visibility: 'private',
      },
      'credentials.secretAccessKey',
    ],
  ])('rejects %j at field %s', (disk, field) => {
    expect(() => parseDriveDiskConfig(disk)).toThrow(DriveDiskConfigError);
    try {
      parseDriveDiskConfig(disk);
    } catch (error) {
      expect((error as DriveDiskConfigError).field).toBe(field);
    }
  });

  it('never echoes configured values', () => {
    const disk = {
      driver: 's3',
      bucket: 'b',
      region: 'r',
      credentials: { accessKeyId: 'never-echo-this', secretAccessKey: 1 },
      visibility: 'private',
    };
    expect(() => parseDriveDiskConfig(disk)).toThrow(
      'Disk field "credentials.secretAccessKey" must be a string.',
    );
  });
});
