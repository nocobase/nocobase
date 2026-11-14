# @nocobase/app-cli-distribution

Server-side artifact distribution and CLI installation without registering Agents. The package has no database, migrations, jobs, Runner service, registration flow or frontend. Agents uses the same implementation with its original credentials, table and HTTP contract.

## Mounting a CLI-only host

Create one artifact store per host configuration so its manifest cache is retained. Mount both routers at `/api/agents/dist` (below the application's base path): existing installed CLIs use these paths for `update`. Build artifacts with `nocobase cli build --universal --out <artifact-directory>`, or platform-specific targets. The layout is `<directory>/<channel>/<product>/manifest.json` and the files that manifest lists.

```ts
import { Hono } from 'hono';
import {
  createArtifactStore,
  createDistributionRoutes,
  createInstallRoutes,
} from '@nocobase/app-cli-distribution';

const artifacts = createArtifactStore({ dir: artifactDirectory });
const distribution = new Hono()
  .route(
    '/',
    createDistributionRoutes({
      artifacts,
      products: ['acme'],
      // Supply the host's real authentication middleware. The host decides
      // whether a session, API key or another credential may download.
      fallback: requireSignedInPerson,
    }),
  )
  .route(
    '/',
    createInstallRoutes({
      cli: () => 'acme',
      publicOrigin: () => publicOrigin,
      publicBasePath: '/main',
    }),
  );
app.route('/api/agents/dist', distribution);
```

`app` is the host's Hono API router. A NocoBase host contributes this router through its normal server routes declaration; it does not register the Agents plugin. `products` restricts manifest entries, resolution and file requests, including npm resolution. It is required: pass the CLI allowlist, or explicitly pass `'all'` to serve every configured product as Agents does. Omitting it throws when the router is created. A request for another product receives 404 after authorization. The artifact directory and manifests are trusted deployment inputs; isolate them from user uploads and untrusted filesystem writers. Files cannot escape their product directory through a manifest path.

## Authorization is explicit

No artifact is public by default. `admissions` are ordered asynchronous handlers: return `false` when the handler recognizes no credential, return `true` after authorizing it, and throw on an invalid recognized credential. An error never falls through to another handler or a signed-in session. After every handler declines, `fallback` may authorize through the host. With neither an accepting handler nor a fallback, requests receive 401 `UNAUTHORIZED` in the existing `agents` error domain. Never use download credentials as business login credentials.

The package implements no anonymous artifact admission or signed credential protocol. A host can write its own authorization middleware, which makes its security policy the host's responsibility. Choosing Main's policy, any public access, and any new persistent token store require a separate product decision. This package does not select one or create a table.

`createInstallRoutes` and `installScript` keep the protected CLI installation protocol unchanged. They accept `--token`, `--server`, `--prefix`, `--bin-dir`, `--dry-run`, `-h` and `--help`, and send `x-nocobase-download-token`. Agents and its Runner extensions keep using these original entry points. The script implementation and extension contract are not shared with public-mode generation.

## Independent public installer

A host that deliberately serves its own CLI artifacts publicly imports a separate entry:

```ts
import {
  publicInstallScript,
  createPublicInstallRoutes,
} from '@nocobase/app-cli-distribution/public-install';

// Either render the script in the host's own route:
const script = publicInstallScript({
  cli: 'acme',
  server: 'https://example.com/platform/main',
});
// Or mount this router alongside that host's public artifact router:
const installation = createPublicInstallRoutes({
  cli: () => 'acme',
  publicBasePath: '/platform/main',
});
```

Mount the router at the host's existing `/api/agents/dist` prefix, choosing one installation router. This script has no token parsing, credential header, Runner registration, service installation or extension hooks. It independently handles server/prefix/bin-dir/dry-run, platform/tool checks, anonymous resolution/download, SHA-256 verification, installation metadata, version activation, command links and the next login instruction. It requires Node.js 24+, curl, tar and a SHA-256 tool on macOS/Linux (Windows through WSL); npm is required only for an npm resolution. It reuses the stateless npm launcher and requested-server helper, not the protected script's text. Relative installation paths become absolute, and metadata remains valid for paths containing quotes. Dry-run resolves metadata but performs no download or installation writes. Exit 0 indicates success/help/dry-run, 2 invalid usage/address and 1 runtime/prerequisite/resolution/checksum failures; a failing external install tool may retain its own nonzero code.

The host must separately configure anonymous artifact admission, restricted to its CLI product, for example `products: ['acme']` with `admissions: [async () => true]`. The new script does not change artifact authorization. A protected response fails even if an older CLI is present. Keep deployment configuration, database files and credentials out of the public archive.

Existing `<cli> update` already consumes the same resolution/file endpoints after selecting its signed-in profile, and needs no download token when those endpoints are public. No `publicUpdates` brand option or `update --server` extension is provided. A never-signed-in installation can rerun the public installer; normal business use still begins with native login. The old update command, protected distribution targets and Runner ownership remain unchanged.

## Optional stateful download tokens

`createDownloadTokenService({ product, store, clock, ids })` implements the existing algorithm: 32 random bytes with the protocol prefix, SHA-256-only storage, 30 minutes, three tarball downloads, and the first requested platform binding. Pass its `downloadTokenAdmission(tokens, artifacts)` in `admissions`. Only when `mint: { guard, tokens, createdBy }` is supplied does the router expose `POST /downloadTokens`; the guard must authenticate and authorize the creator, and `createdBy(context)` supplies its user id. Agents keeps its existing person guard, including refusal of scoped API keys.

`DownloadTokenStore.transaction(fn)` supplies `insert(record)`, `findByHash(hash)` and `updateIfDownloads(id, expected, values)` on one host-owned transaction. Reads must return snapshots; the update must atomically match both id and expected downloads and return whether exactly one row changed. Roll back when the callback throws. Preserve null target values and string timestamps. The in-memory adapter under `tests/` is test-only and does not promise durable storage or production transaction isolation.

Agents adapts the unchanged `agDownloadTokens` repository and its existing transaction runner. No table or historical migration moves, and live pre-upgrade hashes remain usable. Its file authorization still checks token validity before lookup, then binds/counts the actual platform, using two admissions. Failed or cancelled transfers consume a download credit as before.

## Artifact and script contracts

The artifact store selects the highest version or an explicitly pinned version, uses a platform tarball before a universal tarball, and falls back to configured npm packages only when a caller accepts npm and no current artifact exists. Only manifest-listed files are sent, with stat-derived length, SHA-256 metadata and the existing cache headers. Manifest parsing is cached by modification time. File bodies use `createReadStream` and `Readable.toWeb`; cancellation destroys the underlying stream, without buffering the archive.

The default script verifies SHA-256, installs platform/universal/npm packages, writes `install.json` with `mode: cli`, switches `current`, restarts saved ACP connections and prints PATH/sign-in guidance. It retains `NOCOBASE_CLI_INSTALL_DIR`, `NOCOBASE_CLI_BIN_DIR`, `NOCOBASE_CLI_TARGET` and `NOCOBASE_NPM`. `requestedServer` preserves public origin, forwarded origin and base-path handling and refuses unsafe shell defaults.

`InstallScriptExtensions` contains trusted shell fragments for usage, initialization, argument parsing, validation, credential transport, preparation, resolution failures, and post-install actions. These are executable host code, never HTTP input or user configuration. Agents supplies its Runner-specific fragments through this interface, while sharing all archive selection, checksum, npm and installation logic. `openapi` overrides on both route factories let a host describe its actual authentication policy; Agents supplies its unchanged operation ids, tags, descriptions and security declarations.

## Compatibility and verification

| Existing Agents endpoint                               | Preserved behavior                                                                                                                |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `POST /downloadTokens`                                 | Person guard; scoped-key refusal; 201 `{ data: { token, expiresAt, maxDownloads } }`; hidden from CLI discovery                   |
| `GET /installScript`                                   | Public; shell content type; no-cache; all existing CLI and Runner flags, environment variables, errors and request behavior       |
| `GET /manifest`                                        | Runner key without touch, download token, unused registration token, then session/API-key fallback; original error reasons        |
| `GET /products/:product/targets/:target`               | `format=env`, `accept=npm`, universal fallback, unsupported-platform details, original 404 reasons, no-store                      |
| `GET /products/:product/versions/:version/files/:file` | Authorization before file existence, platform binding and credit counting; gzip stream, length, checksum, immutable private cache |

The new package's host tests exercise protected defaults, an explicit session policy, an in-memory token policy, product restrictions, invalid manifests, missing/unlisted/escaping files and stream cancellation without Agents. Agents' unchanged distribution/install/client/work/OpenAPI tests cover its adapter; the upgrade suite inserts old-shaped records directly and checks expiry, first platform, limits and concurrent final-credit consumption. Real installation/update and RSS measurements are local checks reported with the change, not CI cases.

The extraction adds no database query, write, lock or transaction to an Agents request and no polling or Runner claim work. Token mint remains one insert/transaction; metadata admission one read/transaction plus a conditional update when binding; a token file request remains two reads/transactions and one conditional counting update. The product restriction adds an in-memory membership check. No independent-host database or jobs are required.

Main integration and UI, host authorization choices, token cleanup, mode switching between independent distribution and Agents, and the client's full-buffer update download remain separate work. One router owns `/api/agents/dist` in a host; do not register both independent distribution and Agents at that prefix.
