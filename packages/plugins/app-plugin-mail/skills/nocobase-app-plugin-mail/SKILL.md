---
name: nocobase-app-plugin-mail
description: Use when integrating the NocoBase 3 Mail plugin into an application: configure Gmail, Microsoft 365, or IMAP/SMTP accounts, embed mail UI, send from business code, or diagnose synchronization and delivery.
argument-hint: "[action: inspect|configure|integrate|send|diagnose] [target]"
allowed-tools: Read, Grep, Glob, Bash
owner: mail-plugin-team
version: 1.1.2
last-reviewed: 2026-09-26
risk-level: medium
---

# Goal

Provide a safe, contract-first workflow for integrating the installed `@nocobase/app-plugin-mail` package into a NocoBase 3 application and validating the requested behavior.

## Contents

- [Scope](#scope)
- [Input Contract](#input-contract)
- [Mandatory Clarification Gate](#mandatory-clarification-gate)
- [Workflow](#workflow)
- [Reference Loading Map](#reference-loading-map)
- [Safety Gate](#safety-gate)
- [Rollback Guidance](#rollback-guidance)
- [Verification Checklist](#verification-checklist)
- [References](#references)

# Scope

This Skill covers application composition, provider configuration, account connection, production mail UI, business-code sending, drafts, attachments, synchronization, and delivery diagnostics. Use the installed package's public Client, Server, and HTTP contracts; versions may differ from the references.

# Non-Goals

Do not change the Mail plugin implementation from an application integration task, access private stores or database tables directly, configure notification delivery, authorize an external mailbox without the user's approval, or claim that mocked checks prove live provider delivery.

# Input Contract

| Input        | Required | Default  | Validation                                                                                                                                |
| ------------ | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `action`     | yes      | none     | One of `inspect`, `configure`, `integrate`, `send`, or `diagnose`. Stop and ask when absent or outside the enum.                          |
| `target`     | yes      | none     | Application path, installed package path, route, provider, account, or failure identifier relevant to `action`. Stop and ask when absent. |
| `provider`   | no       | `auto`   | One of `gmail`, `microsoft`, `imap-smtp`, or `auto`; `auto` means infer only when the target identifies one provider.                     |
| `scope`      | no       | `local`  | One of `local`, `authorized-test`, or `production`; live mailbox mutations require explicit `authorized-test` or `production` scope.      |
| `validation` | no       | `static` | One of `static`, `mocked`, or `live`; never imply `live` when credentials or an authorized environment are unavailable.                   |

# Mandatory Clarification Gate

Before any mutation, confirm that `action`, `target`, and the intended `scope` are present and valid. If a required value is missing, stop and ask rather than guessing. Clarification is bounded to max clarification rounds=2 and max questions per round=3.

When the user says “you decide”, use `provider=auto`, `scope=local`, and `validation=static`; do not connect an account, send mail, mutate a mailbox, or change production configuration under those defaults. For an ambiguous provider, inspect the installed configuration first, then ask if more than one provider remains possible.

# Workflow

1. Inspect the installed package version, public exports and types, application `client/plugins.ts`, `server/plugins.ts`, and relevant configuration before editing.
2. Select the smallest matching reference from the loading map. Read additional references only when the task crosses their boundary.
3. Check ownership and permissions. The application owns registration, provider configuration, role grants, business associations, and page composition; Mail owns accounts, authorization, submissions, sync runs, cursors, and background job and outbox orchestration.
4. Implement through public components, service tokens, and HTTP APIs. Resolve `mailServiceToken` or `mailClientToken` instead of constructing internal stores or runtimes.
5. Before live account or mailbox operations, restate the target provider, account or mailbox, operation, and authorized scope. Proceed only when the input contract and gate are satisfied.
6. Validate the result with the checklist below and the relevant reference. Separate static checks, mocked provider checks, and live provider results.
7. For every write, read the changed configuration, generated file, API response, or returned operation status immediately and compare it with the requested state.
8. Report unavailable external validation, uncertain provider acceptance, and any remaining follow-up instead of presenting them as successful delivery.

# Reference Loading Map

| Task                                                                                                                   | Read                                                                             |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Register Mail, configure provider quotas, connect an account, configure OAuth/push, or replace credential storage      | [Configuration and accounts](references/configuration-and-accounts.md)           |
| Embed a production workspace, connect business records, customize reading/composition, or add management and log pages | [Client integration](references/client-integration.md)                           |
| Send from business code, manage drafts or attachments, schedule or bulk-send, or handle uncertain delivery             | [Sending and drafts](references/sending-and-drafts.md)                           |
| Set an initial sync boundary, handle Gmail quota errors, recover synchronization, or diagnose stalled tasks and logs   | [Synchronization and diagnostics](references/synchronization-and-diagnostics.md) |

# Safety Gate

Do not expose credential values in logs, reports, screenshots, or test output. The default credential vault stores plain JSON in the database; promise encryption only when an application-supplied vault is configured.

Treat `accepted` as provider acceptance, not recipient delivery; `unknown` may mean the provider already sent the message. Do not retry an uncertain submission until the sending reference and provider state have been checked.

For destructive or external actions, keep the operation reversible where possible. If a configuration write is wrong, restore the read-back value from the prior snapshot and report the rollback. If a mailbox mutation is wrong, stop further mutations and use the provider's supported move, restore, or deletion-recovery operation; do not edit Mail tables directly. See Rollback Guidance below.

# Rollback Guidance

High-impact actions include account connection, mailbox mutation, credential replacement, and production configuration writes.

For a wrong configuration write, stop dependent work, restore the previous value from the captured snapshot, read it back, and report the restored state. For a wrong account or mailbox mutation, stop further mutations, use the provider-supported restore or move operation, read the resulting operation status, and report any provider-side recovery that remains unavailable. Never repair state by editing Mail tables directly.

# Minimal Test Scenarios

1. Normal: inspect an installed Mail package and select the matching reference.
2. Normal: configure or integrate one provider through public contracts and verify the resulting state.
3. Missing input: omit `action` or `target` and confirm that the workflow stops and asks for clarification.
4. Failure: use an unsupported provider or insufficient permission and confirm that the operation is denied without a write.
5. Authorization: run a live account or mailbox operation only with explicit authorized scope, or record that live validation is unavailable.

# Verification Checklist

- [ ] The installed Mail package version and public contract were inspected.
- [ ] The selected provider and target application or account match the input contract.
- [ ] Client and Server registration were checked in their composition roots.
- [ ] The requested permission scope was checked, including account ownership.
- [ ] Provider capabilities were checked before exposing unsupported actions.
- [ ] Static configuration or type validation passed.
- [ ] Mocked provider checks passed when provider behavior changed.
- [ ] A live operation was run only with an explicit authorized scope.
- [ ] Every write has an immediate read-back or operation-status check.
- [ ] An allowed case and a denied or missing-input case were verified.
- [ ] Credentials and access tokens are absent from captured output.
- [ ] External authorization, delivery, background job processing, and production availability are reported separately from local evidence.

Minimum scenarios: a normal local inspection; a normal configured or integrated path; missing required input; invalid provider or permission; and an authorized live operation or an explicit record that live validation is unavailable.

# References

- [Configuration and accounts](references/configuration-and-accounts.md)
- [Client integration](references/client-integration.md)
- [Public API inventory](references/public-api.md)
- [HTTP API](references/http-api.md)
- [Sending and drafts](references/sending-and-drafts.md)
- [Synchronization and diagnostics](references/synchronization-and-diagnostics.md)
