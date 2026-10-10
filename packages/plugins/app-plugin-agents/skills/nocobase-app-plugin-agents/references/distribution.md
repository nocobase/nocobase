# Distribution: the CLI and runner tarballs

The App serves two products itself: its own CLI (the `nocobase.cli.bin` of its `package.json`, such as `acme`) and the runner, `nocobase-runner`, each as standalone tarballs that bundle Node.js, one per platform, or as one universal tarball without Node that runs on the machine's own Node.js 24 or newer on every platform. Nothing is published to a registry. The README's "What it does" (Distribution) and "The CLI runs get" sections, and `@nocobase/app-cli`'s README section "The application's own CLI: `cli build` and `cli link`", are the reference.

## Building

```bash
pnpm nocobase cli build              # the App's CLI (needs nocobase.cli in package.json)
pnpm nocobase cli build --runner     # nocobase-runner, from @nocobase/agent-runner
```

- `--targets` takes a comma-separated list; the default is `darwin-arm64,darwin-x64,linux-x64,linux-arm64`. Windows is not supported.
- `--universal` also packs `<product>-v<version>-universal.tar.gz`, which carries no Node.js and runs on the machine's Node.js 24 or newer; without `--targets` it packs only that one (no Node download). The App serves it to every platform without a tarball of its own; one built for the platform wins.
- Node.js for each target is downloaded from nodejs.org and checked against `SHASUMS256.txt` (cached in `node_modules/.cache/nocobase-cli/node`). `--node-version` picks the version (default: the one running the command). `--host-node` uses this machine's Node.js for its own platform instead of downloading, for a quick local build: `pnpm nocobase cli build --targets darwin-arm64 --host-node`.
- `--out` (default `storage/runners/dist`), `--channel` (default `stable`), `--version` (default `nocobase.cli.version`, else the App's version; with `--runner`, the runner's), `--skip-build`, `--keep-staging`.
- The App needs `@nocobase/app-cli-client` in its `devDependencies` for the CLI and `@nocobase/agent-runner` for the runner; `npm`, `pnpm` and `tar` come from the environment.

Each product lands in a directory of its own, with a manifest of every file's SHA-256 and size:

```
<out>/<channel>/<product>/manifest.json
<out>/<channel>/<product>/<version>/<product>-v<version>-<target>.tar.gz
```

## Serving

The plugin serves `agents.dist.dir` (default `storage/runners/dist`, relative to the App root), channel `agents.dist.channel` (default `stable`). A product's current version is the highest in the channel, unless `agents.dist.versions` pins one. Only files a manifest lists are served. Routes (`DIST_ROUTES` of `@nocobase/agent-protocol`): `GET /api/agents/dist/manifest`, `GET /api/agents/dist/products/<product>/targets/<target>` (`?format=env` for a shell; 404 `PLATFORM_UNSUPPORTED` with the targets there are; the universal tarball answers with the asked target and `universal: true`, `universal=true` in env form), the tarball itself, and `POST /api/agents/dist/downloadTokens` (`<cli> install-token create`). A runner key, a registration token, a download token or any API key (scoped and service-account keys included) downloads; a session does too.

## CI and deployment

Build the two products as separate artifacts in CI, one job each (`pnpm nocobase cli build --out output/dist` and `pnpm nocobase cli build --runner --out output/dist`, uploading `output/dist`), and mount or copy each into the deployment's `storage/runners/dist` (or the directory `agents.dist.dir` names), keeping the `<channel>/<product>/` layout. Do not bake them into the App's image: they change on their own schedule and are large. Rebuild the runner whenever `@nocobase/agent-runner` or the agents plugin is upgraded, so runners can update to a version that speaks the App's protocol, and rebuild the CLI whenever the App's `nocobase.cli` or its CLI skills change.

## Installing on a machine

The install script (`GET /api/agents/dist/installScript`, no credential, it carries no secret) installs the App's CLI under `~/.local/share/<cli>` and links it into `~/.local/bin`:

