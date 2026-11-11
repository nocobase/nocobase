---
name: nocobase-multi-app-migration
description: 'Use when assessing or migrating an existing NocoBase 3 application into a multi-app arrangement as an external child, a Host-managed child or an in-place platform, while preserving users, permissions and business data.'
argument-hint: '[action: inspect|plan|execute|verify] [workspace-or-application]'
allowed-tools: Read, Grep, Glob, Bash, Write
owner: nocobase
version: 2.1.0
last-reviewed: 2026-11-11
risk-level: high
---

# Goal

Move an existing application into the selected multi-app arrangement without losing business customizations, migration history, users or retained data.

# Scope

Assess external registration, Host-managed migration and in-place platform integration; plan identities/data; rehearse, cut over and recover only with explicit approval.

These scenario Skills ship in `@nocobase/app-skills`. Their presence does not mean an application is Main, has child Apps or has licensed plugins enabled. Inspect the actual project and use this Skill only for its named multi-app task; ordinary business features remain under `nocobase-app-development`.

# Non-Goals

Do not replace an existing application with this template, automatically link users by email, split databases without approval, promise universal volume import, or treat source template generation as data migration.

# Input Contract

| Input                     | Required         | Default and validation                                                                                |
| ------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| Source and destination    | Yes              | `inspect`; resolve actual checkouts, deployments and owners.                                          |
| Route                     | Before mutation  | User selects external, Host-managed or in-place; no automatic cutover.                                |
| Versions and identities   | Yes              | Inventory installed packages, migration owners/checksums and account bindings.                        |
| Data and secret ownership | Before rehearsal | Record databases/files, key references and explicit account/role mapping; never report secret values. |
| Backup and change window  | Before mutation  | A restorable coordinated backup, rehearsal and recovery owner are required.                           |

The multi-app, identity-provider and platform-sso plugins are commercial. Confirm compatible installed versions, a commercial license and package-download access; installing this shared guidance package grants none of them. Read each required installed plugin Skill by name. Missing guidance blocks its integration, not safe inspection; check installation, authorization and synchronization instead of inventing private APIs, fake plugins or repository links.

# Mandatory Clarification Gate

Resolve missing inputs before mutation. Ask at most three focused questions per round and at most two rounds; if unresolved, stop writes and report missing inputs. Reuse decisions already explicit in the task. If the user says “you decide”, default to read-only assessment, isolated test data and a proposed plan; never infer permission to publish, migrate, reset, change identity bindings or expose a public service.

# Workflow

1. Read assessment and inventory the existing App, target platform, customizations, executed migrations, users, account bindings, grants, encryption compatibility, files, jobs and callbacks without mutation.
2. Present the three routes and obtain the user's selection. External registration keeps deployment/data ownership; Host management adds a runtime migration; in-place integration preserves the existing business App.
3. Compare the installed contracts and use nocobase-app-upgrade for required template/framework alignment. Check licensed package availability; never upgrade production just because a source checkout is newer.
4. Read execution and approve a retention/mapping plan, backup, isolated rehearsal and recovery procedure. Load only the installed plugin Skills required by the selected route.
5. Rehearse against restored isolated data. Verify original user IDs, foreign keys, migration checksums, secrets compatibility, attachments and grants; stop on collisions or missing history.
6. Use nocobase-multi-app-deployment for the runtime move. Obtain secondary confirmation, quiesce writers/workers, take the final coordinated backup and perform one approved step at a time with immediate readback.
7. Compare retained data and identities, allowed/denied business operations, callbacks, worker uniqueness and restart persistence. Keep the old deployment stopped but recoverable until explicit acceptance.

# Reference Loading Map

- [Inventory and route selection](references/assessment.md)
- [Retention, rehearsal, cutover and recovery](references/execution.md)

Load each reference only when entering its named stage; plugin interfaces belong to the installed plugin Skills, not these shared scenario files.

# Safety Gate

Require explicit secondary confirmation before publication, deployment, production restart, data restoration, permission elevation, secret changes or cutover: “Confirm execution: {{action}} on {{destination}}; affected instances/data: {{scope}}; backup: {{backup}}; expected impact: {{impact}}. Type `confirm` to continue.” Existing explicit approval covers only its named scope. Read back the result immediately after every write, compare intended and observed state, and stop further effects on discrepancy. Preserve original operation IDs on uncertain outcomes; never bypass a tool refusal or clear control/history rows. Never delete or rewrite merged migrations, rename their ownership, edit history checksums, reset a database or create replacement accounts to hide a failed mapping. A demo instance with fresh data is not a migrated installation.

# Verification Checklist

- Source, destination, selected route and owners are explicit.
- Compatible licensed packages and installed plugin Skills are available.
- Original migrations and their owner/name/checksums remain attributable.
- User IDs, account bindings and foreign-key relations are preserved.
- Business grants and platform admission are mapped separately.
- Database/files/configuration backups have been restored in rehearsal.
- Each approved write has immediate readback and retention comparisons.
- Native recovery login and trusted-HTTPS SSO are tested.
- Unassigned, revoked and downgraded users have the expected direct-API denials.
- Only intended writers/workers run and retained data survives restart.

# Minimal Test Scenarios

1. Register an approved external entry without moving its data or creating Host deployments.
2. Rehearse a Host move with restored data and compare representative user/business relations after restart.
3. Missing backups, historical migrations or identity mappings stop cutover.
4. An incompatible archive or identity collision keeps traffic fenced and invokes the approved recovery decision.
5. Revocation and ordinary-user direct API denial work after migration; an unrestricted administrator alone is insufficient.

# Output Contract

Report the selected workspace/App and mode, source and artifact identities, changes, readback, tests actually run, failures and next actions. Separate static checks, package synchronization, independent artifact execution and live acceptance. Mark unexecuted business, SSO, permission, migration and lifecycle checks pending; never equate a successful command or login page with full acceptance.

# Change Window

Agree the maintenance window and write/worker freeze before production effects.

# Approval Chain

The deployment/data owner approves the exact destination, identity/data plan, public entry and recovery owner. Inspection permission is not mutation approval.

# Rollback Drill

Before cutover, rehearse recovery from coordinated database/files/configuration backups with compatible code. Code rollback is safe only with a compatible resulting schema; otherwise restore the matching backup after explicit approval. Keep the original system fenced from writes until the recovery decision.

# Post-Change Audit

Record operator, source/artifact identities, affected instance/operation IDs, readback, retained-data comparisons, allowed/denied checks and pending evidence without secrets.

# References

- [Inventory and route selection](references/assessment.md)
- [Retention, rehearsal, cutover and recovery](references/execution.md)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html): protocol reference; installed provider contracts determine supported callbacks. [verified: 2026-11-09]
