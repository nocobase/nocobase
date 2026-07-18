# ADR-0004: Trusted client-app hosting through Multi-Portals

## Status

Accepted for the first implementation. The feature name shown to administrators is "custom frontend" or "light extension application"; the internal light-extension Entry kind is `client-app`.

## Context

NocoBase needs to host an administrator-supplied, already-built browser application at a Multi-Portal workspace URL. The application is trusted same-origin code, uses the existing NocoBase user/session/role/ACL model, and exposes only its current uploaded content. It is not a RunJS Entry and is not compiled by NocoBase.

## Decision

### Entry and manifest contracts

- A client-app upload contains a root `entry.json`. `entry` defaults to `index.html`; otherwise it is a safe POSIX relative `.html` or `.htm` path.
- `dirname(entry)` is the static root. Files outside that root are never served.
- Light Extension persists the Entry identity and current content pointer. Multi-Portals persists only the Entry ID.
- The Multi-Portal manifest publishes this union while retaining the legacy `layout` field during migration:

```ts
type PortalFrontendManifest =
  | { type: 'layout'; layoutUid: string }
  | { type: 'client-app'; entryId: string };
```

### Gateway interception

Use the existing `Gateway.registerRequestHandler` mechanism. It already runs before the NocoBase frontend static fallback, so a second router or HTTP server is unnecessary.

The hook is enhanced to support asynchronous handlers and correct app-manifest selection. It performs only these operations:

1. Ignore API, WebSocket, health, layout-portal, and unmatched requests.
2. Select the longest segment-bounded client-app workspace prefix.
3. Reject malformed decoding, traversal, backslashes, and null bytes.
4. Rewrite the request to the internal `multiPortals:serveClientApp` action with the portal UID and relative `clientAppPath`, preserving the original query.
5. Continue through the normal application request pipeline, where Multi-Portals performs workspace ACL and Light Extension opens the asset.

The rejected alternative was a new Gateway pre-static routing framework. The current hook is already at the required interception point; duplicating path selection and app lifecycle handling would create two routing systems.

### Binary storage

Client-app assets use File Manager storage and stream reads, but they do not expose File Manager URLs. Local deployments use a dedicated non-public storage record whose `documentRoot` is outside `storage/uploads` and whose `baseUrl` is not registered as a static path. Object storage uses the same File Manager stream interface with a private bucket/object policy.

The binary-storage POC is retained as `plugin-file-manager` coverage. It writes PNG-like bytes through `createFileRecord()`, reads them with `getFileStream()`, compares every byte, and deletes the stored object without using a public URL.

`createFileRecord()` uploads before the database create. Therefore the client-app service owns compensation: if persistence or the pointer transaction fails, it deletes every staged file. This cleanup is not delegated to a database rollback.

### Upload limits

The first version fixes these mechanical limits:

- compressed ZIP: 50 MiB;
- files: 2,000;
- one uncompressed file: 25 MiB;
- total uncompressed data: 200 MiB;
- maximum compression ratio: 100:1;
- `entry.json`: 128 KiB.

The archive rejects absolute/traversing paths, backslashes, null bytes, symbolic/hard links, device entries, duplicate paths, and case-insensitive collisions. It does not inspect frameworks, routers, remote scripts, service workers, or application behavior.

### Atomic content switch

`assetSetId` is an internal pointer, not a release/version/publish concept.

1. Parse and validate the archive before changing current state.
2. Create a new asset-set ID and upload every asset into staging.
3. Verify the entry HTML exists and every persisted file is readable.
4. In one database transaction, upsert the stable Entry identity, persist the new asset rows, and switch the client-app record to the new asset-set ID.
5. After commit, retire the old asset set. Cleanup failure is retryable and never reverts the new pointer.
6. A failed upload or transaction deletes staging and leaves the previous pointer unchanged.

An opened download stream owns its underlying object handle. Old asset cleanup must not truncate an already-open stream.

### Service boundary

Light Extension exports public plugin services rather than exposing its collections:

```ts
resolveClientApp(entryId): Promise<ClientAppDescriptor>;
openClientAppAsset(entryId, relativePath): Promise<ClientAppAsset | null>;
listSelectableClientApps(): Promise<ClientAppSummary[]>;
```

Multi-Portals validates and authorizes the workspace, then calls these services. It never queries Light Extension/File Manager tables directly. Light Extension never imports Multi-Portals.

### Static response rules

- `/v/customer` redirects permanently to `/v/customer/`.
- The entry HTML receives exactly one `<base href="/v/customer/">` plus the standard `__nocobase_public_path__` and `__nocobase_api_base_url__` runtime variables.
- The workspace URL is the HTML asset base; the NocoBase deployment root remains the public/cookie path.
- JS, CSS, images, fonts, and WASM are not rewritten. Packages must use relative URLs; root-absolute `/assets/*` is unsupported in the first version.
- Only an HTML document navigation may fall back to the entry HTML. Missing assets return 404.
- Entry HTML is `no-cache`; assets use MIME, content-hash ETag, revalidation, and `X-Content-Type-Options: nosniff`.

### Authentication and login return

- An unauthenticated document request redirects to the v2 sign-in URL with a validated same-origin root-relative redirect.
- An unauthenticated asset request returns 401; an authenticated user without workspace permission receives 403.
- Existing v2 redirect helpers already validate the sign-in origin and sub-app/public-path basename.
- After sign-in, a client-app wildcard route in the v2 router performs one guarded `window.location.replace(window.location.href)`, turning React Router navigation into a full document request. Direct client-app document requests never load that component, which prevents a reload loop.
- Workspace access and API data ACL remain separate server checks.

## Consequences

- Existing six RunJS kinds, schema hash, compilation, type generation, source ZIP, resolver, and VSC text behavior remain unchanged.
- Existing layout portals continue to use their legacy manifest field during migration.
- No build, release history, publish, rollback, runtime contract, cross-origin hosting, sandbox, or custom-domain feature is introduced.
