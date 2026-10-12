# The development server

Read this when you report or open the application's address, when `pnpm dev` restarts, refuses to start or watches too much, or when you develop the client against another running application.

## Application access URLs

When reporting or opening this application's address, use the `Local:` URL printed by `pnpm dev`, including the application base path. In normal full-stack development, the Hono server proxies Vite: the user-facing entry uses the server port (`APP_SERVER_PORT`, default 13000), while Vite's port (normally 5173) serves the frontend development process. A response from Vite alone does not verify the application entry.

For an existing run without available startup output, identify its process and working directory, confirm the actual server listening port and configured base path, and check that URL before sharing it. Occupied ports advance automatically, so do not assume defaults. Report when the run belongs to another checkout. Use a host reachable by the user; `localhost` refers to the machine where the browser runs.

With `PROXY_TARGET_URL`, the local Hono server is skipped and Vite becomes the local application entry. Use the printed `Local:` URL in this mode too; `APP_SERVER_PORT` selects its local port (default 5173). See [remote backend development](#remote-backend-development) below.

## What restarts the development run

Changes to `.env` and `.env.local` (including creation, atomic replacement, and deletion) restart the full development run after its previous processes exit. The new run reloads environment files, ports, proxy settings, and startup hooks; explicit shell variables still take precedence. Use the newly printed URL if the port or base path changes. This also applies in proxy mode. `config.yml` changes restart only the local server. `NOCOBASE_STRICT_STARTUP=true` disables both automatic restarts.

Changes to `package.json`, the lockfile, and the package manager's install state restart the local server once they have been quiet for a few seconds. An install writes several of them over as long as fetching and linking take, so restarting on the first write would bring the server back against a half-installed `node_modules` — and the next write would arrive while it was still shutting down, which is where the watcher escalates to SIGKILL. Waiting for quiet turns one install into one restart.

## One development server per application

One development server runs per application root; a second is refused with the first one's process id. Nothing else catches it, because the port check advances to the next free port and the duplicate then fails on the migration lock the first server holds, long before it binds anything. `NOCOBASE_DEV_ALLOW_MULTIPLE=true` starts one anyway. A run that only proxies a remote backend does not take the lock, and a lock left behind by a killed run is taken over rather than reported.

`pnpm dev` also shortens the shutdown budget, through `APP_SHUTDOWN_TIMEOUT_MS`, to less than the five seconds the file watcher waits before force-killing the server. The deployment defaults — a 30 second HTTP drain behind a load balancer — would never be reached here, and a force-killed server never releases its migration lock. Set the variable explicitly to override it in either direction.

Tests that start auxiliary Vite servers must use an isolated temporary `cacheDir`, including when their fixture links the application's `node_modules`. Never delete or rewrite a running development server's dependency cache. See [testing and verification](testing.md) for cache ownership and recovery.

## File watching

`pnpm dev` checks native file watching before starting its children. If watcher resources are exhausted or native events are unavailable, it uses polling for client and server hot updates and disables agent annotations for that run, with a warning. An explicit `CHOKIDAR_USEPOLLING=true` selects the same mode. Configuration files use stat polling so atomic saves and newly created files restart the server without native directory watchers.

Vite must exclude the application's entire `dist/` tree from development file watching. Its default exclusion covers only `dist/client`; watching the compiled server and vendored packages can cause `EMFILE` after a build. Keep the exclusion scoped to this application so linked workspace dependencies, including their `dist/` files, still receive hot updates.

## Remote backend development

Treat `/main` in examples as a default, never as a fixed route. Local `APP_BASE_PATH` resolves from the command-line environment, then `.env.local`, then `.env`, with `/main` as the fallback. Determine the remote application's actual public mount path separately and include it in `PROXY_TARGET_URL`; local and remote paths may differ. For example, `APP_BASE_PATH=/local PROXY_TARGET_URL=http://127.0.0.1:13000/crm pnpm dev` forwards local `/local/api` and `/local/ws` to remote `/crm/api` and `/crm/ws`.

For local client debugging against another running application, use `PROXY_TARGET_URL=<remote-application-base-url> pnpm dev` (for example, `https://backend.example.com/main`, without `/api`). This starts Vite, proxies API and WebSocket paths, and skips the local server and its watchers. Existing `beforeDev` hooks still run. Open the printed Local URL. Client edits reload locally; backend edits require running or deploying the target separately. Requests, including writes, use the target's data and permissions. See the application's README.MD for authentication and path mapping requirements. Unset the variable to develop both sides locally.

The proxy maps same-origin browser HTTP and WebSocket Origin headers to the target origin, with matching Referer paths mapped to the target app base. It preserves foreign origins and does not add missing Origin headers. Keep backend origin checks enabled. Test browser handshakes with an explicit Origin; an Origin-less Node WebSocket test does not verify browser compatibility. Production does not use this Vite adaptation: configure `APP_PUBLIC_ORIGIN` and preserve public Host/protocol information through the reverse proxy.

Use `APP_SERVER_PORT` for the local entry port in both development modes. With `PROXY_TARGET_URL` it selects Vite's preferred port, defaulting to 5173; without it, it selects the local backend port, defaulting to 13000, and Vite still starts from 5173. If occupied, the port advances automatically. Open the printed Local URL and keep the remote service address in `PROXY_TARGET_URL`; this variable does not change it.

## Development logging

`pnpm dev` owns the ready banner and public URL; `APP_SERVER_START_LOG=false` suppresses the underlying listener announcement through the `env` of `server/config/server.ts`. Keep that mapping when editing deployment environment settings. Request starts, request headers and config diagnostics use DEBUG; the normal INFO output contains completion summaries. See the Logging section of [the Skill](../SKILL.md#logging) for hosted logging and upgrade limits.
