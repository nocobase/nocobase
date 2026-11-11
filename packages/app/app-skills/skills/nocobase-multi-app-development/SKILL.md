---
name: nocobase-multi-app-development
description: 'Use when creating a NocoBase 3 multi-app platform or developing and connecting Main and child applications, including independently developed children. Not for migrating existing business data or operating production.'
argument-hint: '[action: inspect|plan|execute|verify] [workspace-or-application]'
allowed-tools: Read, Grep, Glob, Bash, Write
owner: nocobase
version: 2.1.0
last-reviewed: 2026-11-11
risk-level: medium
---

# Goal

Develop a new platform workspace or child application with independent code, data, identity and release boundaries.

# Scope

Create from the released multi-app template or an explicitly identified candidate; develop Main and Sub under their own application guidance; choose hosted versus external children and hand off deployment.

These scenario Skills ship in `@nocobase/app-skills`. Their presence does not mean an application is Main, has child Apps or has licensed plugins enabled. Inspect the actual project and use this Skill only for its named multi-app task; ordinary business features remain under `nocobase-app-development`.

# Non-Goals

Do not overwrite populated installations, move production data, assume every child must live in this workspace, or implement a second identity/deployment engine. Use nocobase-multi-app-migration for existing data and nocobase-multi-app-deployment for releases.

# Input Contract

| Input                         | Required                     | Default and validation                                                             |
| ----------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| Action and target             | Yes                          | `inspect`; identify a new workspace or the exact existing App path.                |
| New versus populated          | Yes                          | No writes until confirmed; populated applications route to migration.              |
| Business and child boundaries | For implementation           | Record users, data owners and hosted/external intent; propose only when undecided. |
| Versions and package access   | For installation/integration | Read manifests/lockfile and confirm compatible licensed packages.                  |
| Test environment              | For runtime checks           | Isolated data/ports; trusted HTTPS required for platform SSO.                      |

The multi-app, identity-provider and platform-sso plugins are commercial. Confirm compatible installed versions, a commercial license and package-download access; installing this shared guidance package grants none of them. Read each required installed plugin Skill by name. Missing guidance blocks its integration, not safe inspection; check installation, authorization and synchronization instead of inventing private APIs, fake plugins or repository links.

# Mandatory Clarification Gate

Resolve missing inputs before mutation. Ask at most three focused questions per round and at most two rounds; if unresolved, stop writes and report missing inputs. Reuse decisions already explicit in the task. If the user says “you decide”, default to read-only assessment, isolated test data and a proposed plan; never infer permission to publish, migrate, reset, change identity bindings or expose a public service.

# Workflow

1. Read the project README, root and target App `AGENTS.md`, and the target's installed `nocobase-app-development` Skill. Inspect manifests, registrations and the working tree before editing; do not infer capabilities from the installed Skills.
2. Read project-boundaries. For a new platform, check release availability before using the public create-app alias. The commercial template creates Main only. Add independent children on demand in `apps/<name>` or separate repositories; no child is pre-generated. Install once at the root; configure and synchronize Skills for root Main and each child. Existing layouts follow their actual manifests, not an assumed directory move.
3. Record Main-owned and child-owned concerns and choose hosted versus external delivery. Keep package names separate from persistent template, instance, permission and migration identities.
4. Read child-development. Develop with isolated data and native local login first. Use public plugin factories and the child's own role policy, not a copied demonstration entitlement.
5. After each source/configuration write, read back the diff or effective safe settings; run scoped tests and compare expected behavior. A framework-layer change shared by both Apps belongs in both applicable compositions.
6. Use nocobase-multi-app-deployment for artifact publication and runtime operations. Verify trusted-HTTPS SSO, explicit membership, ordinary-user business grants and denied direct APIs before claiming integration works.

# Reference Loading Map

- [Workspace creation and responsibility boundaries](references/project-boundaries.md)
- [Child development, local login and platform integration](references/child-development.md)

Load each reference only when entering its named stage; plugin interfaces belong to the installed plugin Skills, not these shared scenario files.

# Safety Gate

Confirm before deleting example source, changing permissions or persisted identities, publishing, deploying or changing public infrastructure. Source cleanup never deletes retained migrations or instance volumes. Do not assign unrestricted or business roles to every authenticated user. On failure stop, retain a safe source rollback, and inspect persisted effects before retrying.

On a tool/security refusal, stop the refused operation, report the blocker and continue only independent authorized work. Do not change paths, credentials or tooling to bypass the refusal.

# Verification Checklist

- The workspace/App and new-versus-populated state are explicit.
- Installed framework/plugin versions and commercial prerequisites are known.
- The root Main and each child own separate configuration, runtime state and independent builds.
- Shared scenario Skills and plugin guidance are synchronized from compatible installed packages per App.
- Package identity is stable and distinct from persisted business IDs.
- Every write has source/effective-state readback and scoped tests.
- Local login and an ordinary user's business operations work.
- Trusted-HTTPS SSO and explicit membership work.
- Anonymous, unassigned and revoked users are denied by direct APIs.
- Hosted instances retain separate data through restart; pending checks are reported.

# Minimal Test Scenarios

1. Create an approved empty workspace; verify both Apps and per-App configuration instructions.
2. Develop a separate child; deliver its own artifact or external entry without importing Main source.
3. A populated target routes to migration before source overwrite or database writes.
4. An unavailable commercial dependency or missing plugin Skill stops integration with an actionable prerequisite report.
5. An unassigned user and a user lacking business grants are denied even if a navigation link is visible.

# Output Contract

Report the selected workspace/App and mode, source and artifact identities, changes, readback, tests actually run, failures and next actions. Separate static checks, package synchronization, independent artifact execution and live acceptance. Mark unexecuted business, SSO, permission, migration and lifecycle checks pending; never equate a successful command or login page with full acceptance.

# References

- [Workspace creation and responsibility boundaries](references/project-boundaries.md)
- [Child development, local login and platform integration](references/child-development.md)
