# File App Plugin

`@nocobase/app-plugin-file` provides file repositories, multipart uploads, stable content URLs. Server services reuse the application's Database and Drive managers; Client services reuse its API Client.

- Register `./server` and the `./client` factory to provide the two Repository managers.
- Declare business collections and expose their operations with `defineFileRepositoryApiRoutes()`.
- Install the `@nocobase/file-component-ui` UI Library block for editable upload, list, thumbnail, and preview UI.
- Use [app-plugin-file-example](../../examples/app-plugin-file-example/README.md) for the runnable attachments example.

Start with the [Agent integration Skill](skills/nocobase-app-plugin-file/SKILL.md). The [manual](docs/README.md) explains the API and current limitations. The plugin itself owns no collection, migration, page, or locale.

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

## Local disk usage

`manager.localDiskUsage()` reports, read-only, whether the Drive's default disk uses the `fs` driver and which file Collections, on every configured database connection, hold at least one record on an `fs` disk, as `{ connection, collection }` pairs; connections it cannot read are listed in `uncheckedConnections`. It reads disk names and drivers only, never locations or credentials, and runs one schema scan per connection and one existence query per file Collection, only when called. `@nocobase/app-plugin-distributed` uses it for its file storage check.
