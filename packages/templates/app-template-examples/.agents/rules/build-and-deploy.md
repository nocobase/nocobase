# Building and deploying this application

Read this before changing the build, packing a deployment archive, building or editing the Docker image, setting `CDN_BASE_URL`, or building for another platform. The deployment process itself is in the [deployment Skill](../skills/nocobase-deployment/SKILL.md), and dependency placement and the build failure table are in [where to declare a dependency](../skills/nocobase-app-development/references/dependencies.md).

## Client typechecking

Keep `types: ["node"]` in the client `tsconfig.json`. Shared contracts from database and lifecycle packages resolve to their TypeScript sources in a workspace and require Node.js declarations during typechecking. Declare that requirement explicitly instead of relying on unrelated plugin imports to load the declarations; type-only imports still disappear from the browser bundle.

## CDN assets at build time

`CDN_BASE_URL` sets Vite's `base` only during a production build: `CDN_BASE_URL=https://cdn.example.com/my-app/v1/ pnpm build`. Use a full HTTPS URL ending in `/`; unset, empty or whitespace-only values keep the default `./`. `pnpm build` reads it from the process environment, then `.env.local`, then `.env`; development ignores it and continues using `APP_BASE_PATH`. It is a build parameter, absent from `config variables` and `dist/variables.json`, with no `config.yml` setting. Changing it requires rebuilding.

Upload the static files from `dist/client/` to that CDN prefix with their directory structure preserved, and enable CORS for the application's origin. Keep `index.html` and the complete client tree on the application server so it can inject runtime configuration into HTML and serve files still addressed there. Use `resolveAssetUrl('/assets/logo.png')` from `@nocobase/app-client` for a file shipped as `dist/client/assets/logo.png`; template logos use this helper. It reads Vite's build-time `BASE_URL`, uses an absolute HTTP(S) CDN base when configured, and otherwise falls back to the runtime mount path. Keep API paths, page links and runtime-generated files on `resolveAppUrl`. Vite does not rewrite arbitrary URL strings. The README's CDN section describes deployment and Docker usage.

For a Docker source build, pass `--build-arg CDN_BASE_URL=https://cdn.example.com/my-app/v1/`. With `DIST=prebuilt`, set `CDN_BASE_URL` when building `dist/` beforehand. Neither a prebuilt image's build argument nor `docker run -e CDN_BASE_URL=...` can change compiled asset URLs.

## Packing the build for a deployment

`pnpm build --tar` writes `storage/exports/dist.tar.gz` after the build. The archive holds `dist/` as a directory next to `config.example.yml`, with the `Dockerfile` and `Dockerfile.dockerignore`, so extracting it produces exactly those paths rather than scattering `server/` and `node_modules/` into whatever directory you unpacked in, and a server can build the image from it alone with `docker build --build-arg DIST=prebuilt .`.

`config.example.yml` travels with it because a deployment has to write a `config.yml` before it can start — `pnpm nocobase config init`, run inside `dist/`, does that from the example, in place, and `pnpm nocobase config check` there verifies it, database connection included, before the first start — and the example is the only statement of what may go in it. Directories of executable shims are left out: a `.bin` entry points at a path on the machine that installed it, and a dangling one makes `pnpm install` in the extracted tree report a corrupt store rather than repair it.

Without `--tar` no archive is produced, which is what you want when the build is only going to be run locally.

## Building a Docker image

`Dockerfile` and `Dockerfile.dockerignore` build this application from its sources: a build stage runs `pnpm install --frozen-lockfile` and `pnpm build`, and a `node:24-bookworm-slim` runtime stage receives `dist/` and `config.example.yml` only. The runtime has no pnpm, so it runs the two `dist/package.json` scripts directly: `start` is `node ./server/standalone.js`, which the image starts as `node dist/server/standalone.js`, and `nocobase` is `node ./cli/index.js`, run as `node dist/cli/index.js <topic> <command>`. The deployment root is `/app`, so configuration is `/app/config.yml` and storage is `/app/storage`, both mounted at runtime.

