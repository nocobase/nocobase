---
'@nocobase/app-plugin-file': major
'@nocobase/app-plugin-database-explorer': major
---

Move the file and Database Explorer routes onto the HTTP API rules.

`@nocobase/app-plugin-file`:

- The endpoints `defineFileRepositoryApiRoutes` generates separate the exposure name and the action with a slash: `POST /api/{name}:{action}` is now `POST /api/{name}/{action}`, including `POST /api/{name}/uploadOne` and `POST /api/{name}/uploadMany`, and `ClientFileRepositoryManager` sends the new paths. The exposure name must be a camelCase path segment. Middleware an application registers on `/{name}:{action}` to protect an exposure must move to `/{name}/{action}`; the old path no longer matches anything.
- A successful upload answers `201` instead of `200`, with the same body.
- An upload decides its principal and the exposure's `create` Policy before the body limit, the content type or the multipart body: an exposure whose Policy forbids `create` answers `403 PERMISSION_DENIED` with reason `WRITE_FORBIDDEN` (domain `app`) without storing anything, instead of storing the object and removing it again, and a refused caller is answered `403` even for an oversized or non-multipart body.
- Upload and content-route failures use the standard `/api` error body, `{ error: { code, status, reason, domain, message, requestId } }`, with domain `file`, instead of `{ code, message }`. Reasons are unchanged: `BODY_TOO_LARGE` (413) and `UNSUPPORTED_MEDIA_TYPE` (415) are `INVALID_ARGUMENT`; `INVALID_MULTIPART`, `INVALID_FILE` and `INVALID_FILES` are `400 INVALID_ARGUMENT`; `PRINCIPAL_REQUIRED` is `403 PERMISSION_DENIED`; `STORAGE_URL_UNAVAILABLE` is now `503 UNAVAILABLE` instead of 500; `INVALID_FILE_COLLECTION`, `INVALID_FILE_METADATA`, `FILE_COMMIT_UNCERTAIN` and `FILE_CLEANUP_FAILED` stay `500` with status `INTERNAL`. Branch on `ApiClientError.reason`.
- The `component-ui` registry item requires `@nocobase/app-plugin-file` `>=1.0.0-beta.0 <2.0.0`.

`@nocobase/app-plugin-database-explorer`:

- `GET /api/database-explorer/connections[...]` is now `GET /api/databaseExplorer/connections[...]`, and `GET .../collections/:collection/physical` is now `GET .../collections/:collection/physicalSchema`.
- `GET /api/databaseExplorer/connections` answers `{ data: ConnectionSummary[], meta: { total } }` instead of `{ data: { default, items } }`; the default connection is the entry with `isDefault: true`.
- `GET /api/databaseExplorer/connections/:connection/collections` takes `pageSize` (1–100, default 20) and `pageToken` instead of `limit` (1–200, default 100) and `cursor`, and answers `{ data: CollectionEntry[], meta: { nextPageToken? } }` instead of `{ data: { items, nextCursor } }`. A malformed `pageSize` or `pageToken` is `400 INVALID_ARGUMENT` with reason `INVALID_INPUT` in the `app` domain and a field violation, instead of `INVALID_LIST_OPTIONS` or `INVALID_CURSOR`.
- Failures use the standard `/api` error body with domain `databaseExplorer` instead of `{ code, message }`, keeping their reasons: `DATABASE_EXPLORER_FORBIDDEN` (403), `CONNECTION_NOT_FOUND` and `COLLECTION_NOT_FOUND` (404), `INVALID_CURSOR` and `INVALID_LIST_OPTIONS` when the database refuses a page token or size (400), `DATABASE_UNAVAILABLE` (503), and `CONNECTION_UNAVAILABLE`, `CONNECTION_UNREACHABLE` and `SCHEMA_READ_DENIED`, which are now `503 UNAVAILABLE` instead of 502.
- The router hands every error it does not translate itself to `apiErrorHandler`, so an authorization denial or a repository error the caller can act on is answered in the standard body even when the router is mounted on its own.
- `ListCollectionsQuery` is `{ pageSize, pageToken }` and `CollectionListResult` carries `nextPageToken`; `MAX_COLLECTION_PAGE_SIZE` is 100. `DatabaseExplorerError.status` is the canonical status name, such as `NOT_FOUND`, instead of an HTTP number.
