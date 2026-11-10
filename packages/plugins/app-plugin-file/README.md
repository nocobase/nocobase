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

Issue, comment and Agent conversation attachment uploads use `drive.disks.<name>.maxFileSizeMb` (positive integer MiB, default 20) and return 413 `FILE_TOO_LARGE` with the disk and its limit when exceeded. The runtime embeds sanitized `drive.uploadLimits` in the page’s public configuration; the Client provider reads it synchronously without a network request and `useFileUploadLimit(disk?)` reads the selected disk's policy. Storage paths and credentials are never published. Restart and reload after configuration changes, and raise reverse proxy body limits to allow the multipart envelope.

General File Repository uploads retain caller-owned size policies and their existing public request-body limits.
