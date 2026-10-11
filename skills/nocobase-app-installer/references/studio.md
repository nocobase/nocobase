# Deploy and upgrade NocoBase Studio

Use this reference with the parent Skill to install or upgrade published NocoBase Studio. The server needs Node.js 24+, npm, pnpm 11+ and global pm2. `install --app studio` and `install --app @nocobase/studio` both download the published application, build it for this server and deploy it under pm2. No repository checkout or application scaffolding is required.

Before using this route, check the selected installer's `install --help` includes `--app`, and resolve the chosen `@nocobase/studio` version or dist-tag in the intended registry. For example, use `npm view --registry="${NOCOBASE_REGISTRY:-https://registry.npmjs.org}" @nocobase/studio@<version-or-tag> version` and `npx --yes --registry="${NOCOBASE_REGISTRY:-https://registry.npmjs.org}" @nocobase/app-installer@<installer-version> install --help`. Use that same installer version for subsequent commands. If the default installer lacks `--app`, select a published version that supports it; if no compatible installer or Studio version is available in that registry, report the unavailable version and stop. Registry availability alone does not prove installation succeeds.

## Select the source and destination

- For an existing installation, start with `status --dir <installation> --json`. Confirm `appName` is `@nocobase/studio`, its URL and release, and whether `pending` requires recovery. The directory passed to `--dir` contains `installer.json`, not `current`, `dist` or the source checkout. Keep using the same service user and `PM2_HOME` that own it.
- For a new installation, use a new installation directory, a free port and its intended public origin. Reuse decisions from the conversation. SQLite is suitable for a single-instance test when no other database is requested; create independent data for that test.
- Use `--app studio` or `--app @nocobase/studio`; append `@<version or tag>` when requested. Bare official names expand to `@nocobase/<name>`. Do not use `--template`, substitute a development template, or pass an npm source tarball as `--archive`.
- A Studio process running with `pnpm dev`, or a container, is not an installer-managed installation. Moving its existing data requires an explicit migration and backup plan; do not point a fresh install at its live SQLite files or stop it merely to free a port.

## Select the release

Resolve the requested package version or dist-tag in the intended registry. `latest` and `beta` may differ; report the version actually installed. The installer keeps the published application's name and version and records its package and registry in `installer.json`. Its temporary source and dependency tree is removed after the build. For an approved prebuilt deployment archive, the parent's `--archive` route remains available; verify the application identity, runtime target and checksum of that artifact.

## Install

Use the parent Skill's prerequisites and destination checks. This example assumes a same-machine reverse proxy serving `https://studio.example.com`, and `STUDIO_ADMIN_PASSWORD` already populated securely:

```bash
npx --yes --registry="${NOCOBASE_REGISTRY:-https://registry.npmjs.org}" @nocobase/app-installer install /srv/nocobase/studio \
  --app studio \
  --host 127.0.0.1 --port 13000 \
  --origin https://studio.example.com --base-path /main \
  --set-from-env users.initialAdmin.password=STUDIO_ADMIN_PASSWORD \
  --json
```

For direct LAN access, use `--host 0.0.0.0` and `--origin http://<server-address>:<port>`. The origin excludes `/main`; the URL includes it. Keep the selected base path consistent in the reverse proxy, browser and CLI profile. Do not reuse example passwords. For a single process, explicit `--set jobs.default=memory --set queue.default=memory` selects the built-in persistent-on-shutdown adapters; this is not a multi-instance queue setup.

Read the JSON result and follow the parent's failure handling. On success, report the URL, administrator username, secure password location, installation directory and pm2 process name. Report `nextCommands`, including the `pm2 startup` step when returned; a process running under pm2 does not prove it will return after a host reboot.

## Upgrade the same installation

Read `source.kind` first. For an npm application installation, `upgrade` resolves the recorded package's `latest` tag, `--to <version or tag>` selects a release for that invocation, and `--rebuild` builds the installed version again. An initial `--app studio@beta` does not pin upgrades to beta; use `upgrade --to beta`. For an archive installation, obtain a compatible new archive and pass `--archive` instead. Installing a newer app-installer package alone does not upgrade Studio.

