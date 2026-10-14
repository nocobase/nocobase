# Studio account management and access upgrade

Studio uses Users for account reads, profile changes, enable/disable, password reset and Studio role assignment. Projects invitations remain on Projects. There is no new user system or role hierarchy.

| Old Studio capability   | Replacement                     |
| ----------------------- | ------------------------------- |
| pm.members/read         | user/read and studio.roles/read |
| pm.members/assign       | user/assign-role                |
| pm.members/define-roles | studio.roles/manage             |
| pm.members/invite       | Unchanged                       |

The ordinary account directory excludes directly assigned root identities, service accounts and deleted users on the server. Disabled people remain searchable and can be enabled. A separate system-administrator count explains why direct role holder counts differ from directory totals. Root remains the unrestricted recovery identity. The Users scope rejects root/service targets, requires a direct owner for owner changes, rejects adding roles to disabled users, and keeps the last active protected assignment. Deleted targets follow Users' not-found contract. Old Studio member HTTP endpoints are retired.

## Initial installation and existing instances

The new immutable initial provisioning seed sorts before the historical Studio roles seed. It checks executed seed history and the absence of pre-existing Studio role definitions before creating the initial roles. Only roles actually created by this first provisioning operation get the four new default actions on admin/owner: user/update, user/disable, user/enable and user/reset-password. The historical seed is unchanged. Interrupted installation resumes from the existing ledger; existing or unknown initialization data is never treated as a fresh template.

The later versioned seed maps actual legacy grants on Studio-managed roles. Existing instances do not receive the four new actions automatically. Roles and assignments retain their IDs. Default member, service/key-specific sets, unrelated grants and an explicitly null default role are not rebuilt. Mixed grants retain the invitation action. Restricted or ambiguous legacy grants stop the entire conversion instead of widening scope or leaving two authorization channels.

The role editor replaces only its losslessly representable resource/action subset. Advanced grants and their policy or other fields remain. A cancelled managed action is removed. The editor warns that clearing an ordinary checkbox does not revoke a separate advanced grant.

## Maintenance procedure

No production execution is authorized merely by shipping this code. Before an authorized upgrade, stop old application processes and background writers, block their mutation traffic at the deployment boundary, and drain in-flight requests. The old version cannot understand the new grants; it must not continue to edit roles. Prepare a credentials-free inventory and approve exceptions before applying the upgrade.

Before starting the new server, save the offline inventory with `pnpm nocobase app access-upgrade prepare --json` (or the built CLI equivalent). This command uses the same trusted local operator boundary as `db apply`, registers providers without starting the application, and does not run migrations, seeds or workers. Its inventory can be read before the new migration exists.

Set `studio.accessUpgrade.maintenance: true` in the new application's configuration and use the existing `nocobase db apply` entry. The versioned seed uses the existing task lock, transaction and completion ledger. It performs all preflight checks before changing any role. Existing keys stop the upgrade until their delegation equivalence is resolved; the implementation does not silently revoke them or accept a blanket confirmation flag. Projects invitations are unaffected.

The new server denies business writes during maintenance, while allowing authentication and the specifically authorized recovery endpoint. This does not replace stopping old versions or workers. After conversion, restart every instance to recreate authorization state, reconnect clients, verify denied and permitted requests on each instance, then clear maintenance and reopen traffic. Do not assume a database commit publishes to other processes.

Server checks resolve current grants on each request. Same-instance realtime invalidates client snapshots immediately. Studio also compares a fresh snapshot on focus and every 15 seconds while visible, so a client connected to another instance observes revocation without a shared realtime broker. This gives a bounded UI refresh delay; the server does not rely on that client refresh to deny requests. Polling adds at most four permission snapshot requests per minute per visible client, plus focus checks.

## Recovery and retention

The application-owned `studioAccessUpgradeChanges` collection is not registered for ordinary CRUD. It contains only version/batch, affected role identity, before/after grants and hashes, and assignment/default-configuration verification hashes. It contains no account profiles, passwords, tokens or credential values. Only actually changed roles receive records. Repeated seeding does not rewrite roles or append records.

