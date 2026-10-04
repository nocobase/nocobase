---
name: nocobase-app-plugin-notification-in-app
description: 'Use when agents need to register, verify, or diagnose the NocoBase durable in-app inbox, its development-only Client page, or realtime refresh behavior.'
argument-hint: '[action: register|verify|diagnose] [application]'
allowed-tools: Bash, Read, Write, Grep, Glob
owner: notification
version: 1.0.0
last-reviewed: 2026-09-03
risk-level: medium
---

# Goal

Integrate and maintain the authenticated, user-isolated in-app inbox while keeping durable HTTP state authoritative and realtime events limited to invalidation.

# Ownership and Placement

This Skill is published with `@nocobase/app-plugin-notification-in-app`. The plugin owns its Server runtime, persistence, APIs, realtime contract, Client inbox components, and development-only page. The target application owns whether both Client and Server entries are registered.

# Scope

- Register the Client and Server plugin entries and the core notification dependency.
- Open and verify the plugin-owned inbox example under the built-in Dev Route.
- Consume the public realtime topic and event types from the `/realtime` package entry.
- Verify or diagnose inbox HTTP access, mutations, user isolation, and reconnect refresh.

# Non-Goals

- Do not replace durable notifications with transient browser toasts.
- Do not edit inbox tables directly or publish forged realtime events as notification state.
- Do not expose the Dev Route as a production inbox page.

# Input Contract

| Input         | Required | Default                                                            | Validation                                                     | Clarification Question                                          |
| ------------- | -------- | ------------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------- |
| `action`      | yes      | `verify` for existing code; `register` for a new target            | `register/verify/diagnose`                                     | "Should I register, verify, or diagnose the inbox?"             |
| `application` | yes      | infer from one unambiguous workspace application                   | application root with Server and Client configuration          | "Which application should register the inbox plugin?"           |
| `apiConfig`   | no       | the target application's injected `ApiClient` and `RealtimeClient` | authenticated client with the intended `baseURL`/`realtimeURL` | "Should this application use its default or a custom API host?" |

Rules:

- Resolve package versions and enabled plugins from the target application before changing source.
- Register the package's public `/client` and `/server` entries; do not import implementation files.
- If the target application is ambiguous, stop mutation and ask.

# Mandatory Clarification Gate

- Max clarification rounds: `2`.
- Max questions per round: `3`.
- Read-only inspection and diagnosis may proceed when the application is unambiguous.
- Missing required input blocks mutation; report the missing contract instead of guessing.

# Workflow

1. Read [Inbox Integration Contract](references/inbox-integration.md) for package requirements, public surfaces, and runtime semantics.
2. Inspect the target application's Server plugin list, Client composition, authentication setup, `api.baseURL`, `api.realtimeURL`, and installed package versions.
3. Register `@nocobase/app-plugin-notification` before `@nocobase/app-plugin-notification-in-app/server` when the application needs the `in-app` Channel contribution.
4. Register `@nocobase/app-plugin-notification-in-app/client` in the Client composition root. In a development build, verify the page at `/dev/notification-in-app` relative to the App base path.
5. In React components and custom Hooks, use `useApiClient()` from `@nocobase/app-client` for inbox reads and mutations, and `useService(realtimeClientToken)` for subscriptions. Outside React, resolve the corresponding tokens from the application's services or receive the clients explicitly. Do not reconstruct `/api` from the browser location or Portal base.
6. Keep HTTP state authoritative. On a validated `inbox.changed` event, realtime connection open, or window focus, trigger a bounded HTTP refetch.
7. Use the public `@nocobase/app-plugin-notification-in-app/realtime` entry for shared topic or event types; do not import Server internals.
8. Test allowed and denied users, mutations without a CSRF token, cross-site cookie writes rejected with `INVALID_CSRF_ORIGIN`, pagination, custom API hosts, realtime invalidation, reconnect recovery, and Dev Route registration.
9. Run lint, typecheck, tests, and build for the plugin and affected application.

# Reference Loading Map

| Reference                                                     | Use When                                                                                     | Notes                                               |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [Inbox Integration Contract](references/inbox-integration.md) | integrating, customizing, verifying, or diagnosing the inbox                                 | Required packages, routes, events, ownership, tests |
| [Plugin README](../../README.md)                              | confirming Server registration, route behavior, pagination, origin checks, or user isolation | Package-level public contract                       |

# Safety Gate

- Inbox mutations affect a real user's durable notification state. Confirm the target user/session before mutation testing outside an isolated test application.
- Never log session cookies, notification bodies, or recipient identifiers.
- Use authenticated routes and preserve the Server's per-user filters; do not add a client-supplied user override.
- A realtime event is only an invalidation signal. Never render its payload as authoritative inbox content.
- Require explicit secondary confirmation before bulk mark-read/delete operations against production data.

Secondary confirmation template:

- "Confirm execution: {{mutation}} for {{user/application}}. Expected impact: durable inbox state will change for {{scope}}. Reply `confirm` to continue."

Rollback guidance:

- Revert application registration changes through version control and restore the previous Client/Server composition.
- For an unintended read-state mutation, call the authenticated `POST /api/notificationInApp/messages/{messageId}/markUnread` when the affected message ids are known; deleted inbox items are not restored by this package.
- If realtime refresh regresses, keep the HTTP page usable and remove only the faulty subscription integration while preserving durable routes.

# Verification Checklist

- The target application and package versions are identified.
- Authentication, database, core notification, and in-app notification Server plugins are registered as required.
- The package's Client entry is registered and contributes `/dev/notification-in-app` in development.
- The Dev Route and page module are absent from production builds.
- The page-local Provider mounts only while the inbox page is open.
- HTTP calls use the injected `ApiClient` and honor custom `api.baseURL` configuration.
- Realtime connects through the configured application client and uses the public topic constant.
- Realtime connection open, valid invalidation events, and window focus refetch durable state.
- Malformed or unrelated realtime payloads do not alter inbox state.
- Reads and writes remain scoped to the authenticated user.
- Mutations send no CSRF token; anonymous requests and cookie-authenticated writes from an untrusted origin are denied by the authentication plugin.
- Pagination passes `meta.nextPageToken` back as `pageToken` unchanged, treats it as opaque, and preserves stable ordering.
- Plugin and application lint, typecheck, tests, and builds pass.

# Minimal Test Scenarios

1. Happy path: an authenticated user lists messages, reads one item, and observes the unread count decrease.
2. Custom host: an application with a non-default API base sends inbox HTTP and WebSocket traffic to its configured backend.
3. Recovery: a reopened realtime connection refetches durable unread state even when no event arrived while offline.
4. Isolation and safety: another user cannot read or mutate the first user's item, and a cookie-authenticated write from an untrusted origin is rejected with `INVALID_CSRF_ORIGIN`.
5. Invalid input: a malformed `pageToken`, an out-of-range `pageSize`, or an unrelated realtime payload is rejected or ignored without corrupting displayed state.

# Output Contract

Final response must include:

- Requested action and resolved application.
- Server registration, Client registration, route/Provider, and API/realtime changes as separate items.
- Whether any durable user state was mutated and for which confirmed scope.
- Validation commands and results, including the target application checks.
- Defaults or assumptions applied, remaining integration gaps, and exact recovery steps for failures.

# References

- [Inbox Integration Contract](references/inbox-integration.md): use for the complete application integration and diagnosis contract.
- [Plugin README](../../README.md): use for Server registration, API, pagination, origin-check, and user-isolation behavior.
