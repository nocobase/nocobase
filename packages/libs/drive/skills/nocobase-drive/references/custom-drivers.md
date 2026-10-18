# Custom driver factories

Each entry in `AppDriveConfig.disks` accepts either an existing `fs`, `s3`, or `oss` configuration object, or a synchronous factory returning a Flydrive `DriverContract`. The disk name is the key in `disks`; `default` selects one of those names. A configuration may contain only factories or mix them with object configurations.

## Configure an application

Implement `CustomDriver` in your application or import it from a driver package. It must implement `DriverContract` from `flydrive/types`, including streaming, metadata, visibility, URLs, and listing as well as ordinary reads and writes. See [Flydrive's custom driver guide](https://flydrive.dev/docs/advanced/custom_drivers) and the installed interface for the full contract. Declare the driver package and any directly imported runtime dependencies in the application's dependencies.

In `server/config/drive.ts`, keep the existing configuration factory and add your disk. The example assumes an application-owned `CustomDriver` that accepts a `location` option:

```ts
import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppDriveConfig } from '@nocobase/drive';
import { CustomDriver } from '../storage/custom-driver.js';

const drive: AppConfigFactory<AppDriveConfig> = defineAppConfig(
  ({ paths }) => ({
    default: 'custom',
    disks: {
      local: {
        driver: 'fs',
        location: paths.storage('local'),
        visibility: 'private',
      },
      custom() {
        return new CustomDriver({ location: paths.storage('custom') });
      },
    },
  }),
);

export default drive;
```

`custom() { ... }`, `custom: function () { ... }`, and `custom: () => ...` are equivalent factory declarations. The factory receives no arguments and no bound `this`. Return a driver synchronously; a Promise or a driver instance assigned directly to `disks.custom` does not satisfy the contract. Capture the driver's options in a closure. Captured values are not automatically replaced by configuration-file overrides or configuration reloads.

The application's existing `DriveProvider` binds the manager to `driveManagerToken` from `@nocobase/app-server/drive`. Consumers resolve that token and call `drive.use('custom')`, or `drive.use()` for the default disk. File Repository uses the same manager and can select the custom disk by name. No replacement Provider or additional registration is required.

## Creation and initialization

Configuration loading, `createDriveManager()`, and `prepareDriveStorage()` do not invoke factories. The first `drive.use(name)` creates the driver and caches the resulting Disk after successful creation. Subsequent uses of that name return the same Disk. A factory exception propagates to the caller; unused factories do not affect other disks.

`prepareDriveStorage()` only creates directories declared by object configurations with `driver: 'fs'`. A custom driver owns any required preparation and asynchronous SDK initialization, including directories for filesystem drivers returned by a factory. Factories do not add initialization or shutdown hooks: resources needing application lifecycle management should be owned by an application Provider. The default Provider also preserves a factory named `s3` when filtering the template's empty S3 placeholder.

Standalone callers use the same configuration with `createDriveManager(config, { fakes: { location } })`. Flydrive's `fake()` and `restore()` continue to work: faking an unused disk does not invoke its factory, and restoring a previously created disk returns its cached instance.

## Serializable configuration boundaries

Factories belong in TypeScript configuration. YAML and JSON can store driver options but cannot represent the factory. `AppDriveDiskConfig` continues to describe object configurations; `DriveDriverFactory` describes the function, and `AppDriveDiskDefinition` is their union. Code reading `config.disks[name].driver` must first narrow out functions.

`parseDriveDiskConfig()` currently parses `fs` and `s3` object configurations and never invokes factories. Release artifact references such as `releases.artifact: { disk: 'custom' }` require serializable object configurations because the resolved disk configuration is passed to Hosts, including through YAML. Selecting a factory for release artifacts fails before Host initialization and does not invoke the factory. Use a private object-configured `fs` or `s3` disk for named artifact references; the [OSS guide](aliyun-ecs-ram-role.md#configure-a-disk) describes configuring OSS artifacts directly.
