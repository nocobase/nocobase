# File App Plugin

`@nocobase/app-plugin-file` provides file repositories, multipart uploads, stable content URLs. Server services reuse the application's Database and Drive managers; Client services reuse its API Client.

- Register `./server` and the `./client` factory to provide the two Repository managers.
- Declare business collections and expose their operations with `defineFileRepositoryApiRoutes()`.
- Install the `@nocobase/file-component-ui` UI Library block for editable upload, list, thumbnail, and preview UI.
- Declare each feature that stores files with `registerUsage()` so the file storage settings page lists it.
- Use [app-plugin-file-example](../../examples/app-plugin-file-example/README.md) for the runnable attachments example.

Start with the [Agent integration Skill](skills/nocobase-app-plugin-file/SKILL.md). The [manual](docs/README.md) explains the API and current limitations. The plugin owns no collection or migration; its one page is the file storage settings page described below.

Trusted server callers can pass their outermost `DatabaseConnection` as `repository(collection, { transaction, disk, accessPath, policy })` to include uploaded metadata in the same transaction as a business write. Let upload errors roll back that transaction. Uploaded objects are removed on rollback after checking through the root connection that no committed row owns them; a failed verification retains the objects and reports a transaction callback warning. Normal uploads without `transaction` keep their existing independent commit behavior.

This replaces the old File backend and client protocol. `createFileRoute`, `FilesClient`, access-token routes, inventory settings, and runtime component exports have been removed. Installed UI Library copies need to adopt `ClientFileRepository` and the new `FileRecord` fields. Existing business tables are not migrated automatically. The separate File Repository package is removed; its exported manager and route-helper names remain available from this package.

DOCX, XLSX, and PPTX render locally in the browser using lazily loaded `@silurus/ooxml` viewers and the existing `FileRecord.contentUrl`; file content is not sent to a third-party preview service. Same-origin requests use the App session, while cross-origin URLs require CORS and omit credentials. Failed downloads or rendering fall back to the download action. Legacy DOC/XLS/PPT and OpenDocument files retain the Office Online fallback, which requires an internet-accessible URL and cannot use the App session.

Issue, comment and Agent conversation attachment uploads use `drive.disks.<name>.maxFileSizeMb` (positive integer MiB, default 20) and return 413 `FILE_TOO_LARGE` with the configured limit when exceeded. The runtime embeds sanitized `drive.uploadLimits` in the page’s public configuration; the Client provider reads it synchronously without a network request and `useFileUploadLimit(disk?)` reads the selected disk's policy. Storage paths and credentials are never published. Restart and reload after configuration changes, and raise reverse proxy body limits to allow the multipart envelope.

General File Repository uploads retain caller-owned size policies and their existing public request-body limits.

## Storage directories

`disk` selects a configured Drive storage backend or bucket. `storagePrefix` selects the object directory inside that disk. `accessPath` independently selects the application's public content route; changing it does not change object keys.

Set `storagePrefix` in each server-side `defineFileRepositoryApiRoutes({ repositories: [...] })` exposure or in `manager.repository(collection, { disk, storagePrefix, accessPath, policy })`. For example, after creating the three file collections with the required columns, use the following exposures with the application's existing `filePolicy` and authentication middleware. Configure the `business` disk once for the shared OBS bucket (or another supported Drive backend):

```ts
import { defineFileRepositoryApiRoutes } from '@nocobase/app-plugin-file/server';

const routes = defineFileRepositoryApiRoutes({
  repositories: [
    {
      name: 'contracts',
      collection: 'contract_files',
      disk: 'business',
      storagePrefix: 'contracts',
      accessPath: '/uploads/contracts',
      policy: filePolicy,
      actions: { uploadOne: {}, uploadMany: {} },
    },
    {
      name: 'avatars',
      collection: 'avatar_files',
      disk: 'business',
      storagePrefix: 'avatars',
      accessPath: '/uploads/avatars',
      policy: filePolicy,
      actions: { uploadOne: {} },
    },
    {
      name: 'receipts',
      collection: 'receipt_files',
      disk: 'business',
      storagePrefix: 'expenses/receipts',
      accessPath: '/uploads/receipts',
      policy: filePolicy,
      actions: { uploadOne: {}, uploadMany: {} },
    },
  ],
});
```

The resulting keys are `contracts/<uuid>.<ext>`, `avatars/<uuid>.<ext>` and `expenses/receipts/<uuid>.<ext>`. Omit `storagePrefix` to retain `objects/<uuid>.<ext>`; set it to `''` for `<uuid>.<ext>` at the disk root. Filenames remain server-generated UUIDs with the existing extension rules, including no dot for extensionless files.

