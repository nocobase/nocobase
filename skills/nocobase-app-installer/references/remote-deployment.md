# Remote deployment over SSH

## Local orchestration and remote prerequisites

The local Agent builds the application archive, runs app-installer and interprets its JSON result. The local installer bundles its installed runtime dependencies, transfers the bundle and application archive, verifies SHA256 checksums and executes the lifecycle remotely. Do not install an Agent, Skill, npm dependencies or source project on the remote server. Git commit and push are separate local actions: do them when requested, using the project's guidance; deployment itself needs only the built archive.

The local machine needs Node.js 24+, SSH and scp, plus registry access to obtain the installer if it is not cached. The remote machine must be Linux with Node.js 24+, pm2 4.3+ and tar available in a non-interactive SSH session. The bundle does not provide these runtimes. Application services, such as an external database or SMTP server, still need to be reachable. Report missing prerequisites rather than trying an internet installer on an offline server.

Use the user's SSH destination or config alias. Authentication is non-interactive and host-key checking is strict: verify and establish the host key through the user's trusted SSH setup before deployment; do not disable checking. `--ssh-port`, `--ssh-identity` and `--ssh-config` select local connection settings, including jump-host configuration. `--ssh-timeout` is the timeout in seconds for each transfer or execution, not for the entire workflow.

## Prepare the target and archive

Reuse the user's target, origin, database and port choices. `--dir` is an explicit absolute path on the server; `--archive`, SSH identity and SSH config paths refer to local files. For an existing installation, start with `status --ssh <destination> --dir <remote-directory> --json` using the installer invocation in the parent Skill. Inspect `pending` before any update. For an unknown target, inspect it over SSH: only a new or empty directory is suitable for first installation; do not clear an unrecognized directory.

Determine the remote platform, architecture, libc and Node major before building. Follow the local application's `AGENTS.md` and `nocobase-deployment` Skill to build an archive for that target and the intended base path. Do not silently use the local machine's platform when the server differs. `--app`, remote npm upgrades and `--rebuild` are not supported; build locally and pass `--archive`.

## First deployment

Run locally, replacing the example connection and paths with the user's values:

```bash
npx --yes --registry="${NOCOBASE_REGISTRY:-https://registry.npmjs.org}" @nocobase/app-installer@beta deploy \
  --ssh deploy@server --dir /app/my-app \
  --archive storage/exports/dist.tar.gz --origin https://app.example.com --json
```

The default listener is `127.0.0.1`, suitable for a reverse proxy on the server. For direct access, supply `--host 0.0.0.0`, the selected `--port` and an origin with the reachable host and port. Database and initial-admin secrets use `--set-from-env key=LOCAL_VARIABLE`; the installer transports the value through encrypted SSH stdin. Do not put secrets in `--set` or print configuration files.

`deploy` installs when no `installer.json` exists, or upgrades an existing archive installation. Install-only flags such as `--origin`, `--port`, `--host`, `--set` and `--set-from-env` must be omitted for an existing installation; its configuration persists. `install --ssh` explicitly requests a new installation instead.

## Updates and rollback

Build the updated application locally, then run:

```bash
npx --yes --registry="${NOCOBASE_REGISTRY:-https://registry.npmjs.org}" @nocobase/app-installer@beta deploy \
  --ssh deploy@server --dir /app/my-app --archive storage/exports/dist.tar.gz --json
```

Use the same SSH flags for subsequent operations. The same build returns `success-noop`; a newer build of the same application version can upgrade. Do not use an older archive as a rollback mechanism.

Without `--yes`, an upgrade or rollback returns confirmation notes. Explain the downtime, backup and restoration effects before proceeding, respecting any explicit authorization already given for this operation. Otherwise wait for confirmation and repeat with `--yes`. SQLite databases and configuration are backed up automatically; external databases require a completed backup before using `--backup-done`. Never infer that backup from permission to deploy. Release retention defaults to three; `--keep` controls it.

Run `rollback --ssh <destination> --dir <remote-directory> --json` to return to the previous release, or add `--to <release-id>` to select one. Review whether restoring the database will discard writes made since the upgrade. `--no-restore` is an explicit choice to retain current databases, not the default remedy for a failed migration.

## Verify and recover

Read the JSON envelope and report the application entry URL, remote health, warnings and outcome. `result.remote.publicHealth: false` means the local machine could not reach the public health URL; it does not by itself mean remote installation failed. For a private address or reverse proxy, verify access through the intended route. The server-side `pm2 startup` setup and reverse-proxy instructions remain applicable; do not execute a returned server administration command on the local machine.

If SSH disconnects or times out after execution begins, `REMOTE_STATE_UNKNOWN` means the remote operation may still be running. Query `status` with the same SSH destination and directory before retrying. Inspect `pending`, the process and persistent logs; do not launch a competing deployment or remove its files. Once an interrupted operation is established, follow the parent Skill's rollback recovery and confirmation rules.

Preserve the error's code, details and recovery suggestions. Installer recovery suggestions are adapted to SSH; application rebuild guidance belongs in the local source project. Retrying a transfer creates a fresh upload, not a resumed one. Failure details name a retained staging directory for diagnosis; remove it only after confirming no operation uses it. Successful runs clean their staging directory automatically.

For a server reached through another file-transfer method, `bundle --out installer.tar.gz --json` exports the installer and its dependencies locally. Transfer and extract it with the application archive, then invoke `node installer/bin/run.js install ... --archive ... --json` on the server. Use that offline entry for recovery commands too, rather than executing an `npx` suggestion on a disconnected server. Normal SSH deployment handles bundling and transfer automatically.
