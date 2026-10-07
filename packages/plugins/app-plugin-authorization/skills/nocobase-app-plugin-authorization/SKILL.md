---
name: nocobase-app-plugin-authorization
description: 'Design and implement NocoBase 3 business permissions: job responsibilities, pages, business actions, fields, record scopes, relations, team inheritance, permission assignments, administration and inspection. Use when building a system or feature whose users have different access.'
metadata:
  short-description: Design and develop business authorization
  domain-owner: '@nocobase/app-plugin-authorization'
---

# Authorization development

Use the application's existing authorization service. Resolve `authorizationToken` from `@nocobase/app-plugin-authorization/server` in a provider or route factory. Read the application's `AGENTS.md` and inspect registered plugins and `server/config/authorization.ts` first. Application-owned features stay in the application's providers/routes/services; create a reusable plugin only when requested.

## Identify model and configuration changes

Inspect existing declarations, enforcement, permission sets and installed capability Skills. Classify each requested change by its content, whether the feature is new or already exists. A request can require both model development and configuration.

| Requested change                                                                                                                                      | Work required                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Add or change supported operations, field/relation capabilities, scope resolver logic, inheritance resolution or server enforcement                   | Develop the permission model and its execution path, then configure the affected business permissions |
| Change who holds an existing action, select an existing record-access strategy or its supported parameters, or adjust assignments and supported rules | Update permission configuration through the current management UI or authorized services              |
| Existing declarations have the right names but different behavior from the requirement                                                                | Correct the model; matching names alone do not establish that configuration is sufficient             |

For permission development, deliver both the implemented model and usable initial configuration based on the responsibility matrix: permission sets, pages/actions, selected scopes, applicable rules and intended user/team assignments. Do not stop at registration and leave configuration to the user unless they explicitly requested model-only work. If recipient identities or access decisions are missing, ask for those specifics while completing independent work; do not guess assignments. Keep configuration editable in the backend and preserve unrelated administrator choices.

Choose delivery by installation state: use seeds for fresh-install defaults and authorized runtime services or a controlled data-change workflow for an existing installation. These are ways to apply configuration, not alternatives to model development. Reuse current management pages and editors. When the App owns a role editor, build it from the UI Library's `permission-editor` component (`yes n | pnpm exec shadcn add @nocobase/permission-editor`; its example is `@nocobase/permission-editor-demo`), mapping the registered business actions and levels to its sections and rows. Read the relevant references as needed, beginning with the business workflow for model changes and the service/configuration references for configuration changes.

## Start from business responsibilities

Before writing grants, turn the requirement into a matrix: actor/job, page, business action, allowed records, readable/writable fields, relation operations and exceptions. Identify who administers assignments separately from who uses the business feature. Ask only about missing decisions that affect access; record concrete assumptions and continue independent modeling work.

Use jobs as permission sets, such as sales engineer or delivery specialist. Ownership, region and assigned projects are record scopes, not extra role names. A person may hold a direct job plus an inherited team job. Define whether revoking one source should preserve the other. Describe each exception as a business fact: a delegated quote, a confidential project, or an active delivery team.

The sales workflow in [the business module workflow](references/business-module.md) separates quote preparation from regional submission responsibility: an engineer can edit their own out-of-region draft but cannot submit it unless the parent project is also accessible. This is a useful model for multi-table operations; copy the responsibility boundary, not its sample ids.

## Choose the implementation reference

| Task                                                                                                               | Read                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build a feature from model through routes, assignments and verification                                            | [Business module workflow](references/business-module.md)                                                                                                       |
| Declare typed actions, scopes, fields and nested relations                                                         | [Fluent declarations](references/fluent-registration.md)                                                                                                        |
| Bind generated CRUD to business actions or choose a custom business endpoint                                       | [Repository route integration](references/repository-routes.md)                                                                                                 |
| Assign permission sets to departments, positions or another organisation structure                                 | The application development Skill's `references/organization.md`; it builds the organisation first when the application has none                                |
| Design who gets what across departments, department heads and cross-department work                                | The application development Skill's `references/organization/permission-design.md`; the core needs permission sets only                                         |
| Team or department subject registration, default/sharing/restriction design, protected assignments and diagnostics | [Subjects and administration](references/subjects-and-administration.md)                                                                                        |
| Configure a baseline, collaboration exception or exclusion                                                         | Installed sibling `nocobase-app-plugin-authz-default-access`, `nocobase-app-plugin-authz-sharing-rules`, or `nocobase-app-plugin-authz-restriction-rules` Skill |

Read [runtime setup and APIs](references/runtime-api.md) for installation, registration and management endpoints, [client development](references/client-development.md) for routes, buttons and record eligibility, [code versus seeds](references/code-and-seeds.md) before writing installation data, and [request checks and permission-set services](references/core-api.md) for assignments, protection and transaction contracts. The package README at `node_modules/@nocobase/app-plugin-authorization/README.md` is the complete API reference, and `node_modules/@nocobase/authorization/README.md` defines the underlying terms.

