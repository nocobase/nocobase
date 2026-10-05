---
name: nocobase-app-plugin-file
description: Add file collections, uploads, downloads, DOCX/XLSX/PPTX previews, business attachments, and editable Registry file components to a NocoBase 3 App using the public File Repository services.
---

# Add files to an App

Use `@nocobase/app-plugin-file/server` and `@nocobase/app-plugin-file/client`. The plugin provides Repository managers, service tokens, route helpers, and the component-ui Registry recipe. The App or business plugin owns collections, migrations, Drive configuration, resource routes, permissions, and pages.

Inspect the App's existing registrations, migrations, disks, and resources first. Register the Server default export and the Client default factory before consumers, using the App's plugin lifecycle commands. The core does not create collections or routes.

## Find and reuse the preview UI first

Inspect `client/extensions/nocobase-file-component-ui/` before writing upload or preview components. Current Default templates preinstall this application-owned Registry source and its client dependencies; older applications and other templates may not. Import from its `index.ts`, not from plugin-internal paths. Registering the plugin supplies services and translations; it does not automatically install or upgrade the copied UI.

| Format                                               | Registry preview                  | Content access                                                                 |
| ---------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| DOCX / XLSX / PPTX                                   | Local `@silurus/ooxml` viewer     | Same-origin session credentials; no public URL or third-party service required |
| Raster image / PDF / text / Markdown / audio / video | Built-in preview components       | See the content access rules below                                             |
| Legacy DOC / XLS / PPT and OpenDocument              | Office Online fallback            | Internet-accessible absolute URL; cannot use the App session                   |
| Unsupported or unsafe active content                 | Explanation and optional download | Download still requires permission                                             |

For custom attachment lists, uploads or business associations, reuse `FilePreviewDialog` with file records and `contentUrl`; it requires no repository prop. Extend the existing UI or add the necessary content adapter rather than reimplementing format detection and dropping supported formats. A DOCX download fallback indicates a request/rendering failure or an outdated/custom component, not that the plugin lacks DOCX support. Report the actual failure and preserve its evidence.

If the installed package, synchronized Skill and copied UI disagree, inspect the resolved plugin version, run `pnpm nocobase skills sync` to refresh guidance, and reconcile the UI source separately. Skills synchronization does not upgrade Registry copies.

## Work incrementally

- Use standard File Repository routes, the Client File Repository and Registry components for new attachment features. Save associations through the existing business API, whether standard CRUD or custom routes; do not migrate working business routes just to add files.
- Extend existing services, middleware, response adapters or installed UI components where needed. A necessary compatibility handler should delegate to File Repository; do not rebuild upload, storage and metadata handling with Drive or replace the whole CRUD stack.
- Inspect the App's registration, collection, disk and business save path together. Reuse what works; do not ask the user to choose an implementation or repeatedly explore source when the documented contract suffices.
- Verify one small upload → metadata query → content download before building UI. Then wire the returned IDs into the existing save/detail flow. Retain uploaded IDs if the business save fails, and run the affected checks after edits stabilize.

The following business example uses collection `invoice_files`, resource `invoiceAttachments`, connection `main`, and disk `local`. Adapt these to the App.

## Collection

Create an App-owned, self-contained migration under `database/main/migrations/` with a unique name matching its filename. Replace `main` with the target connection when needed:

```ts
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609080001_create_invoice_files',
  async up({ builder }) {
    await builder.createCollection('invoice_files', (collection) => {
      collection.uuid('id').primary().notNull();
      collection.string('disk', { length: 255 }).notNull();
      collection.text('key').notNull();
      collection.text('filename').notNull();
      collection.string('ext', { length: 32 }).notNull();
      collection.string('mimeType', { length: 255 }).notNull();
      collection.bigInt('size').notNull();
      collection.datetime('createdAt').notNull();
      collection.datetime('updatedAt').notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('invoice_files');
  },
});
export default migration;
```

The fields are fixed; mapping is unsupported. The primary key must accept a 36-character UUID, string fields accept string/char/text, size accepts integer/bigInt, and timestamps accept datetime/datetimeTz. Apply with the App's migration command. Never import a live collection schema from a migration.

Upload generates the ID and storage key, normalizes the filename/extension, validates stored size, and supplies timestamps. Extra required columns need defaults because upload accepts no business values. `contentUrl` is derived, never persisted. Save returned file IDs through an App-owned relation or link table when submitting the business form; upload and form submission are separate commits.

## API routes

Declare in the App or business plugin's Server routes module and merge both returned contributions into its existing routes:

