# Filesystem storage

Use `driver: 'fs'` for local disks and mounted volumes. Files are stored beneath `location`. Each application instance that needs the same files must reach that storage; separate local directories on different servers do not share contents.

## Configure a disk

In `server/config/drive.ts`:

```ts
import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppDriveConfig } from '@nocobase/drive';

const drive: AppConfigFactory<AppDriveConfig> = defineAppConfig(
  ({ paths }) => ({
    default: 'local',
    disks: {
      local: {
        driver: 'fs',
        location: paths.storage('files'),
        visibility: 'private',
      },
    },
  }),
);

export default drive;
```

Use the configuration context's `paths.storage(...)` to keep files under the application's resolved storage directory. A standalone caller should supply an absolute `location`; the driver does not resolve a relative location against the application root. The default application Provider calls `prepareDriveStorage()` at boot to create all object-configured filesystem directories, including disks other than the default. The process needs permission to create directories and read and write files there.

| Field        | Meaning                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `driver`     | Required literal `fs`.                                                                                          |
| `location`   | Required storage directory.                                                                                     |
| `visibility` | Required `private` or `public`; reported as configured, without changing filesystem permissions or HTTP access. |
| `url`        | Optional public URL base used by `getUrl()`.                                                                    |

## Access and URLs

The filesystem driver returns the configured visibility and does not implement per-file visibility changes. Use application authorization or web server configuration to control who can read a file.

For a directory deliberately served publicly, configure its existing HTTP location:

```ts
const publicDisk = {
  driver: 'fs',
  location: '/srv/app/storage/public',
  visibility: 'public',
  url: 'https://files.example.com/uploads',
} satisfies import('@nocobase/drive').FsDriveDiskConfig;
```

With this disk, `getUrl('images/a b.png')` returns `https://files.example.com/uploads/images/a%20b.png`. A URL base such as `/my-app/storage` is also supported; include the application's base path when needed. Setting `url` only constructs links: it does not mount a route, start a static server, or make the directory public. Without `url`, `getUrl()` fails.

The object configuration exposes no signed URL builders, so `getSignedUrl()` and `getSignedUploadUrl()` are unavailable for a built-in filesystem disk. Use the File plugin's application download route for private files. If signed filesystem links are required, provide a [custom driver factory](custom-drivers.md) with URL builders and matching application endpoints that enforce those signatures.

## Verify

Write and read a disposable key through the shared manager, then delete it. Confirm the file appears beneath the resolved `location`, and verify any public link through the actual HTTP entry point. A successful file write does not verify that a URL is served or authorized correctly.
