---
name: nocobase-multi-app-deployment
description: 'Use when building, explicitly initializing, deploying or operating a NocoBase 3 multi-app platform, including hosted releases, selective upgrades, retained storage and recovery. Not for plugin API implementation.'
argument-hint: '[action: inspect|plan|execute|verify] [workspace-or-application]'
allowed-tools: Read, Grep, Glob, Bash, Write
owner: nocobase
version: 2.1.0
last-reviewed: 2026-11-11
risk-level: high
---

# Goal

Deliver and operate the selected Main and child applications using compatible independent artifacts, stable identities and retained storage.

# Scope

Local account development, explicit plan-based initialization, independent builds, production deployment, template/version operations, selective upgrades, backups and recovery.

These scenario Skills ship in `@nocobase/app-skills`. Their presence does not mean an application is Main, has child Apps or has licensed plugins enabled. Inspect the actual project and use this Skill only for its named multi-app task; ordinary business features remain under `nocobase-app-development`.

# Non-Goals

Do not treat source audits or emitted files as a complete independent deployment build, run initialization on every restart, publish fixed demonstration versions, infer addresses from defaults, or claim lifecycle control over independently hosted external applications.

# Input Contract

| Input                        | Required            | Default and validation                                                                            |
| ---------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| Action and target            | Yes                 | `inspect`; distinguish first initialization, start, update and recovery.                          |
| Sources and artifacts        | Before build/deploy | Record exact identities/checksums and target OS/CPU/libc/Node compatibility.                      |
| Public entry and processes   | Before startup      | Identify process ownership, listeners, base paths and an authorized trusted HTTPS origin for SSO. |
| Persistent state             | Before mutation     | Resolve databases, volumes, artifact/control metadata and stable key references.                  |
| Plan, approvals and recovery | Before effects      | Explicit artifact/instance selection; backup and change window for existing data.                 |

The multi-app, identity-provider and platform-sso plugins are commercial. Confirm compatible installed versions, a commercial license and package-download access; installing this shared guidance package grants none of them. Read each required installed plugin Skill by name. Missing guidance blocks its integration, not safe inspection; check installation, authorization and synchronization instead of inventing private APIs, fake plugins or repository links.

# Mandatory Clarification Gate

Resolve missing inputs before mutation. Ask at most three focused questions per round and at most two rounds; if unresolved, stop writes and report missing inputs. Reuse decisions already explicit in the task. If the user says “you decide”, default to read-only assessment, isolated test data and a proposed plan; never infer permission to publish, migrate, reset, change identity bindings or expose a public service.

# Workflow

1. Read the project README, the target App's build-and-deploy rules and installed nocobase-deployment Skill. Identify source revisions, installed versions, listeners, existing processes and intended instance states.
2. Read local-startup for first configuration versus resuming existing state. For a shared workspace install once at the root; configure root Main and children individually. Other source layouts keep their actual App roots. Never start a second process on the same database or volume.
3. Read production-release before building or publishing. Build each App independently; verify its separate dist production dependency installation succeeds, and run an extracted artifact outside the source workspace.
4. When the application provides demo helpers, initialize examples only through an explicitly approved demo plan; do not assume every application ships those helpers. Validate all artifact paths and embedded versions before mutation; ordinary demo/dev/start must not publish, reset or upgrade instances.
5. Use nocobase-app-plugin-multi-app for templates, instances, receipts/revisions and recovery. Use the installed identity-provider/platform-sso Skills for enrollment and SSO. Discover live endpoints from the authenticated API document, not guessed routes.
6. Read recovery before retries, origin changes or restoration. Preserve uncertain operation identifiers and inspect completed runtime effects before creating another request.
7. After each approved write, read back state and compare observed runtime behavior. Verify the actual public entry, assets, business writes, denied access, explicit stop/start, idle wake and retained data across Main/Host restart before declaring deployment accepted.

# Reference Loading Map

- [Configuration, explicit initialization and ordinary restart](references/local-startup.md)
- [Separate App artifacts, release and acceptance](references/production-release.md)
- [Uncertain operations, origin changes and coordinated recovery](references/recovery.md)

Load each reference only when entering its named stage; plugin interfaces belong to the installed plugin Skills, not these shared scenario files.

# Safety Gate

Require explicit secondary confirmation before publication, deployment, production restart, data restoration, permission elevation, secret changes or cutover: “Confirm execution: {{action}} on {{destination}}; affected instances/data: {{scope}}; backup: {{backup}}; expected impact: {{impact}}. Type `confirm` to continue.” Existing explicit approval covers only its named scope. Read back the result immediately after every write, compare intended and observed state, and stop further effects on discrepancy. Preserve original operation IDs on uncertain outcomes; never bypass a tool refusal or clear control/history rows. Do not ship configuration, credentials, databases, instance secrets or volumes in a release archive. Preserve intentionally stopped instances. Never weaken TLS, OAuth, cookie or CSRF checks, or apply an old Host patch just to pass a guard.

# Verification Checklist

- Action, exact target and operator authorization are recorded.
- Installed licensed dependencies and plugin guidance are compatible.
- Main and Sub each pass their own required checks and real build.
- The deployment archive has complete production dependencies and no runtime secrets/data.
- An extracted archive works away from source repositories on the actual target platform.
- Plan paths, package/version/checksum and selected instance IDs are valid.
- Ordinary restart retains existing versions, membership and settings.
- Trusted-HTTPS browser SSO and an ordinary business read/write succeed.
- Anonymous and unauthorized direct APIs are denied.
- Explicit stop cannot wake on requests; start, idle wake and Main/Host restart preserve data and isolation.

# Minimal Test Scenarios

1. Resume an existing configured deployment without initialization, publication or instance reset.
2. Initialize an approved isolated demo from one valid immutable child archive and verify readback.
3. A missing plan, mismatched archive version or wrong target platform stops before deployment.
4. A lost response is reconciled by the original operation identity rather than a duplicate effect.
5. An unassigned user is denied; intentionally stopped instances remain stopped on direct requests.

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

- [Configuration, explicit initialization and ordinary restart](references/local-startup.md)
- [Separate App artifacts, release and acceptance](references/production-release.md)
- [Uncertain operations, origin changes and coordinated recovery](references/recovery.md)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html): protocol reference; installed provider contracts determine supported callbacks. [verified: 2026-11-09]