```ts
import { defineFileRepositoryApiRoutes } from '@nocobase/app-plugin-file/server';

const fileRoutes: ReturnType<typeof defineFileRepositoryApiRoutes> =
  defineFileRepositoryApiRoutes({
    repositories: [
      {
        name: 'invoiceAttachments',
        collection: 'invoice_files',
        connection: 'main',
        disk: 'local',
        accessPath: '/uploads/invoices',
        accessMode: 'stream',
        policy: {
          read: {
            scope: true,
            fields: [
              'id',
              'filename',
              'ext',
              'mimeType',
              'size',
              'createdAt',
              'updatedAt',
            ],
          },
          create: { scope: true },
          update: false,
          delete: { scope: true },
        },
        actions: {
          findMany: { maxLimit: 100 },
          findOne: {},
          deleteOne: {},
          uploadOne: { maxSize: 5 * 1024 * 1024 },
          uploadMany: { maxSize: 20 * 1024 * 1024 },
        },
      },
    ],
  });
export default fileRoutes;
```

`name` is the Client resource; `collection` defaults to name, `connection` to the database default, and `accessPath` to `/uploads/<name>`. Disk is required. Content paths contain static alphanumeric, underscore or hyphen segments, start with `/`, and have no trailing slash.

Only declared POST `/api/<name>/<action>` operations are exposed; `name` is a camelCase path segment such as `invoiceAttachments`. Ordinary actions are `findMany/findOne/count/exists/aggregate/groupBy/createOne/updateOne/deleteOne`. There are no createMany/updateMany/deleteMany HTTP actions.

Every exposed action appears in the application's API document at `/api/swagger/docs` (JSON at `/api/swagger`), under the exposure's name as its tag with operationIds such as `invoiceAttachmentsFindMany` and `invoiceAttachmentsUploadOne`. The upload operations are documented as `multipart/form-data` with their `maxSize`, `201` result and `400`/`403`/`413`/`415` errors; read it there rather than guessing a request shape. The content route under `accessPath` is outside `/api` and is not in the document.

`policy` is required and governs every action of the exposure, uploads included. It is a Repository Policy: `read`, `create`, `update` and `delete`, each `true`, `false`, or a rule node. A node that is `false` refuses that operation; a node with no `fields` accepts no caller-supplied field, which is what a metadata `createOne` needs before it will accept anything. Pass a function of the principal — `policy: (principal) => ({ ... })` — together with a `principal(context)` resolver to scope rows to the caller; without a principal the request is refused with 403.

An upload supplies no caller fields, so it binds a Policy derived from this one: the `create` scope and defaults are inherited and the field allowlist is replaced by the file columns. `create: false` therefore forbids uploading as well as creating metadata — decided, with the principal, before the body limit, the content type or the multipart body is read, so a refused upload answers `403 WRITE_FORBIDDEN` (domain `app`) and stores nothing — and a `create.defaults` of `{ ownerId }` is stamped onto uploaded rows — which is what keeps an uploaded file inside the same scope `findMany` reads. The content route under `accessPath` is the exception: it is public and this Policy does not reach it.

Content is GET `<accessPath>/<uuid>.<ext>` outside `/api`, omitting the dot when extensionless. Stream returns full bytes as an attachment; redirect returns a public storage URL or a five-minute signed URL. A disk without URL support requires stream mode; there is no automatic fallback.

These are public routes. For restricted files, register App-owned authentication and authorization on the paths each contribution owns before mounting it — `/<name>/<action>` per exposed API action, `<accessPath>/*` for content. Never `router.use('*', ...)` in a contribution router: contributions share the mounted router, so it also guards the SPA and every contribution mounted after yours. Check the operation and record/parent-record access; a login page, private disk, Client filter or Policy field allowlist is not authentication. Add scoped middleware and principal-based Policy to the generated routes first. If an existing contract needs an adapter, extend that module using the public Server manager and retain its authorization checks; missing built-in authentication alone is not a reason to replace the routes. Never trust browser-supplied ownership.

## Server and Client services

Resolve the original token from the current App container after registration; in a ServiceProvider use `this.app.container`. Do not create another database, Drive manager, or API Client.

```ts
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';

const manager = container.resolve(serverFileRepositoryManagerToken);
const files = manager.repository('invoice_files', {
  connection: 'main',
  disk: 'local',
  accessPath: '/uploads/invoices',
  // Only the upload path binds this; the Repository itself is unrestricted,
  // as a db.repository() call is.
  policy: { read: true, create: true, update: false, delete: false },
});
const { record } = await files.uploadOne({ file });
const url = files.getUrl(record);
```

