import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';

import { FSDriver } from 'flydrive/drivers/fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDriveManager, type AppDriveConfig } from '../src/index.js';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'drive-factories-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('disk factories', () => {
  it('creates only the selected driver, without arguments or a receiver, and caches its disk', async () => {
    const factory = vi.fn(function (this: void) {
      expect(this).toBeUndefined();
      return new FSDriver({ location: root, visibility: 'private' });
    });
    const unused = vi.fn(() => {
      throw new Error('Unused disk must stay lazy.');
    });
    const config: AppDriveConfig = {
      default: 'custom',
      disks: {
        custom: factory,
        unused,
        local: {
          driver: 'fs',
          location: path.join(root, 'local'),
          visibility: 'private',
        },
      },
    };
    const manager = createDriveManager(config);
    expect(factory).not.toHaveBeenCalled();
    await manager.use('local').put('local.txt', 'local');
    expect(factory).not.toHaveBeenCalled();

    const disk = manager.use();
    expect(manager.use('custom')).toBe(disk);
    expect(factory).toHaveBeenCalledExactlyOnceWith();
    await disk.put('hello.txt', 'hello');
    expect(await readFile(path.join(root, 'hello.txt'), 'utf8')).toBe('hello');
    await disk.putStream('stream.txt', Readable.from(['streamed']));
    expect(await text(await disk.getStream('stream.txt'))).toBe('streamed');
    expect(await disk.getMetaData('stream.txt')).toMatchObject({
      contentLength: 8,
    });
    await disk.delete('hello.txt');
    expect(await disk.exists('hello.txt')).toBe(false);
    expect(unused).not.toHaveBeenCalled();
    expect(config.disks.custom).toBe(factory);
  });

  it('fakes a custom disk without creating it and restores its cached instance', async () => {
    const factory = vi.fn(
      () => new FSDriver({ location: root, visibility: 'private' }),
    );
    const manager = createDriveManager(
      { default: 'custom', disks: { custom: factory } },
      { fakes: { location: path.join(root, 'fakes') } },
    );
    const fake = manager.fake();
    await manager.use().put('fake.txt', 'fake');
    fake.assertExists('fake.txt');
    expect(factory).not.toHaveBeenCalled();
    manager.restore();

    const real = manager.use();
    expect(await real.exists('fake.txt')).toBe(false);
    await expect(
      readFile(path.join(root, 'fakes/custom/fake.txt')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await real.put('real.txt', 'real');
    manager.fake();
    expect(await manager.use().exists('real.txt')).toBe(false);
    manager.restore();
    expect(manager.use()).toBe(real);
    expect(await manager.use().get('real.txt')).toBe('real');
    expect(factory).toHaveBeenCalledOnce();
  });

  it('propagates factory errors on use without affecting other disks', async () => {
    const failure = new Error('Custom driver initialization failed.');
    const factory = vi.fn(() => {
      throw failure;
    });
    const manager = createDriveManager({
      default: 'broken',
      disks: {
        broken: factory,
        local: { driver: 'fs', location: root, visibility: 'private' },
      },
    });
    expect(factory).not.toHaveBeenCalled();
    expect(() => manager.use()).toThrow(failure);
    await manager.use('local').put('working.txt', 'working');
    expect(await manager.use('local').get('working.txt')).toBe('working');
  });

  it.each(['missing', 'toString'])(
    'rejects an unconfigured default %s without calling a factory',
    (name) => {
      const factory = vi.fn(() => {
        throw new Error('Must not create a driver.');
      });
      expect(() =>
        createDriveManager({ default: name, disks: { custom: factory } }),
      ).toThrow(`Default drive disk "${name}" is not configured.`);
      expect(factory).not.toHaveBeenCalled();
    },
  );
});
