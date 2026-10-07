# Distribution: the CLI and runner tarballs

The App serves two products itself, as standalone tarballs that bundle Node.js, one per platform: its own CLI (the `nocobase.cli.bin` of its `package.json`, such as `acme`) and the runner, `nocobase-runner`. Nothing is published to a registry and a machine needs nothing installed beforehand. The README's "What it does" (Distribution) and "The CLI runs get" sections, and `@nocobase/app-cli`'s README section "The application's own CLI: `cli build` and `cli link`", are the reference.

## Building

```bash
pnpm nocobase cli build              # the App's CLI (needs nocobase.cli in package.json)
pnpm nocobase cli build --runner     # nocobase-runner, from @nocobase/agent-runner
```

- `--targets` takes a comma-separated list; the default is `darwin-arm64,darwin-x64,linux-x64,linux-arm64`. Windows is not supported.
- Node.js for each target is downloaded from nodejs.org and checked against `SHASUMS256.txt` (cached in `node_modules/.cache/nocobase-cli/node`). `--node-version` picks the version (default: the one running the command). `--host-node` uses this machine's Node.js for its own platform instead of downloading, for a quick local build: `pnpm nocobase cli build --targets darwin-arm64 --host-node`.
- `--out` (default `storage/runners/dist`), `--channel` (default `stable`), `--version` (default `nocobase.cli.version`, else the App's version; with `--runner`, the runner's), `--skip-build`, `--keep-staging`.
- The App needs `@nocobase/app-cli-client` in its `devDependencies` for the CLI and `@nocobase/agent-runner` for the runner; `npm`, `pnpm` and `tar` come from the environment.

Each product lands in a directory of its own, with a manifest of every file's SHA-256 and size:

```
<out>/<channel>/<product>/manifest.json
<out>/<channel>/<product>/<version>/<product>-v<version>-<target>.tar.gz
```

## Serving

The plugin serves `agents.dist.dir` (default `storage/runners/dist`, relative to the App root), channel `agents.dist.channel` (default `stable`). A product's current version is the highest in the channel, unless `agents.dist.versions` pins one. Only files a manifest lists are served. Routes (`DIST_ROUTES` of `@nocobase/agent-protocol`): `GET /api/agents/dist/manifest`, `GET /api/agents/dist/products/<product>/targets/<target>` (`?format=env` for a shell; 404 `PLATFORM_UNSUPPORTED` with the targets there are), the tarball itself, and `POST /api/agents/dist/downloadTokens`.

## CI and deployment

Build the two products as separate artifacts in CI, one job each (`pnpm nocobase cli build --out output/dist` and `pnpm nocobase cli build --runner --out output/dist`, uploading `output/dist`), and mount or copy each into the deployment's `storage/runners/dist` (or the directory `agents.dist.dir` names), keeping the `<channel>/<product>/` layout. Do not bake them into the App's image: they change on their own schedule and are large. Rebuild the runner whenever `@nocobase/agent-runner` or the agents plugin is upgraded, so runners can update to a version that speaks the App's protocol, and rebuild the CLI whenever the App's `nocobase.cli` or its CLI skills change.

## Installing on a machine

The install script (`GET /api/agents/dist/installScript`, no credential, it carries no secret) installs the App's CLI under `~/.local/share/<cli>` and links it into `~/.local/bin`:

```bash
# The CLI alone, with a download token any signed-in person mints (one platform, three downloads within 30 minutes):
curl -fsSL https://app.example.com/api/agents/dist/installScript | sh -s -- --token <download token>

# A runtime: also installs nocobase-runner, registers it and starts it as a user service. "Add runtime" shows this line:
curl -fsSL https://app.example.com/api/agents/dist/installScript | sh -s -- --runner --server https://app.example.com --token <registration token>
```

Options: `--prefix`, `--bin-dir`, `--dry-run`; with `--runner`, `--runner-prefix`, `--name`, `--label` and `--no-service` (register only). A token of the other kind fails before anything is installed. An App that serves no CLI still installs the runtime.

## Updates

- The runner reports its product and version on every heartbeat; the answer names a newer `nocobase-runner` when the channel serves one for its platform. An installed runner started by its service updates itself between runs; `nocobase-runner update` does it now (`--check` only checks, `--auto on|off` switches automatic updates). The Runtimes page marks such a runner "Upgradable".
- The App's CLI, installed by the script, has `<cli> update`, and says on stderr when a newer version is served.
- A run gets the App's CLI as `agents.cli.package` says: by default the tarball the App serves for the runner's platform (`{ kind: served }`), downloaded once per version. A runner without the `archives` feature, or a platform with no build, falls back to the CLI installed beside it (`preinstalled`). `{ kind: npm, package, version }` names an npm package instead.

## The npm package as an alternative

`@nocobase/agent-runner` is published to npm with the `nocobase-runner` command, for a machine that already has Node.js 24 or later and prefers a package manager to the install script:

```bash
npm install -g @nocobase/agent-runner
nocobase-runner register --server https://app.example.com --token <registration token>
nocobase-runner service install
```

Such a runner is not in the install script's layout, so it does not update itself: upgrade it with npm to a version that speaks the App's protocol. Install the App's CLI separately (the download-token line above) unless runs get it from the served tarball.