Server repository() takes the exact logical name from createCollection, not its physical table name (for example, crmAccountFiles is not crm_account_files), and requires disk/accessPath matching its routes. getUrl is synchronous and App-local; getStorageUrl asynchronously uses the record's disk/key to obtain a public or signed storage URL. Neither queries the database. Direct Server CRUD does not decorate URLs; uploads do.

Client code resolves `clientFileRepositoryManagerToken` and calls `manager.repository('invoiceAttachments')` with the resource name. It reuses apiClientToken, session and base URL; do not pass disk/connection/accessPath.

```ts
const { record } = await files.uploadOne({ file });
const batch = await files.uploadMany({ files: Array.from(input.files ?? []) });
const rows = await files.findMany({ limit: 20 });
await files.deleteOne({ filter: { id: record.id } });
```

Inputs are a native File or a nonempty File array. Results are `{ record, createdTargets, version? }` and `{ createdCount, records }`. Upload already creates metadata. Client uploads accept an optional second `{ signal }` argument; abort does not undo a server commit. Use returned contentUrl directly: HTTP already adds the host prefix, such as `/main`. Both the read Policy and custom selects must retain `id`, `ext`, `filename`, `mimeType`, `size`, `createdAt` and `updatedAt` when their results feed Registry UI. `id` and `ext` derive `contentUrl`; the remaining fields support thumbnails, preview selection and component refresh. Verify queried records, not only the immediate upload response. Storage `disk` and `key` need not be exposed to read-only UI.

## Registry components

The registered Client plugin supplies English and Chinese UI resources. Registry components bind the `@nocobase/app-plugin-file` namespace explicitly; retain the Client registration and `@nocobase/i18n` dependency when installing them. Existing label overrides still take precedence.

Reuse the preinstalled directory when present. For an application without it, materialize `component-ui` from a NocoBase source workspace into the target application:

```bash
pnpm registry materialize --package @nocobase/app-plugin-file --item component-ui --output-root /absolute/path/to/app
```

Materialize copies source only and refuses an existing target directory. Run it from the NocoBase source repository, not from a generated application. For an upgrade, materialize into a separate temporary directory and three-way merge the previous Registry source, new source and application copy; preserve application customizations. The App must provide React/React DOM, lucide-react, react-markdown, remark-gfm and shadcn button/dialog primitives. It adds no route or permissions. A hosted Registry JSON can instead be installed with shadcn add, which reads the item's declared dependencies; npm publication alone supplies no Registry URL.

Default already declares the viewer. For an application installing the source or upgrading an older copy, add the OOXML viewer from the target App directory if missing:

```bash
pnpm add -D --save-exact @silurus/ooxml@0.85.1
```

The viewer belongs in the App's `devDependencies`: Vite compiles this application-owned client source. Registry `dependencies` describes the installation recipe, while a plugin's published runtime Client imports belong in that plugin's `peerDependencies`. Do not move this viewer into server `dependencies` or add it as a plugin peer solely for copied Registry source. Retain the registered file Client plugin for its locale resources. Merge Registry upgrades with App customizations instead of overwriting installed source.

Use a version of `@nocobase/dev-config` whose `createAppViteConfig` excludes `@silurus/ooxml` from dependency prebundling. For an older shared preset or custom Vite configuration, merge this entry into the existing configuration and preserve other exclusions:

```ts
optimizeDeps: {
  exclude: ['@silurus/ooxml'],
},
```

Restart the development server after changing the configuration. This exclusion preserves the viewer's `import.meta.url`-relative WASM paths during development; verify the parser WASM requests in both development and the served production build.

Compose inside the started App's React context:

```tsx
import { useMemo, useState, type ReactElement } from 'react';
import { useService } from '@nocobase/app-client';
import {
  clientFileRepositoryManagerToken,
  type FileRecord,
} from '@nocobase/app-plugin-file/client';
import {
  FileUploadField,
  FileList,
} from '@/extensions/nocobase-file-component-ui';

export function InvoiceAttachments(): ReactElement {
  const manager = useService(clientFileRepositoryManagerToken);
  const repository = useMemo(
    () => manager.repository('invoiceAttachments'),
    [manager],
  );
  const [value, setValue] = useState<readonly FileRecord[]>([]);
  const [error, setError] = useState('');
  return (
    <>
      <FileUploadField
        repository={repository}
        value={value}
        onChange={setValue}
        multiple
        onError={(cause) => setError(cause.message)}
      />
      <FileList files={value} onError={(cause) => setError(cause.message)} />
      {error && <p role='alert'>{error}</p>}
    </>
  );
}
```

