# Equipment workspace

This independent NocoBase 3 application uses the official Default template `1.0.0-beta.81`. It is a synthetic equipment-management preview, not an upgrade of any existing application. All underlying packages are beta prereleases. Restore the entire `applications/equipment-management` directory from the task branch, then work inside it. Its nested workspace and lockfile intentionally resolve published packages rather than this repository's workspace packages.

## Install and run

Use Node.js 24 and pnpm 10. Run `pnpm install --frozen-lockfile`, `pnpm nocobase config init`, and `pnpm nocobase config check`. Provision `INITIAL_ADMIN_PASSWORD` and `EQUIPMENT_SAMPLE_PASSWORD` through private environment injection; the latter requires at least 16 characters. Set `APP_SAMPLE_DATA=true` only for the first installation of the isolated synthetic database. Run `pnpm dev`; use the printed Hono `Local:` URL including its mount path, not Vite's development port. Never commit runtime configuration, passwords or storage. The runtime configuration and storage are ignored by git and excluded from the deployment archive.

The sample provider creates 100 assets, six categories, four departments, eight locations, requests, maintenance orders and stocktakes. It creates `equipment.manager`, `equipment.member`, and `equipment.viewer` with the privately supplied sample password. The latter two are separate ordinary equipment members, so cross-user scope can be tested. The default administrator username is `nocobase`. Obtain passwords from the deployer through a private channel and rotate them for a retained preview. Sample installation is journaled and does not reset existing business data.

## Experience paths

- Home: live totals, status distribution, overdue loans, upcoming warranty expiration and maintenance.
- Asset register: search, status/category/location filters, sort, pagination, create, details, purchase/warranty fields, lifecycle history, CSV preview/import/export.
- Asset details: issue, return, borrow, transfer, repair/maintenance and scrap actions, according to state and permissions.
- My equipment: only records assigned to the current equipment member.
- Movements & requests: members submit requests; equipment managers complete or reject with a resolution.
- Repairs & maintenance: open an order, complete it with a resolution and cost, restore the equipment's prior state.
- Stocktakes: create a location batch, record each physical observation and explicitly resolve differences before completion.
- Reference data: categories, departments and locations; used references cannot be deleted.
- System settings → Users / Permission management: native user and permission-set administration; Member remains removable and provides no implicit equipment grant.
- System settings → Workflow management: native definitions, diagrams and authorized execution history for all four business lifecycles.

The interface supports English and Chinese. A plain Member needs the explicit Equipment member permission set to use equipment business functions. Equipment managers operate all equipment but do not administer accounts or permission sets. Unrestricted administrators administer the application. Server authorization checks record scopes and fields independently from page access. Members cannot read procurement values or another member's equipment history, import or export the register, handle requests or assign roles.

## State and consistency rules

Idle assets may be issued or borrowed. Return clears custody and borrowing dates. Transfer changes department/location and permitted custody fields. Maintenance saves the prior status and returns to it on completion. Scrapped assets cannot re-enter circulation. A single database transaction applies the state, associated business record and lifecycle audit; optimistic versions reject concurrent stale actions. Completing a request or order twice is rejected. Stocktakes reject unresolved differences and changes after completion. CSV imports validate the complete input before one transaction, cannot set status/custody, and cannot bypass lifecycle actions. Export follows authorization and escapes spreadsheet formula prefixes.

## Verification and build

Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`. Tests include state transitions, rollback, invalid input, stale/duplicate actions, scoped fields and records, protected role assignment, role removal with another role retained, roleless password changes/sign-out, and migration up/down. Browser acceptance additionally exercises saved issue/return, CSV import/export, maintenance completion, stocktake observations, user-role append/replace/clear, and narrow layouts.

Run `pnpm build --target linux-x64 --node-version 24 --tar`. The artifact is `storage/exports/dist.tar.gz`; it contains `dist/` and `config.example.yml`, with native production dependencies for Linux x64 / Node.js 24. Data and secrets must be provisioned separately. Verify the SHA256 from the delivery record before uploading. A fresh installation applies schema/permission seeds and optionally regenerates synthetic data. Do not transfer the development database as part of a release.

Pinned important packages: Authentication `2.0.0-beta.15`, Authorization `1.0.0-beta.32`, Users `2.0.0-beta.10`, Skills `0.1.0-beta.51`. The lockfile is authoritative for every transitive version. The template marker alone is not runtime-version evidence.

## Studio preview handoff

The authorized management instance is `https://studio.v2.test.nocobase.com/main`. Its current CLI exposes reading apps/releases and deploying existing releases, but no app-create or release-upload command. Do not work around that boundary with direct requests or another identity. No remote preview is claimed by this source delivery.

An authorized person must use Releases → Apps to create a new isolated equipment App in the `preview` environment, upload the supplied archive through its release upload page, then configure private administrator/sample passwords and enable synthetic data on first deployment. Use a fresh database and storage. Confirm the host is Linux x64 with Node.js 24. Keep authentication required and external integrations unconfigured. Deploy the returned release, or give the App ID and Release ID back so the authorized CLI deployment can be completed. The environment currently accepts archives, needs no additional approval, stops idle apps after 10 minutes and marks them dormant after 24 hours. Its URL pattern is `/{appId}/`; the actual public entry must be obtained and verified after deployment, not inferred as already accessible.

After deployment verify health, login, asset actions, persisted data after restart, role boundaries, static assets and API calls through that actual public URL. An independent whole-application review and remote preview verification remain separate acceptance steps. No real telemetry, email, external finance/purchasing integration, complex approval chain, depreciation, or legacy database migration is included.
