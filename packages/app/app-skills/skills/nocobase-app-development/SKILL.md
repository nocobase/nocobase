---
name: nocobase-app-development
description: >-
  Primary entry for building complete NocoBase 3 applications and individual features:
  business and administration pages, lifecycle instance controls, routes, components, endpoints, data, permissions, services, translations, and tests.
  Use this application-local workflow instead of globally installed NocoBase 2
  Skills. For local or published NocoBase 3 plugin packages, use the project plugin development Skill.
metadata:
  short-description: Develop features in a NocoBase 3 application
---

# NocoBase 3 application development

## When this Skill applies

Use it to build a complete application or an individual feature in a NocoBase 3 application: business and administration pages, endpoints, data, permissions, services and their tests.

- Plugin-owned code, whether the plugin stays under this App's `packages/` or is published, follows `<app-root>/.agents/skills/nocobase-app-plugin-development/SKILL.md`, which ships alongside this Skill in `@nocobase/app-skills`. Do not install the older global plugin Skill.
- Upgrading the template this application was generated from, which is also how it moves to a newer NocoBase version, is `.agents/skills/nocobase-app-upgrade/`.
- Deploying is `.agents/skills/nocobase-deployment/`.

Confirm you are in an application: it has `client/runtime.ts`, `server/runtime.ts` and `config.example.yml`. A `client/plugin.ts`, `server/plugin.ts` or `defineServerPlugin()` means a plugin package, where this Skill does not apply.

## Before you start

- Read the application's `AGENTS.md` and the `.agents/rules/` files its index points to for your task.
- Before running any `pnpm nocobase` command, read [the command line](references/cli.md): it maps tasks to commands and names the flags an agent must not add on its own.
- Do not infer capabilities from a template name or from this Skill. Inspect `package.json`, `client/plugins.ts`, `server/plugins.ts`, `cli/plugins.ts`, `server/config/index.ts` and `database/` for what is installed, registered, configured or application-owned. Read [template variants](references/template-variants.md) only when `nocobase.templatePackage` names a documented official template.
- Learn endpoints from the running application's OpenAPI document, not from route sources: `curl -H "x-api-key: <key>" http://127.0.0.1:13000/main/api/swagger` (replace `/main` with `APP_BASE_PATH`; people use `<APP_BASE_PATH>/api/swagger/docs`). Ask the user for an API key rather than creating one. See [HTTP API design](references/http-api.md#api-documentation).

## Delivery principles