FileUploadField takes a repository and controlled value/onChange; onStatusChange reports idle/uploading/error so forms can prevent incomplete submissions. Accept/maxSize/maxFiles are UI checks. removeOnDelete calls deleteOne, deleting metadata only; otherwise removal unlinks the selection. Read-only FileList, FileThumbnail, FilePreviewField and FilePreviewDialog use contentUrl without a repository prop. Import UI types from the installed recipe. Supply translated labels and adapt App-owned source as needed.

### Preview and content access

Preview supports safe raster images, PDF via a fetched blob, text/Markdown and audio/video. HTML/SVG/XML previews and unsafe URL schemes are rejected. DOCX, XLSX and PPTX use lazily loaded `@silurus/ooxml` viewers to render locally from `FileRecord.contentUrl`; their content is not sent to a third-party preview service. Legacy DOC/XLS/PPT and OpenDocument formats use Office Online, which requires an internet-accessible absolute URL and cannot use the App session.

OOXML, PDF and text fetches use same-origin credentials. An App-owned content route protected by same-origin session cookies can therefore serve restricted previews, provided it checks the caller's record access. Cross-origin fetches omit credentials and require CORS; an external cookie-protected URL is not supported by this default path. The Repository API client's Bearer token is not automatically attached to content fetches.

For Bearer-only content authorization, adapt the installed Registry source in the App. Add an authenticated content loader to the OOXML fetch path and `PreviewBody`'s PDF/text fetches, and adapt download and media/image paths as needed. Resolve authentication through the App's supported client/session services and send credentials only to the trusted content endpoint. Do not put tokens in `contentUrl`. If the adapter creates blob URLs, keep an App-owned trusted URL set, pass it to the relevant `resolveSafeFileUrl` calls, and revoke URLs when replaced or unmounted. Merely assigning a `blob:` URL to `FileRecord.contentUrl` is insufficient: the default components reject untrusted blob URLs.

OOXML request or rendering failure displays an error and, when downloads are enabled, a download action. `download={false}` removes that action. This is not a second preview service or a guarantee that downloading the same inaccessible URL will succeed.

## Verify and handle failures

Verify upload → query → contentUrl → identical downloaded bytes, including batch upload, resource aliases and host prefixes. After materialization run the consuming App's typecheck/build and exercise upload, cancel/retry, remove, download and preview. Restricted files need anonymous, forbidden-user and permitted-user tests against both API and content routes. Inspectors check registration only.

For preview integration or changes, verify each of DOCX/XLSX/PPTX with real files in development and a served production build. Check relative same-origin URLs, an authorized and unauthorized session, cross-origin CORS success/failure, failed requests and invalid documents, and `download={false}`. Close or switch files while loading and after a failure: pending requests must abort, viewers must be destroyed, and the next file must render without stale state. Unit mocks and a successful build do not establish document rendering fidelity.

- Upload defaults are 5 MiB single / 20 MiB batch for the whole multipart body, including overhead. Direct Server uploads have no HTTP limit; UI maxSize checks an individual file. The Client supplies the multipart boundary.
- Upload failures use the standard `/api` error body with domain `file`; branch on `error.reason` (`ApiClientError.reason` in the Client), never on `message`. A successful upload answers 201.
- BODY_TOO_LARGE (413) and UNSUPPORTED_MEDIA_TYPE (415): reduce request size or adjust route limits; send `multipart/form-data`. INVALID_MULTIPART/INVALID_FILE/INVALID_FILES (400): send native File values and a nonempty batch. PRINCIPAL_REQUIRED (403): a Policy function needs a resolved principal.
- INVALID_FILE_COLLECTION: first compare the migration name, route collection and Server repository argument; then await collections.get(logicalName) and check the active connection and generated metadata. SQLite physical text does not imply a broken datetime definition. Fix the specific lookup, metadata or schema problem and retry the same upload; do not bypass File Repository. Use a new migration for corrections to already-merged history.
- STORAGE_URL_UNAVAILABLE (503): configure a capable disk or stream mode.
- FILE_COMMIT_UNCERTAIN / FILE_CLEANUP_FAILED: reconcile database records and stored objects before retrying; uploads have no idempotency key.

There is no built-in route authentication, row ACL, Range/206, ETag, conditional download, resumable upload, physical cleanup, content sniffing or malware scan. Metadata deletion retains objects; cancelled forms may leave unlinked files. Implement the policies required by the business, including referenced-file deletion and orphan cleanup.
