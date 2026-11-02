import { FSDriver } from 'flydrive/drivers/fs';
import type { DriverContract } from 'flydrive/types';
import { expectTypeOf, it } from 'vitest';

import type {
  AppDriveConfig,
  AppDriveDiskConfig,
  AppDriveDiskDefinition,
  DriveDriverFactory,
} from '../../src/index.js';

it('accepts configuration objects and synchronous driver factories', () => {
  const options = {
    location: '/tmp/custom-drive',
    visibility: 'private',
  } as const;
  const config: AppDriveConfig = {
    default: 'method',
    disks: {
      local: { driver: 'fs', ...options },
      arrow: () => new FSDriver(options),
      ordinary: function () {
        return new FSDriver(options);
      },
      method() {
        return new FSDriver(options);
      },
    },
  };
  expectTypeOf(config.disks).toEqualTypeOf<
    Record<string, AppDriveDiskDefinition>
  >();
  expectTypeOf<AppDriveDiskDefinition>().toEqualTypeOf<
    AppDriveDiskConfig | DriveDriverFactory
  >();
  expectTypeOf<DriveDriverFactory>().returns.toEqualTypeOf<DriverContract>();
});

it('rejects factories requiring arguments or a receiver, promises, and incomplete drivers', () => {
  const create = (): FSDriver =>
    new FSDriver({ location: '/tmp/custom-drive', visibility: 'private' });
  const invalid: AppDriveConfig['disks'] = {
    // @ts-expect-error Driver factories return a driver synchronously.
    asynchronous: async () => create(),
    // @ts-expect-error A configuration object does not implement DriverContract.
    configuration: () => ({
      driver: 'fs',
      location: '/tmp',
      visibility: 'private',
    }),
    // @ts-expect-error A factory must implement the full driver contract.
    incomplete: () => ({ exists: async () => true }),
    // @ts-expect-error The manager supplies no arguments to a factory.
    arguments: (_options: { bucket: string }) => create(),
    // @ts-expect-error The manager does not bind a factory receiver.
    receiver: function (this: { bucket: string }) {
      return create();
    },
    // @ts-expect-error A driver instance must be returned by a factory.
    instance: create(),
  };
  expectTypeOf(invalid).toEqualTypeOf<Record<string, AppDriveDiskDefinition>>();
  // @ts-expect-error Serializable disk configurations remain object-only.
  const configuration: AppDriveDiskConfig = create;
  expectTypeOf(configuration).toEqualTypeOf<AppDriveDiskConfig>();
});