The client is not tied to a mount path, so `APP_BASE_PATH` is a runtime variable, `/main` in the image unless the container is started with `-e APP_BASE_PATH=<path>`; the health check probes the same path. The build stage runs on `$BUILDPLATFORM` and passes `--target linux-$TARGETARCH`, so a multi-platform build does not compile under emulation; do not move the build stage to the target platform or switch the runtime to Alpine, which would need the musl target. Keep `Dockerfile.dockerignore` beside the Dockerfile: BuildKit reads it only there, and without it `config.yml`, `.env`, and `storage/` enter the build context.

`--build-arg DIST=prebuilt` skips the build stage and packages the `dist/` in the context instead, selected through `FROM dist-${DIST}` so BuildKit never runs the stage it does not use. That stage refuses a `dist/` whose `nocobase.buildTarget` is not linux, glibc, the target architecture and the image's Node major, and one from an `@nocobase/app-cli` that does not record `nocobase.relocatable`, whose client is tied to the path it was built for. The ignore file re-includes `dist/` last and whole, so dependency directories inside it named like excluded paths (`langchain/storage`) survive, and then excludes `dist/.env`, which can carry `DB_PASSWORD` from local `.env` files. Keep those rules in that order.

## Building for another platform

`pnpm build --help` (or `-h`) lists build options and exits without loading build dependencies, running hooks, or modifying `dist/`. Every successful build records `nocobase.buildTarget` in `dist/package.json`, including builds with no native modules: `platform`, `arch`, `libc`, `nodeMajor`, and `nodeAbi`. Use `libc` only for Linux; its value on other platforms is a compatibility placeholder. Deployment checks should compare these fields with the host runtime and also respect `engines.node`. With `--target current` (the default), the Node version and ABI come from the running process; an explicit platform target defaults to Node 24 unless `--node-version` is supplied.

`pnpm build` targets the machine it runs on, so `pnpm build && pnpm start` works. A deployment build says where it is going: `--target linux-x64`, `--target linux-arm64`, `--target linux-x64-musl`, plus `--node-version` when the server's Node major differs. Every build prints the platform it produced and records it in `dist/package.json` under `nocobase.buildTarget`.

A `.node` binary must match the target platform, architecture, and C library; addons using the Node ABI must also match its version. `better-sqlite3` 13 uses N-API and bundles its platform binaries, so cross-platform builds retain the target's binary, including the separate `linuxmusl` build for Alpine. `pg`, `mysql2`, and `tedious` are plain JavaScript, so an application using only those is portable as built.

## Compiled migration and seed manifests

The application build generates `.manifest.json` in each compiled migrations and seeds directory after server compilation, path rewriting, and `afterServerBuild` hooks. Keep the manifest generator in the build when customizing it. Plugins generate their own manifests when built; an application must not regenerate manifests for installed dependencies.

TypeScript and compiled JavaScript use the same source checksum for migration history, while the loader separately verifies emitted JavaScript. Marked JavaScript requires its manifest. For a database with old raw JavaScript checksums, first run the compiled representation with matching original output; verified legacy hashes are converted under the task lock. Unreproducible old output remains an error. Never edit historical migrations, and never edit the history table by hand, to resolve an upgrade failure; `pnpm nocobase db repair` is the supported way to realign a checksum you can account for, and `pnpm nocobase db redo` the way to re-run a migration whose branch is still unmerged.

## Server start log

`pnpm dev` owns the ready banner and public URL; `APP_SERVER_START_LOG=false` suppresses the underlying listener announcement through the `env` of `server/config/server.ts`. Keep that mapping when editing deployment environment settings. Request starts, request headers and config diagnostics use DEBUG; the normal INFO output contains completion summaries. See the shared application development Skill for hosted logging and upgrade limits.
