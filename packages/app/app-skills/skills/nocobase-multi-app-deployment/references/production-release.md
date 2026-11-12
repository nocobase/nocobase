# Independent artifacts and production release

## Separate code from persistent state

Main and each child are complete independent application artifacts. The commercial template initially contains Main only. Build each child independently with `pnpm build --tar` and provide `storage/exports/dist.tar.gz` to Main. Source placement does not affect deployment. Managed instances own runtime configuration and data; external applications keep their original deployment/backup owner.

Use the target App's installed `nocobase-deployment` Skill for standalone Node/Docker details. Record source revision, lockfile, compatible licensed package versions and the actual destination OS/CPU/libc/Node. Inspect that App's `build --help` for supported target options; do not invent flags or build a foreign-platform archive and execute it locally.

Run scoped checks for changed Apps, then build Sub/Main individually with `--tar`. A structural audit, a passing test suite, local workspace dependencies or emitted server/client files are not a complete build. Confirm each dist production install succeeds and its entire production dependency closure is included.

If a build still requests unavailable commercial packages, report the exact dependency/stage and stop artifact acceptance. An explicitly authorized real candidate artifact may be used only through a supported delivery path, with provenance and target compatibility recorded. Never substitute fake packages, source links, copied plugin implementation or a workaround for tool security refusals.

## Validate outside source

Inspect archive metadata/checksums and compiled migration manifests. Exclude configuration, credentials, databases, uploads, keys and instance volumes. Extract into an isolated location away from all source workspaces and start using its own manifest/deployment instructions. Verify no production module or native addon resolves through the original source tree.

Prepare persistent database/file storage, artifact/control metadata, volumes, service ownership and stable keys separately. An archive cannot back up business data. Configure actual origin/base path, trusted origins, Secure cookies and managed Host explicitly; installed plugin presence alone does not enable a Host.

The public ingress must route Main and child paths, preserve Host/HTTPS information and support WebSocket upgrades. Public URL patterns do not configure DNS, certificates or routing. Never expose internal control endpoints, repurpose unrelated services or modify public infrastructure without explicit authorization.

## Publish and select versions

Use installed `nocobase-app-plugin-multi-app` guidance and the live authenticated API document:

1. Resolve the intended template/environment and real IDs.
2. Upload a compatible child archive and publish its verified package identity, version and checksum immutably.
3. Provision an approved instance, or explicitly choose an existing instance and target version for selective upgrade.
4. Read back operation/deployment state until the actual effect is known; accepted/queued is not running.
5. Enroll exact HTTPS callbacks and deliver instance-specific identity settings outside the archive; assign named users explicitly.
6. Verify business state/permissions after deployment and compare an unaffected instance after selective upgrade.

Publishing a template version must not upgrade all existing instances. Presentation configuration is not permission to edit secrets/infrastructure or grant broad raw deployment rights. Use supported configuration services under the intended authorization boundary.

## URLs, Host behavior and acceptance

`APP_PUBLIC_ORIGIN` is an origin without a path; `APP_BASE_PATH` is a mount prefix. The issuer includes the platform authentication path; `PLATFORM_URL` is the navigation entry. Inspect the persisted environment URL rule and actual backend instead of deriving entries from source defaults.

Check the final installed Host supports explicit-stop unregister semantics. The source guard in the template's `scripts/check-host-stop.mjs`, when supplied, is a prerequisite check, not proof that stop/idle/restart behavior works. Do not reapply retired patches or wait for a historical already-merged fix.

Accept only after actual browser SSO, business reads/writes, denied direct APIs, explicit stop refusing request-driven wake, explicit restart retaining data, ordinary idle wake, two-instance isolation and Main/Host restart retention. Record artifact/checksum, environment/instance/operation IDs, exact entries, migration outcome, retained-data comparisons and unexecuted checks. Keep commercial artifacts out of public CI uploads, caches and logs.