```bash
npx --yes --registry="${NOCOBASE_REGISTRY:-https://registry.npmjs.org}" @nocobase/app-installer status --dir /srv/nocobase/studio --json
npx --yes --registry="${NOCOBASE_REGISTRY:-https://registry.npmjs.org}" @nocobase/app-installer upgrade --dir /srv/nocobase/studio --json
```

Handle confirmation, backups and failures through the parent Skill. Once the interruption and backup plan are authorized, repeat the upgrade with `--yes`. Preserve the installation's configuration, origin, base path, pm2 identity and storage; do not reinstall into another empty directory and describe that as an upgrade. Initial administrator settings seed an empty database and do not reset an existing account.

The installer backs up declared SQLite database connections and configuration, not the whole `storage/` tree. Studio also keeps uploaded objects, job state and, by default, `vectors.sqlite` there. For a recoverable production upgrade, include that storage and any external database or object store in the coordinated backup plan. Do not claim the installer's rollback restores these additional files. Use `rollback --dir <installation> --json` and the parent's confirmation rules when recovery is needed; never manually switch `current` or rewrite migration history.

## Verify and report

A healthy process is the first check. Verify the requested scope against the actual public URL:

1. `status` identifies Studio, the intended release, an online process, `health.ok: true`, a matching Node major and no pending operation. Check the migration result and application logs; report warnings separately from failures.
2. Sign in with the configured administrator in a browser. Verify static assets, refresh a deep route, and check the WebSocket connection. Use the browser tool available in the host environment.
3. Exercise an authorized business operation, such as creating a clearly named test project with no repository or initialization task, then read it back. Check upload/download when file storage is in scope. In a live installation, reuse agreed test records; do not create issues, connect repositories, send notifications or trigger agents as an incidental deployment check.
4. Check unauthenticated access and an available ordinary member's permission boundary. Creating a test member is appropriate in an isolated test installation, not an automatic production step.
5. On an isolated deployment test, restart its pm2 process and verify the record, file and session remain usable. On a production upgrade, verify agreed existing records and files after the installer restarts it; avoid an extra restart unless authorized. A process restart does not verify recovery after a host reboot.

## Runner and CLI downloads

Studio releases with the built-in distribution hook generate `dist/runners/` during the application build, including one universal package each for `nocobase-runner` and `nb-studio`. The npm installation runs that build automatically; its deployment archive carries the packages too. Studio serves the build's `dist/runners/` by default when its `stable` channel exists. A configured `agents.dist.dir` overrides it; a valid `NB_STUDIO_RUNNERS_DIST` directory takes precedence over the built-in directory. Without either, the fallback is `storage/runners/dist`. A normal build with bundled packages needs no manually populated persistent distribution directory.

Check the selected release's artifacts and download endpoints before reporting downloads as available: `stable/<product>/manifest.json` must name the corresponding version recorded in `dist/server/agents/served-versions.json`, include a `universal` target, and point to a downloadable package. Runner and CLI versions are their own package versions, not necessarily Studio's version. Universal packages do not include Node.js; the receiving machine needs the Node version required by that release. Older releases or custom distribution overrides may differ; missing or incompatible artifacts should be reported for that release rather than silently replaced with an unrelated version.

Providing downloads is separate from installing and registering an execution machine and configuring model services. When AI execution is requested, follow Studio's Agent team › Runtimes › Add runtime instructions on the execution machine, configure the intended model services, and verify an authorized task there. A successful application installation or a working download does not imply AI tasks can execute. Report downloads, runtime registration, model access and task execution separately, marking capabilities not exercised as untested.

Finish with the URL, installation directory, package version and release (and digest when using an archive), credential location, checks performed, warnings and untested capabilities. Say whether a test instance remains running. Installation, upgrade and rollback are separate outcomes: claim only the operations actually exercised.