```bash
# The CLI alone, with a short-lived download token any signed-in person mints:
curl -fsSL https://app.example.com/api/agents/dist/installScript | sh -s -- --token <download token>

# The CLI alone, with the API key in an environment variable (CI, a server, an agent's machine):
curl -fsSL https://app.example.com/api/agents/dist/installScript | sh -s -- --api-key-env ACME_API_KEY

# A runtime: also installs nocobase-runner, registers it and starts it as a user service. "Add runtime" shows this line:
curl -fsSL https://app.example.com/api/agents/dist/installScript | sh -s -- --runner --server https://app.example.com --token <registration token>
```

Options: `--prefix`, `--bin-dir`, `--dry-run`; with `--runner`, `--runner-prefix`, `--name`, `--label` and `--no-service` (register only). A token of the other kind fails before anything is installed. An App that serves no CLI still installs the runtime.

For a universal tarball the script checks, before downloading, that `node` on PATH is Node.js 24 or newer and stops with how to install it otherwise; it then links `<prefix>/node` to that `node`. The package's launcher tries `NOCOBASE_NODE`, `<prefix>/node`, `node` on PATH, and a Node an older standalone version in `<prefix>/versions/` still carries, so a runner's user service (launchd, systemd), whose PATH usually has no `node`, starts it. An update to a universal version leaves the Node it ran on in `<prefix>/node` before removing old versions. With `--runner`, a missing `pnpm` only prints a hint to run `corepack enable`.

### Without a browser

A machine where nobody can open a browser — CI, a server, an agent's host — has two ways to install the CLI, and either way it still needs a credential of its own to use it. `<cli> login --no-browser` is not one of them: it prints an address that a person still has to approve in a browser somewhere else.

**The machine already has an API key.** This is the unattended path. Someone who may create API keys creates one in the App for what the machine has to do (a scoped key or a service account's key is enough to download), and stores it among the machine's secrets. Then, from an empty machine:

```bash
export ACME_API_KEY=...   # from the CI's secrets, never typed on a command line
curl -fsSL https://app.example.com/api/agents/dist/installScript | sh -s -- --api-key-env ACME_API_KEY
export ACME_SERVER=https://app.example.com
acme whoami --json        # the key's user
acme <a command the key may run> --json
```

`--api-key-env` takes the name of the variable, never the key; it cannot be combined with `--token` or `--runner`. The script sends the key only to the App's own address (base path included) to resolve and download the tarball, from a `0600` curl config file in its temporary directory, so it never appears in an argument, the output, `--dry-run` or `install.json`. Redirects are not followed, so the key reaches no other address. The SHA-256 is checked as with a token. A key the App refuses (unknown, expired or revoked) fails the script even when the CLI is installed already. Nothing is saved: the CLI is not signed in afterwards. It reads its server and key from `<PREFIX>_SERVER` and `<PREFIX>_API_KEY` (the App's `nocobase.cli.envPrefix`, such as `ACME`); a machine that should keep the key instead runs `acme login --server <server> --api-key-stdin < <key file>`.

**A signed-in person hands the machine a short-lived download token.** On their own machine, `acme install-token create --json` (`POST /api/agents/dist/downloadTokens`) answers `{ token, expiresAt, maxDownloads }` in `result.data`; the answer is never cached. The token downloads only the CLI: for the platform of its first request, at most three tarball downloads (retries included) within 30 minutes. It is not strictly single-use, and it is no sign-in: it reaches no other route and registers no runner. Run the `--token` line above with it on the other machine, then give that machine its own credential, an API key as above. Any signed-in person may mint one from a session or a personal API key; scoped keys, service-account keys and run tokens are refused (`SCOPED_KEY_FORBIDDEN`), because a token reaches only what its creator could download.

Nothing here creates an API key or approves a sign-in without a person: a machine with no key and nobody signed in anywhere needs someone to create its credential first.

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