Configuration removes overall leading/trailing whitespace, removes leading/trailing `/`, and collapses repeated `/`. Each nonempty directory segment accepts only ASCII letters, digits, dots, underscores and hyphens. `.` and `..` segments, whitespace inside segments, backslashes, other characters and control characters (including tabs/newlines, even at the edges) are rejected before storage access. Whitespace-only or slash-only prefixes normalize to the root. Keys always use `/`, independently of the operating system.

This is static, trusted server configuration, never an upload body or query parameter; callbacks for dates, tenants or business records are unsupported. Persisted records retain their complete `key`. Changing the prefix affects subsequent uploads only: existing content routes, storage URLs, failure cleanup and transaction rollback keep using each actual key. No database migration or object relocation is required. Directory separation provides no authorization; retain the application's access checks. The [Agent Skill](skills/nocobase-app-plugin-file/SKILL.md#storage-directories) includes the same integration contract.

## File storage settings and file usages

The plugin adds **System settings › System › File storage** at `/settings/file-storage`. It shows the disks the application's `drive` configuration declares (type, a location summary, visibility, max file size, whether it is the default, whether its configuration is complete, and where each setting comes from), the features that store files with how many files each holds, and a check that writes, reads, links and deletes a temporary file under the disk's `nocobase-check/` directory. The page is read-only apart from the check: storage is configured in `drive` and takes effect after redeploying, existing files are never moved, and there is no global file browser. The tab and the open disk live in the query string (`?tab=usages`, `?disk=local`), so an application replaces the whole page with one `routeComponentOverrides` entry for the `fileStorage` route.

Two grants govern it, both granted to roles in the permission workspace: the page `file-storage` (`access`) opens the page and reads the storage, and the settings item `file-storage` (`check`) runs a check. Without the authentication and authorization plugins the routes are not registered.

| Route                               | Grant                                            | Answer                                                                          |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `GET /api/file/storage`             | `page:file-storage/access`                       | `{ defaultDisk, canCheck, disks, usages }`                                      |
| `POST /api/file/disks/{disk}/check` | the page grant and `settings:file-storage/check` | `{ disk, ok, checkedAt, steps: [{ step, status, detail, reason, errorName }] }` |

Responses are built field by field: they never contain credentials, secrets, endpoint user information or an absolute path on the server; a local directory is shown relative to the application directory, and one outside it is only flagged. A failed step reports a fixed `reason` (`CONFIG_INCOMPLETE`, `WRITE_FAILED`, `READ_FAILED`, `CONTENT_MISMATCH`, `URL_FAILED`, `DELETE_FAILED`, `DISK_UNAVAILABLE`) and the error's own name or code, never its message; the raw error goes to the server log. A disk whose configuration is incomplete, such as the template's `s3` disk without a bucket, is not contacted. The latest check of each disk is kept in memory on the instance that ran it and is forgotten on restart; with several instances only the instance that answered is checked.

A plugin or application declares each feature that stores files from a service provider's `boot()`:

```ts
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';

if (this.app.container.has(serverFileRepositoryManagerToken))
  this.app.container.resolve(serverFileRepositoryManagerToken).registerUsage({
    id: 'invoices.files', // unique across the application
    title: {
      key: 'fileUsage',
      ns: '@acme/app-plugin-invoices',
      defaultValue: 'Invoice files',
    },
    plugin: '@acme/app-plugin-invoices',
    collection: 'invoiceFiles',
    disk: { default: true }, // or { name: 'archive' }, or { config: 'invoices.disk' }
    download: 'authenticated', // or 'public'
  });
```

`disk` is the disk new files go to: a fixed name, the default disk (`drive.default`), or the disk a configuration key names, falling back to the default disk when the key is empty. It is resolved on every read, so changing `drive.default` and restarting moves the features that follow it. `download` is `authenticated` when files are served only through the plugin's own routes that check permission, and `public` when anyone holding the URL can download them. Every exposure of `defineFileRepositoryApiRoutes()` registers itself, named after the exposure, with its fixed disk and `download: 'public'`. Registering an id again for the same Collection replaces it; an id already registered for another Collection throws. The page counts each feature's records and sums their `size` with one aggregate query per feature, in parallel; a feature whose count fails shows no figures without affecting the others.

`manager.describeUsages()` returns every registered feature with its resolved disk, for checks such as a cluster readiness check looking for features that keep files on a local disk; when it returns none, new files go to `drive.default`.

## Local disk usage

`manager.localDiskUsage()` reports, read-only, whether the Drive's default disk uses the `fs` driver and which file Collections, on every configured database connection, hold at least one record on an `fs` disk, as `{ connection, collection }` pairs; connections it cannot read are listed in `uncheckedConnections`. It reads disk names and drivers only, never locations or credentials, and runs one schema scan per connection and one existence query per file Collection, only when called.