Reading the recovery endpoint and restoring require studio.roles/manage and a signed-in session. `GET /access/upgrades/pm358` summarizes the recorded changes; `POST /access/upgrades/pm358/restore` also requires maintenance. CLI metadata exposes `access upgrade inspect` and `access upgrade restore`; restoration requests confirmation. Restore locks the recorded roles, checks identity and before/after hashes, refuses the entire operation after any conflicting edit, and restores only recorded grants. It never changes passwords, account state, assignments or default-role settings. A repeated restore is a no-op. Do not roll the journal schema migration down while recovery is promised: its down operation drops the journal and is only for an explicitly authorized schema rollback after a durable backup. Seed history is retained, so restarting cannot reapply the upgrade or restore cancelled permissions. Code rollback requires a compatible version and a continued maintenance boundary.

Retain these records for as long as grant recovery is promised, alongside an access-controlled database backup. This release supplies no automatic cleanup or ordinary deletion API. Deleting records or dropping the collection removes that recovery capability and must be a separately authorized operation after a durable backup and an explicit end to the recovery guarantee. No production cleanup is part of this task.

## Proposed grant supplement for an existing instance

Keep the equivalent legacy conversion separate from a proposed supplement. For each proposal record the instance/build baseline, role ID/key, original grant hash, exact existing and proposed actions, evidence references, narrowing classification, affected subject count, credential delegation differences and approval scope. Recheck the expected hash immediately before an approved change.

Role names, timestamps and similarity to a current template do not prove a role was never narrowed. Reliable evidence requires a historical snapshot or a complete permissions-edit audit chain. Without that evidence mark the role `unknown` and keep its grants. A known manual withdrawal is `narrowed` and also remains unchanged. Even a complete evidence chain requires an explicit decision on the existing-instance supplement.

| Synthetic case                          | Evidence                             | Result                                                                |
| --------------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| R1 named admin, only legacy read        | Audit shows assign was withdrawn     | narrowed; equivalent read mapping only, no supplement                 |
| R2 named owner, matches an old template | Audit chain absent                   | unknown; no new actions                                               |
| R3 already has reset-password           | Complete initialization/edit history | Keep the explicit action; other actions remain an unapproved proposal |
| R4 custom read and invite role          | Known current grants                 | Equivalent read conversion; retain invite; no new account management  |

## Credentials and verification

The four new sensitive actions are session-only in Studio; no new key or Agent delegation is offered. Ordinary unscoped keys, wildcard keys, scoped keys and service keys must be checked independently. Existing scope groups compile the equivalent read/assignment/role-definition actions, but a human role conversion is not proof that a stored service key set is equivalent. Historical sensitive key grants require a separate reviewed transition inventory. General Users invitation authorization timing is unchanged; Projects invitations carry no Studio role scope and retain the default admission chain. Do not export entire credential rows.

Before release, cover direct HTTP individual grants, revocation and multi-role union, cookie/CSRF, scope create/replace/invitation and compatibility denial, owner/target state races, last active assignments, dialect transaction views, migration failure/rollback and interrupted initialization, mixed-version write isolation, two-instance revocation, restoration conflict, Projects invitations, password/session behavior and API keys separately. Validate the UI in both languages, narrow screens, keyboard interaction and failure states. SQL costs and lock behavior must be reported from the test run, not inferred from the existence of a callback.

The authenticated `GET /api/access/upgrades/pm358/prepare` endpoint requires `studio.roles/manage` and a signed-in session. It returns the proposed grant changes, non-secret verification hashes and counts requiring key review. It does not write data or acquire administration locks. The command reference is generated from this route's OpenAPI metadata.

Cross-instance HTTP authorization is resolved against committed database grants on every request. The visible Studio client also refreshes its permission snapshot every 15 seconds and on focus; local realtime notifications remain immediate. An already open socket on another instance is not evidence of continued authorization for a new HTTP request. Session revocation and API key behavior must be tested separately. Maintenance requires stopping and draining old processes and workers at the deployment boundary; the new application's maintenance flag cannot control an old executable.
