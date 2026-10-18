---
name: nocobase-drive
description: Configure and use file storage with @nocobase/drive in NocoBase 3 applications, including local filesystem, S3-compatible storage, native Aliyun OSS, and custom driver factories. Use when changing drive configuration, storage credentials, file operations, or storage URLs. File Repository collections and upload permissions belong to the File plugin.
---

# File storage with NocoBase Drive

Use `@nocobase/drive` for storage operations. It wraps Flydrive with application configuration and a native Aliyun OSS driver. Choose the relevant reference before changing a disk:

| Storage                                               | Driver           | Read                                                                |
| ----------------------------------------------------- | ---------------- | ------------------------------------------------------------------- |
| A local or mounted filesystem                         | `fs`             | [Filesystem configuration, paths, and URLs](references/fs.md)       |
| Amazon S3 or an S3-compatible service                 | `s3`             | [S3 configuration, credentials, and ACLs](references/s3.md)         |
| Native Aliyun OSS with access keys or an ECS RAM role | `oss`            | [OSS configuration, credentials, and networking](references/oss.md) |
| An application-owned or third-party Flydrive driver   | Factory function | [Custom driver factories](references/custom-drivers.md)             |

## Configuration and application integration

Configure `default` and `disks` in `server/config/drive.ts`; `config.yml` can override serializable object options. A disk name is the key in `disks`, while `driver` selects an implementation. For example, `local: { driver: 'fs', ... }` is selected by `drive.use('local')`. `default` must name an entry in `disks`. Objects and synchronous factories can coexist; no separate `services` configuration or driver registry is required.

Keep the application's existing `DriveProvider` and import `driveManagerToken` from `@nocobase/app-server/drive`. In server code that already has an application instance:

```ts
import { driveManagerToken } from '@nocobase/app-server/drive';

const drive = app.container.resolve(driveManagerToken);
const disk = drive.use();

await disk.put('reports/example.txt', 'Example report');
const contents = await disk.get('reports/example.txt');
```

Use `drive.use(name)` to select another disk. Pass storage keys relative to that disk, such as `reports/example.txt`; do not pass an absolute filesystem path, a URL, or a pre-encoded key. The manager creates disks on first use and caches successful creation. Resolve the shared manager instead of constructing one per request.

File Repository selects these same disks by name. Use the installed File plugin for file records, Repository upload/download operations, and their permissions. Direct Drive operations do not create File Repository records or perform its authorization checks. Changing the default disk does not move stored objects or rewrite existing records.

## Boundaries and verification

`visibility` does not itself guarantee HTTP access or isolation. Filesystem serving and object storage policies determine actual access; generating a public URL does not grant permission to a private object. Read the selected driver's URL behavior before exposing a link.

Release artifact storage needs serializable configuration. Custom factories are rejected when selected by `releases.artifact.disk`. Named artifact references currently accept private `fs` and `s3` objects; use the complete OSS object directly under `releases.artifact` or `host.artifact` for OSS, as the OSS guide describes.

For standalone use, call `prepareDriveStorage(config)` before `createDriveManager(config)` when filesystem directory preparation is needed. The application Provider already performs preparation. Tests can supply `createDriveManager(config, { fakes: { location } })` and use Flydrive's `fake()`/`restore()`; fakes verify application behavior without proving remote credentials, ACLs, or network access.

Verify a configuration change with a write, read or streamed download, and deletion under a disposable key. Check public or signed links from the intended client's network when the feature uses them. Report whether verification used local storage, fakes, or the real remote service. For custom drivers, also verify lazy creation and repeated use through the shared manager.
