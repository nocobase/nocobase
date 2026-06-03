# Modern client URL prefix is runtime-configurable, decoupled from a fixed build directory

The modern client (v2) was served under a hardcoded `/v2/` URL prefix. We make this prefix configurable via `APP_MODERN_CLIENT_PREFIX` (default `studio`), and crucially **decouple the user-facing URL prefix from the build-output directory**: the directory name is a fixed constant (`studio`, from `DEFAULT_MODERN_CLIENT_PREFIX`) baked once at build time, while the URL prefix is read at runtime from the environment. This lets operators change the prefix without rebuilding — `APP_MODERN_CLIENT_PREFIX=admin yarn start` serves the same `dist/client/studio/` assets under `/admin/`.

## Considered Options

- **Prefix flows into the build (directory follows the env var).** Rejected: the build-output directory would be named after the prefix, so the runtime prefix would have to match the build-time prefix — changing it would require a rebuild, breaking the "runtime effective" requirement and forcing the default literal into both build config and runtime init.
- **Keep the build directory/sentinel named `v2` while the URL is `studio`.** Rejected: the `v2`-internal / `studio`-external split is needless cognitive overhead. Unifying the fixed name to `studio` (same word as the default prefix) removes it.

## Consequences

- The build is prefix-agnostic: CI needs no knowledge of the prefix. `output.assetPrefix` keeps baking the fixed dist-dir sentinel (`/studio/`) into the HTML; the server rewrites it per request, and `main.tsx` sets `__webpack_public_path__` from the runtime public path so dynamically-imported chunks resolve correctly under an overridden prefix / sub-path / CDN without a rebuild. (This runtime-override approach was chosen over switching `assetPrefix` to `'auto'`, which would have changed the static asset URLs the server rewrite logic depends on.)
- The server rewrites the baked `studio` segment in the served HTML to the runtime modern client prefix, and injects it to the browser as `window.__nocobase_modern_client_prefix__`.
- The shared logic is **split by runtime** rather than placed in a single cross-cutting package (`@nocobase/utils` was deliberately avoided): client helpers live in `@nocobase/client-v2` (read `window.__nocobase_modern_client_prefix__`), SSO server helpers live in `@nocobase/plugin-auth` (read `process.env`, alongside the existing `buildRedirectPath`). Each consumer imports from a package it already depends on, so no consumer reimplements the prefix logic and a future prefix change touches none of them.
- The literal `studio` is confined to: the default-prefix constant `DEFAULT_MODERN_CLIENT_PREFIX` in `cli-v1/src/util.js` (kept local so the CLI bootstrap stays lightweight), and the fixed build-directory name in `rsbuild.config.ts` + `gateway` — the latter two are exactly where `dist/client/v2` is already hardcoded today, so this is no worse than the status quo. All helpers read `window`/`process.env` and carry no literal; runtime readers rely on `initEnv()` having populated `process.env.APP_MODERN_CLIENT_PREFIX`.
- The build-output directory name (`dist/client/studio/`) is an internal storage location, never user-facing, and intentionally does *not* track the runtime prefix.

## Where the change lands

Hardcoded `/v2/` is replaced by env-driven reads. Existing internal symbol names (`resolveV2PublicPath`, `v2PublicPath`, …) are kept to minimize churn; only behavior changes.

Helper homes (no shared cross-cutting package; `@nocobase/utils` deliberately untouched):
- `@nocobase/client-v2` — client helpers `getModernClientPrefix()` / `stripModernClientPrefix()` (read `window.__nocobase_modern_client_prefix__`). Imported by app `main.tsx`, `resolveAdminRouteRuntimeTarget.ts`, and the 2 markdown plugins.
- `@nocobase/plugin-auth` (server) — SSO redirect helper (reads `process.env`), alongside the existing `buildRedirectPath`. Imported by the 3 SSO plugins.
- `cli-v1/src/util.js` — local `DEFAULT_MODERN_CLIENT_PREFIX`; `initEnv` adds `APP_MODERN_CLIENT_PREFIX`; `resolveV2PublicPath` reads env.

Server runtime:
- `server/src/gateway/utils.ts` — `resolveV2PublicPath`, `rewriteV2AssetPublicPath` (sentinel = fixed dir `studio`).
- `server/src/gateway/index.ts` — `getV2AssetPublicPath` (CDN), `getV2IndexTemplate` path (`dist/client/studio`), inject `__nocobase_modern_client_prefix__`.