- **Deliver what the user asked for.** Add only the minimal administration entry for a capability the feature actually uses (for example the role assignment a new business role needs). Parameter forms, dictionaries, document numbering, operation records and process-diagram configuration are built when the user asks for them; mention them as options in the report otherwise. API-only, UI-only and other explicitly limited requests stay within their scope.
- **Plan frontend and backend together, then build without an approval stop.** For a new application or a feature spanning both sides, identify the users' tasks, pages and key interactions together with the data, endpoint contracts and permissions before implementing either side; [the frontend workflow](references/frontend/ui-workflow.md) says how. Ask early only when a material business rule or scope decision cannot be resolved from the requirements and conventions, when work exceeds authorization, or when the user asked to review first. State reasonable assumptions and continue unaffected work.
- **A feature is done when the user can do the task.** Pages call real endpoints, data saves and refreshes, permissions hold, and loading, empty and failure states are handled. Backend tests or a design document alone are progress. Report what is missing and what could not be verified.
- **Ask before installing.** Registering a plugin, installing a commercial package or adding a dependency the user did not ask for is proposed first; continue independent work while waiting. See [plugins](references/plugins.md) and [commercial package access](references/plugins.md#commercial-package-access).
- **Verify only what you changed.** Scope formatting, lint, type checking, tests, builds and runtime checks to the affected files, packages and their consumers; documentation-only changes need formatting and link checks. Verify observable behavior, not only that commands passed. See [testing and verification](references/testing.md).

## Where a feature belongs

- Build application-specific features directly in the application. Use a plugin when the user asks for one or reuse calls for a separately registered feature; create it under `packages/` with the plugin development Skill. The App builds registered local plugins for deployment without an npm release.
- Ordinary shared code goes in an [internal workspace package](references/dependencies.md#internal-workspace-packages) under `packages/`; the [runnable package example](references/internal-package-example.md) has the complete configuration.
- Business code lives in `client/routes.ts`, `client/pages/`, `client/components/`, `client/hooks/`, `client/locales/`, `client/service-provider.ts`, `server/routes/`, `server/providers/`, `database/main/migrations/`, `database/main/seeds/` and `tests/`. Everything else (`client/routing/`, `client/layouts/`, `client/theme/`, server entry points, build scripts, tsconfigs) is template-provided framework structure; see [application structure](references/app-structure.md).
- Change framework structure only when the built-in mechanism cannot express the requirement: comment what changed and why, and record the application-specific guidance in `.agents/rules/<topic>.md` with its entry in the `AGENTS.md` index. When changing the shell, keep the behaviors in [customizing the shell](references/frontend/references/shell.md#1-behaviors-to-keep).
- Parent/child business flows, scoped references, single-person review and multi-step forms with recoverable drafts have runnable scenarios in the [business example catalogue](references/business-examples.md).

## Use installed capabilities first

NocoBase packages publish Skills that `pnpm nocobase skills sync` copies into `.agents/skills/` (templates run it on `postinstall`; run it if that directory is missing or stale). Confirm a package is a direct dependency or a registered plugin before relying on its Skill, then read that Skill before writing the feature. Hand-building a permission system, notification sender, approval engine or scheduler that an installed plugin provides is the most expensive mistake available here.

- Email, IM, or in-app messages: `@nocobase/app-plugin-notification`
- Knowledge bases, document spaces, search, document review: `@nocobase/app-plugin-knowledge` ([integration](references/plugins.md#knowledge-base-integration))
- Approval processes, joint decisions, approval tasks: `@nocobase/app-plugin-approval` (commercial; [prerequisites](references/lifecycle.md#approval-requests-check-the-pro-plugin-first))
- Roles, permissions, per-user or per-record access, departments: `@nocobase/app-plugin-authorization`
- Sign-in, registration, sessions: `@nocobase/app-plugin-authentication`
- File upload and metadata through Repository: `@nocobase/app-plugin-file`
- File storage, disks, custom drivers: `@nocobase/drive`
- Translated text and language switching: `@nocobase/app-plugin-i18n`
- User administration and role assignment: `@nocobase/app-plugin-users`
- Live updates and replacing business polling: `@nocobase/realtime` (`nocobase-realtime`)
- Reading or writing data, schema changes, migrations: `@nocobase/db` (`nocobase-db`)
- A dedicated demo system with reset and visitor policies: `@nocobase/app-plugin-demo-mode` ([when](references/operations.md#sample-data-and-demo-systems))

A record whose stages are fixed by developers (an expense report, a ticket, a contract, an order) is built with `@nocobase/lifecycle` as [record lifecycles](references/lifecycle.md) describes; simple single-person confirmation stays a lifecycle action. Install, update, customize and remove packages only through `pnpm nocobase plugin register`, `plugin update` and `package remove` ([plugins](references/plugins.md)), never by hand-editing one of the manifest, lockfile, composition roots or synchronized Skills.

## Frontend

Every frontend change follows [the frontend workflow](references/frontend/ui-workflow.md): change an existing page (verify at 1440 and 390 px), or build a new page or module (a short page plan, start from the runnable example, independent acceptance). [UI guidelines](references/frontend/ui-guidelines.md) are the only home of visual and interaction rules. Hard constraints:

- Pages work on a phone by default; lists use `DataTable` with `renderCard`, search with `DataTableSearch`.
- Row actions go in `RowActions`' "⋮" menu; at most two planned primary actions are exposed.
- Forms open in a `RouteDialog` inside a `FeedbackForm` with `values` and `savedValues`, so leaving asks before discarding input.
- Views refresh after a write only through `scopes` and `announceDataChange`.
- Reuse components before writing new ones and run `scripts/check-ui-components.mjs` before delivery ([design contract](references/frontend/design-contract.md)).

## Find the reference for the task

Read the page for the task in front of you, not all of them.

- Anything under `client/`: [frontend workflow](references/frontend/ui-workflow.md), then [the handbook's lookup table](references/frontend/frontend-dev.md#look-up-by-task); phones: [phone experience](references/frontend/mobile.md); browser APIs, UUIDs and copying text over HTTP: [browser API compatibility](references/frontend/frontend-dev.md#browser-api-compatibility).
- Waiting states and submit buttons: [pending feedback](references/pending-feedback.md); duplicate submissions and unknown outcomes: [submission protection](references/submission.md).
- Relation pickers, saving associations, batch assignment: [executable relation and batch example](references/frontend/references/executable-relation-batch.md).
- Add an endpoint, webhook or callback and authorize it: [server routes](references/server-routes.md); name it, shape responses and errors, validate, paginate and document it: [HTTP API design](references/http-api.md).
- Lists, charts and polled endpoints with a fixed number of queries: [server routes](references/server-routes.md#lists-and-statistics-a-fixed-number-of-queries) and [keeping lists live](references/frontend/references/api.md#keeping-lists-and-charts-live).
- Query or write data, transactions: [database and data access](references/database-and-data.md); tables, columns, indexes and seeds: [migrations and seeds](references/migrations.md); switch or add databases: [database connections](references/database-connections.md). The database API itself is the `nocobase-db` Skill; read it before writing a migration, seed or query.
- Business permissions (jobs, teams, confidential data, restricted fields or operations): [application permission development](references/authorization.md) and the authorization plugin Skill. For new business permissions, follow the [role editor setup](references/authorization.md#configure-the-three-tab-role-editor).
- Reusable services, background and scheduled work: [services and jobs](references/services-and-jobs.md).
- Record lifecycles: [lifecycles](references/lifecycle.md), [versions](references/lifecycle-versions.md), administrator-adjustable [parameters](references/lifecycle-parameters.md), management pages and diagrams: [Lifecycle UI](references/lifecycle-ui.md). For requested administrator commands, see [instance controls](references/lifecycle-management.md).
- Administration surfaces and System settings: [system settings](references/system-settings.md), [settings navigation](references/settings-navigation.md), [system administration](references/system-administration.md), [business administration recipes](references/business-administration.md), [setup readiness](references/setup-readiness.md).
- Server-side translations, languages, startup defaults: [internationalization](references/i18n.md) and [languages and startup defaults](references/operations.md#languages-and-startup-defaults).
- Tests and verification: [testing](references/testing.md); CLI commands: [the command line](references/cli.md); new application commands: [adding a command](references/commands.md).
- Files, composition and configuration: [application structure](references/app-structure.md); dependencies and native binaries: [adding a dependency](references/dependencies.md); database configuration factories: [database connections](references/database-connections.md).
- The application URL, restarts, file watching, remote backends: [the development server](references/dev-server.md). Report the `Local:` URL `pnpm dev` prints, with the base path.
- Builds and targets, logging, storage, sample data and demo systems: [operations](references/operations.md).

## Ownership

```text
You own       pages, components, endpoints, tables, migrations, services,
              translations, tests, navigation, theme, business logic
Packages own  their routes, components, tokens, services, internal tables,
              and any skills/ they publish
Generated     .agents/skills/ (synchronized copies, gitignored, never edit) and
              .claude/skills/ (links to them, rewritten by the same sync)
Rules         .agents/rules/ (application-specific guidance, committed; AGENTS.md indexes it)
Config        config.yml (written by pnpm nocobase config init, gitignored, holds
              secrets; document options in config.example.yml)
```

Reach a plugin's capability only through its documented package exports; never import a plugin's internal source or write to its tables. Customize template or registry UI through props and composition first, keeping `client/extensions/` as the reusable baseline. Disabling a feature is reversible by default: guard its route, hide its links and actions, and enforce the same policy on the server ([pages and routes](references/frontend/references/page.md)). Propose changes to synchronized Skills to their source package.

## Non-negotiables

- **Every server route owns its own authentication and authorization.** Mounting under `/api` authenticates nothing.
- **Every `/api` route follows [HTTP API design](references/http-api.md):** camelCase paths, `{ data }` on success, `ApiError` on failure, input validated through `apiValidator()`, and a `describeRoute()` declaration. Never hand-write an error body.
- **A migration is immutable history and self-contained.** Never import an evolving definition into one and never edit a merged one; change the schema with a new migration ([migrations](references/migrations.md#migrations-change-incrementally)).
- **Every user-visible string goes through a translation key**, shadcn/ui primitives' built-in English included. Frontend validation never replaces server-side validation.
- **Role assignments stay explicit and visible.** Assign business roles to explicit users through administration, never to every authenticated identity ([assignment safety](references/authorization.md#visible-and-manageable-assignments)).
- **Visual consistency is application-wide.** Change design tokens, not one page's styles.
- **Route paths never include the deployment base path**; declare sidebar entries with `navigation` in `client/routes.ts`; one `PageContainer` per page ([pages](references/frontend/references/page.md#2-the-page-component)).
- **Tests live in `tests/`,** never beside the source; browser tests go in `tests/playwright/`.
- **Remove direct NocoBase packages with `package remove`** after reviewing their usage.