This Skill and its bundled references are self-contained: one sales collaboration and delivery domain of projects, quotes and orders runs through them as the worked example. Implement the included patterns in the App's own feature files through public package exports.

Code defines the business permission model; seeds initialize editable business permission configuration. Administrators can subsequently change seeded sets, scopes, rules and assignments in the backend. App features register their own composites and leave platform/system permission configuration to its owning plugins. See [code versus seeds](references/code-and-seeds.md) for the boundary and examples.

Read [optional capability discovery](references/optional-capabilities.md) before using any rule plugin. A missing corresponding Skill means the capability is unsupported in the current App and needs separate development; do not assume its APIs or tables exist.

## Implement in this order

1. Declare schema and relationships through self-contained migrations. Choose stable composite, page and data scope names. Keep authorization decisions out of migration code.
2. Declare reusable collection permissions with `defineDatabasePermission`; compose user-facing business operations as composite resources with `defineCompositeResource` from `@nocobase/authorization/core`. Explicitly name fields, relation capabilities and every collection a workflow touches.
3. In the owning provider's `boot`, opt collections in with `authz.database.collections.add`, register composites with `authz.compositeResources.define`, record access with `authz.recordAccess.define` and settings items with `authz.settings.add`. Then add a workspace subsection with `authz.ui.sections.add({ name, title, parent })` and list each composite or settings item in it with `authz.ui.place(reference, { section, group? })` (the permission workspace lists sections and subsections on the left and the selected subsection's resources, under optional `authz.ui.groups`, on the right; an unplaced composite or settings item goes under its default section's Other with a startup warning, and a misplaced one fails a development start). Pages are not registered on the server: the client route tree lists them. Release subject registrations at shutdown.
4. Protect every server route with authentication. For a simple single-scope Repository operation, keep `defineRepositoryApiRoutes` and add `authz.database.authorizeRepository` to map methods to composite actions; it reuses or initializes the request's authorization context. For workflows, persisted-state checks, multiple data scopes or custom responses, install `authz.middleware()`, call `c.get('authz').authorize()` once and bind every returned collection policy with `repository.withPolicy()`. Follow [Repository route integration](references/repository-routes.md).
5. Declare `authz` on every entry client route (nested pages inherit it; an omitted one defaults to root-only or `'skip'` with a development warning), add `useCan` for action visibility and obtain per-record eligibility from the server when needed. Handle pending and error states without displaying stale access.
6. Complete the accompanying permission configuration from the responsibility matrix: sets, page and action grants, selected data scopes, supported rules and intended assignments. Use seeds for fresh installations and authorized provisioning for existing installations; editing a seed does not update a running App. Resolve optional capabilities through their installed Skills and preserve unrelated administrator edits.
7. Verify denied as well as allowed requests through the production route factory and actual database policies. Then verify the UI with ordinary users and inherited memberships.

## Enforcement rules

- Register collections explicitly with `authz.database.collections.add({ name, title, actions? })`. Metadata comes from the database; registration grants nothing. Unregistered collections are denied even to unrestricted users.
- `settings`, `composite` and `database.collection` are catalog types: a check on an unregistered item or action is denied with `RESOURCE_ACTION_NOT_SUPPORTED`. `page`, `user`, `notification` and Hub types are record types that declare actions only; their grants use `id: '*'` for every record.
- A composite action composes exactly the grants it lists, never another composite. A data scope targets the one collection its grant actions name, whose type must declare `recordAccess` (`database.collection` does). Grant page access separately; a page grant never authorizes a server endpoint.
- `can` is for feature visibility. `require` needs an unconditional permit and rejects conditional decisions. Business endpoints use `authorize`, reject denial or missing policies, and consume `conditions.database` without resolving collection grants again.
- For simple business CRUD, keep the Repository route definition and bind each method to its composite action with `authz.database.authorizeRepository`. Multi-scope actions and workflow transitions need custom handlers. `authz.database.policyFor` folds collection grants; without its third argument it does not respect a business-action boundary.
- Scope every read and write in the workflow, including parent lookups. Keep multi-record writes transactional and include expected business state in mutation predicates. Authorization does not validate a quote's amount or its workflow transition.
- Fields and relation operations are code-owned. The permission workspace configures pages, business actions, their data scopes and settings items; do not build a second raw-field permission editor.
- Relation writes do not inherit the target collection's standalone constraints. Declare target record access and join-table fields explicitly; keep foreign-key fields from bypassing association controls.
- An authorization context caches grants and rules. Reuse one within a request; create a new one for a new request or identity. Do not persist decisions in module state.

## Completion evidence

Report the responsibility matrix implemented, model changes, configuration actually applied or prepared for installation, who can manage assignments, and observed allow/deny outcomes. Distinguish a written seed from one executed successfully; identify any unresolved recipient identities or access decisions. Cover no grant, page-only, action-only, out-of-scope rows, forbidden fields, invalid relation targets, multiple authorization sources and revocation. If optional plugins or required schema are absent, report that concrete limitation; never replace the missing boundary with an unconditional grant.
