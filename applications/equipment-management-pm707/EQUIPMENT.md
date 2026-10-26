# Equipment management preview

This is a new, isolated application generated with the published Default template 1.0.0-beta.81 and create-app 0.1.0-beta.33. Foundation is pinned to 0.1.0-beta.8 within the template's compatible range. These are beta releases, not stable releases. Application source and the development lockfile are retained here; the deployment includes its own production lockfile. No old database, uploads, configuration or credentials are included.

The equipment business source was selectively adapted from the equipment-management-latest application at commit e052748e781f63153fa78e940f2e06b02f04dcf5. The new template retains its own authentication, authorization, theme, account pages and runtime composition. Business permissions now separate editing, issuing, lending, returning, transferring, scrapping, request confirmation/rejection, maintenance creation/completion and stocktake creation/observation/completion. Business exports have explicit permissions.

## Run locally

Use Node.js 24 and pnpm 11.7.0. In this directory run `pnpm install --frozen-lockfile`, `pnpm nocobase config init --dialect sqlite --json`, and `pnpm nocobase config check --json`. Set a new private `INITIAL_ADMIN_PASSWORD` through the environment before the first start. For synthetic data set `APP_SAMPLE_DATA=true` and supply a new private `EQUIPMENT_SAMPLE_PASSWORD` of at least 16 characters through the environment. Keep generated secrets and `config.yml` private and stable across restarts. Then run `pnpm dev` and use the printed application entry URL.

Sample data is initialized only on a fresh installation. It creates 100 synthetic assets in five states, requests, maintenance orders and a stocktake with observations. Its native users are `equipment.manager`, `equipment.member` and `equipment.viewer`. Their initial password comes exclusively from the private sample variable. The last two users provide separate member identities for boundary checks. Configure real preview access through the native Users page; do not share credentials in issue comments. Changing the initialization variable does not reset an existing user's password.

## Business rules and access

- Idle assets can be issued or lent; lending requires a future due date. Returns clear custody and due dates. Transfers preserve relevant custody and loan information.
- Maintenance creates a work order and holds the asset; completion restores its previous state. Scrapping requires an idle asset without pending requests and is terminal.
- Request confirmation and the corresponding asset action commit together. Expected lifecycle versions reject stale updates. Stocktakes retain a snapshot and require observations and explanations for differences without silently rewriting the asset register.
- System administrators retain native account/role administration. Equipment managers handle business records but do not gain account or Foundation administration. Members initially see available assets plus their own equipment, only their own requests, and no procurement fields. Administrators can edit these role scopes using the native permission editor.
- CSV import validates the whole batch before committing and cannot inject custody or state. Asset and business exports enforce their own action and record scope and escape spreadsheet formulas. Exports stop with an error above 10,000 records rather than silently truncating.

## Build and verification

Run `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm build --target linux-x64 --node-version 24 --tar`. The archive is `storage/exports/dist.tar.gz`; it contains runtime code and production dependencies, not business data or secrets. Keep public registry settings in the application when building; a stale mirror can omit a published compatible version.

Then run `python3 scripts/package-preview.py` to produce the delivery archive `storage/exports/equipment-preview.tar.gz`. This preserves the compiled runtime and published dependency files, excludes the upstream `ali-oss` dependency's incidental `.vs` editor cache, and adds `dist/pnpm-lock.yaml` from the exact production installation's internal pnpm lock. The same production lock is saved under `verification/production-lock.yaml`; no dependency implementation is patched. Verify this delivery archive, rather than the intermediate archive. `verification/build-manifest.json` records its hash and the generated Foundation manifest identity.

Relevant automated tests are `tests/server/equipment*.test.ts`, `tests/database/equipment-migration.test.ts`, `tests/client/equipment.test.tsx`, the native authorization assignment guard, and the page permission/locale tests. Run the database suites sequentially. The independent-actions test exercises a role that can issue equipment but cannot return or transfer it, and checks immediate revocation and export denials. The sample test requires every part of fresh initialization to finish.

For an artifact check, extract the archive into a new absolute directory, install the Playwright Chromium browser inside an allowed working directory, then run `PLAYWRIGHT_BROWSERS_PATH=<browser-directory> node scripts/verify-archive.mjs <fresh-extraction-directory> <evidence-directory>`. The script creates temporary credentials in memory, starts the extracted artifact on loopback port 17077, signs in through the native UI, verifies sample counts and role boundaries, captures desktop/mobile screens, changes one synthetic record, restarts the process, and confirms persistence and non-duplication. It writes no passwords or session cookies. The extraction directory must have no existing `config.yml`; choose a new directory for another run. This is implementation verification, not independent acceptance or a remotely accessible preview.

## Foundation and preview limitations

The build plugin and production reader are both Foundation beta.8. The generated `dist/server/foundation-modules.json` is retained as generated; it marks source associations incomplete where static analysis cannot establish them. Installed global capabilities are not evidence that every module uses them. No generic Foundation changes or forced capability indicators are included.

This is a single-instance SQLite preview with local storage. It does not connect to physical devices, production systems, mail, messaging or external models. Native jobs use the single-process memory configuration. Remote preview creation, secret configuration and artifact upload must use the management platform's supported native interfaces; local verification does not establish remote configuration or availability.