Build:
- `app/client-v2/rsbuild.config.ts` — fixed dir `dist/client/studio`, `assetPrefix` bakes the fixed sentinel, inject window prefix, dev base reads env.
- `app/client/rsbuild.config.ts` — v1 dev proxy base reads env.
- `build/src/injectPublicPathPlugin.ts` — inline data-URI reads `window.__nocobase_modern_client_prefix__` (only inline exception, cannot import).

Client runtime:
- `app/client-v2/src/main.tsx`, `client-v2/.../resolveAdminRouteRuntimeTarget.ts` — use the `@nocobase/client-v2` helper + window var.

Nginx / docker:
- `cli-v1/nocobase.conf.tpl` — alias → `dist/client/studio/assets`.
- `cli-v1/src/commands/create-nginx-conf.js` — `otherLocation` reads env.
- `.env.example` — document `APP_MODERN_CLIENT_PREFIX=/studio/`. Docker relies on `initEnv()` default (no Dockerfile `ENV`).

Plugins (5 code files + comment updates):
- SSO server redirects: `plugin-auth-saml`, `plugin-auth-oidc`, `plugin-auth-cas` → shared server helper reading env.
- Client asset base: `plugin-block-markdown`, `plugin-field-markdown-vditor` → `stripModernClientPrefix`.
- Comments only: `plugin-auth` (`buildRedirectPath.ts`, `hooks.ts`), `plugin-file-manager` (`filePreviewTypes.tsx`).

Tests: fixtures build paths from the runtime helper (env/window with `studio` fallback) rather than a hardcoded `/studio/`, so changing the default never breaks them.

## Two distinct kinds of change

There are two very different operations, and they cost very differently:

1. **Change the prefix for a deployment (runtime, no rebuild).** Set `APP_MODERN_CLIENT_PREFIX=/admin/` and restart. nginx, the node gateway, and the browser all read it at runtime; the prefix detaches from the fixed `dist/client/studio` directory by design. This is the common case and the whole point of this ADR — nothing below applies.

2. **Change the baked-in default itself (code change + rebuild).** Only needed when you want to rename the default value or the on-disk build directory (e.g. `studio` → `console`, so artifacts land in `dist/client/console`). This is rare and is what the checklist below is for.

## Changing the baked-in default (rare; requires a rebuild)

Two conceptually separate literals; decide whether you are changing one or both.

**A. The default URL prefix segment** (what `/` resolves to when the env var is unset). Single source of truth:
- `packages/core/cli-v1/src/util.js` — `DEFAULT_MODERN_CLIENT_PREFIX`.

Every server-side reader gets it from here via `initEnv()`. You may leave the build directory as `studio` and only change this — then the default URL becomes e.g. `/console/` while assets still live in `dist/client/studio/` (the gateway rewrites between them, exactly as a runtime override does).

**B. The fixed build-output directory name** (the on-disk folder + the HTML sentinel the server rewrites). If you also want the folder renamed, change all of these to the same value and rebuild:
- `packages/core/app/client-v2/rsbuild.config.ts` — `MODERN_CLIENT_DIST_DIR` (drives `output.distPath` + the baked sentinel).
- `packages/core/server/src/gateway/utils.ts` — `MODERN_CLIENT_DIST_DIR` (drives the rewrite sentinel + asset-path remap; also re-exported and used by `gateway/index.ts` for the `dist/client/<dir>/index.html` read path).
- `packages/core/cli-v1/nocobase.conf.tpl` — the `alias … /dist/client/studio/assets/` line (nginx serves the physical folder).

**Last-resort fallbacks** that hardcode the string `studio` for the "env unset AND no injected value" edge case — keep them consistent with A (they are defensive, not the source of truth, so a stale value here only affects misconfigured runtimes):
- `packages/core/app/client-v2/src/main.tsx` (`getBuildAssetDir` fallback)
- `packages/core/app/client/rsbuild.config.ts` (v1 dev proxy)
- `packages/core/build/src/injectPublicPathPlugin.ts` (inline data-URI, cannot import a constant)
- `packages/core/client-v2/src/authRedirect.ts` (`getModernClientPrefix` final fallback)
- `packages/plugins/@nocobase/plugin-auth/src/server/utils/buildRedirectPath.ts` (`getModernClientPrefix` fallback)

**Do NOT need changes** when renaming the default: test fixtures (they set the env var explicitly and template off it), `.env.example` (update only the documented example for clarity), and CI (prefix-agnostic).

After changing B you MUST rebuild so artifacts land in the new directory; a running app pointed at the old `dist/client/studio` will otherwise 404.
