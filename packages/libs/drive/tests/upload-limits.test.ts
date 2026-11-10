import { describe, expect, it, vi } from 'vitest';
import {
  createDriveManager,
  driveUploadLimits,
  parseDriveDiskConfig,
} from '../src/index.js';

describe('per-disk upload limits', () => {
  const disk = {
    driver: 'fs' as const,
    location: '/unused',
    visibility: 'private' as const,
  };
  it('defaults every disk to 20 MiB and respects a selected custom disk', () => {
    const manager = createDriveManager({
      default: 'large',
      disks: { local: disk, large: { ...disk, maxFileSizeMb: 50 } },
    });
    expect(manager.getUploadLimit('local')).toEqual({
      disk: 'local',
      maxFileSizeMb: 20,
      maxBytes: 20 * 1024 * 1024,
    });
    expect(manager.getUploadLimit()).toEqual({
      disk: 'large',
      maxFileSizeMb: 50,
      maxBytes: 50 * 1024 * 1024,
    });
    expect(() => manager.getUploadLimit('unknown')).toThrow('not configured');
  });
  it('does not create custom drivers while validating or publishing limits', () => {
    const factory = vi.fn(() => {
      throw new Error('Must stay lazy');
    });
    const manager = createDriveManager({
      default: 'custom',
      disks: { custom: Object.assign(factory, { maxFileSizeMb: 50 }) },
    });
    expect(manager.uploadLimits().disks.custom?.maxFileSizeMb).toBe(50);
    expect(factory).not.toHaveBeenCalled();
  });
  it.each([0, -1, 1.5, '50', null, false, Number.MAX_SAFE_INTEGER])(
    'rejects invalid limits on unused disks (%s)',
    (value) => {
      const config = {
        default: 'local',
        disks: {
          local: disk,
          unused: { ...disk, maxFileSizeMb: value as number },
        },
      };
      expect(() => createDriveManager(config)).toThrow(
        'drive.disks.unused.maxFileSizeMb',
      );
      expect(() => driveUploadLimits(config)).toThrow(
        'drive.disks.unused.maxFileSizeMb',
      );
      expect(() =>
        parseDriveDiskConfig({ ...disk, maxFileSizeMb: value }),
      ).toThrow('maxFileSizeMb');
    },
  );
  it('preserves explicit limits when parsing serializable disks', () => {
    expect(parseDriveDiskConfig({ ...disk, maxFileSizeMb: 50 })).toMatchObject({
      maxFileSizeMb: 50,
    });
  });
});
