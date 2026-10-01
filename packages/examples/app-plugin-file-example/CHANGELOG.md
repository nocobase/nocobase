# @nocobase/app-plugin-file-example

## 0.1.0-beta.13

### Patch Changes

- e77641b: Point plugin guidance at `@nocobase/jobs` for background work, and at the rebuilt `@nocobase/queue` only for what jobs cannot do

  The Scheduler Skill now hands a target's lengthy work to a `JobExecutor` owned by the target's Provider, with the occurrence's own execution record as the reference, so a repeated start of the same occurrence returns the same reference; the job decides and reports its terminal outcome itself, because it cannot tell which executor attempt is the last. Recurring work without administrator visibility goes to a `ScheduleExecutor`, and only a one-time delay goes to a queue. Its description of Scheduler's own backend now names the jobs service and `scheduler.jobs` instead of the removed `queue.queues.schedule` connection. The Notification Skill's diagnostics check the jobs configuration Deliveries run on instead of a queue manager.

  The plugins' `AGENTS.md` list `@nocobase/queue` as a host-owned contract rather than a job registry. The jobs README states that background work goes there by default, the i18n Skill speaks of background jobs rather than queue jobs, and the departments example no longer composes the removed `QueueProvider` in its tests.

- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [e77641b]
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/app-client@1.0.0-beta.24
  - @nocobase/app-server@1.0.0-beta.32
  - @nocobase/app-plugin-file@0.1.0-beta.16
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.12

### Patch Changes

- 41f478f: Cite `lucide-react` instead of `sonner` as the example client peer in the plugin `AGENTS.md`, since plugins report toasts through the application and no longer depend on `sonner`.
- Updated dependencies [db16945]
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/app-plugin-file@0.1.0-beta.16

## 0.1.0-beta.11

### Patch Changes

- dbf5631: Replace guidance that named removed commands and layouts. The Hub's development page names the archive `nocobase build --tar` actually writes, `storage/exports/dist.tar.gz`. The scheduler Skill synchronizes with `pnpm nocobase scheduler sync` instead of `nb3 schedule:sync` and gives the deployed form, `node dist/cli/index.js scheduler sync --finalize`. The repository example applies its migrations and seeds with `nocobase db apply`, the CLI example's Skill matches its manifest and the stdout-only `--json` contract, and the i18n Skill no longer presents `pnpm i18n:check` as the monorepo form of `locales check`. Plugin `AGENTS.md` files carry the current dependency rules from the plugin template.
- Updated dependencies [02d5402]
- Updated dependencies [dbf5631]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/app-plugin-file@0.1.0-beta.15
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.10

### Patch Changes

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-client@1.0.0-beta.20
  - @nocobase/app-plugin-file@0.1.0-beta.15

## 0.1.0-beta.9

### Minor Changes

- 5f92529: Render DOCX, XLSX, and PPTX locally in the editable file Registry components using lazily loaded OOXML viewers and existing content URLs. Preserve legacy Office Online fallback and viewer WASM asset paths in Portal development. Existing applications must merge the updated Registry source and install its declared dependency.

  Correct the file Skill read-field policy for queried records used by Registry UI, and document viewer installation, Vite configuration, content authentication boundaries, and preview verification.

  Demonstrate browser-local DOCX, XLSX, and PPTX previews in the file and order attachment examples, with local-network requirements and download-only legacy format guidance.

### Patch Changes

- Updated dependencies [e0c4b3d]
- Updated dependencies [e13ed84]
- Updated dependencies [5f92529]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [00362cf]
- Updated dependencies [9e3bbee]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
  - @nocobase/db@1.0.0-beta.10
  - @nocobase/app-server@1.0.0-beta.19
  - @nocobase/app-plugin-file@0.1.0-beta.14
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.8

### Patch Changes

- d4ca00e: Use useApiClient() for React API client access across application pages, plugins and shared examples, preserving application-scoped client resolution.
- Updated dependencies [d4ca00e]
- Updated dependencies [365a9fe]
- Updated dependencies [365a9fe]
- Updated dependencies [24e771f]
- Updated dependencies [26ac480]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-plugin-file@0.1.0-beta.13
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.7

### Patch Changes

- 89955c5: Upgrade better-sqlite3 to ^13.0.3 and keep its dependency declaration in @nocobase/db-sqlite only. Remove redundant test dependencies from consumers so they use the same SQLite driver as applications.

  Preserve the bundled musl binary when building applications for Alpine Linux.

- Updated dependencies [89955c5]
  - @nocobase/app-plugin-file@0.1.0-beta.12
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- b34801e: Use plugin-owned PageContainer and PageHeader components to standardize example page spacing, headings, descriptions, and actions.

  Refine example cards, tables, controls, code blocks, and status presentation, and consolidate page descriptions into the shared header.

## 0.1.0-beta.5

### Patch Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- 1a85a86: Add breadcrumb labels to plugin routes so nested pages show their navigation path.
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1a85a86]
- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7
  - @nocobase/app-plugin-file@0.1.0-beta.11
  - @nocobase/app-client@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.4

### Patch Changes

- a2dbe54: Publish only the compiled `dist/database`, no longer the TypeScript sources beside it. The runtime resolves a plugin's declared `database/migrations` and `database/seeds` against the package directory first and its `dist` second, so an installed plugin that shipped both served the sources, and Node refuses to strip types from a file under `node_modules`: `@nocobase/app-plugin-ai-employee` failed every application start with `Stripping types is currently unsupported for files under node_modules` while every development checkout, which resolves the same sources outside `node_modules`, kept working.

## 0.1.0-beta.3

### Minor Changes

- 22b9672: Add one-to-one and one-to-many file relation examples

  The example now owns `fileExampleProfiles` with a single avatar file (unique
  `profileId`) and `fileExampleOrders` with any number of attachments, each with
  its own File Repository resource and seeded demo rows. `/file-repository` became
  a navigation group with three pages: the flat repository page, profile avatars
  (one-to-one) and order attachments (one-to-many).

  Both relation pages upload through a file repository, then connect the returned
  record through the owning business repository's write policy; replacing an
  avatar clears the previous link, and unlinking an attachment leaves the file
  record in the repository. Uploads, lists and previews reuse small App-owned
  components that render images, PDFs and text inline and reject active content.
  The example no longer ships an Agent Skill; its README documents the pages,
  tables and routes, and the core plugin's Skill covers the file services.

### Patch Changes

- ceb356b: Fix published package metadata and database test driver registration.
- 22b9672: Serve the File Repository example at /file-repository

  The example no longer contributes a development-only `/dev/file-repository` page. It now declares `/file-repository` through `defineAppRoutes()` with `auth: 'required'`, so the page shows up in the application navigation, matches the Examples template home card, and is part of a production build. Page access follows the application's page permissions, while the example's Server routes stay public. The File plugin's documentation points at the new path, and its Agent Skill no longer describes the example package; that guidance lives in the example's own Skill.

- ceb356b: Accept string-backed file sizes when formatting attachment metadata.
- ceb356b: Remove the Dameng/DMDB driver from the examples application so its default development configuration uses SQLite without requiring a local DMDB service, and provide a development Docker Compose file for the supported server-backed database dialects. Improve Oracle schema normalization so repeated nullable column changes are skipped across all column types, map integers with enough precision for the full 32-bit range, and accept the application's ISO timestamp seed format.
- c960d07: Replace the Repository API's per-action `writePolicy` with a Repository Policy
  declared once per exposure.

  **Breaking.** `defineRepositoryApiRoutes()` no longer accepts `writePolicy` on
  an action, and every exposure must declare a `policy`. An action configuration
  now says only that an endpoint exists; what it may do is the exposure's Policy,
  which governs reading, creating, updating and deleting together. Declaring one
  is required rather than optional because `writePolicy` defaulted to refusing
  writes while an absent Policy restricts nothing — making it optional would have
  turned every existing declaration from "refuse every write" into "allow
  everything" without a word of warning.

  Declare `policy` as a function of a principal, together with a
  `principal(context)` resolver, to scope rows to the caller. The resolver belongs
  to the application, since this router installs no authentication; one that
  returns nothing refuses the request with 403 `PRINCIPAL_REQUIRED` rather than
  binding a Policy built from a principal that is not there. A fixed Policy is
  still normalized when the routes are defined, so a malformed one fails where it
  is written; a Policy function cannot be, and its `INVALID_POLICY` now reaches
  the host error handler as a server error instead of being reported to the caller
  as a 400.

  `@nocobase/db` gains `buildRepositoryPolicy`, a builder whose unmentioned nodes
  are denied, so the four-node requirement costs nothing to satisfy while the
  default stays refusal. Two related fixes travel with it: `create`, `update` and
  `delete` nodes that are `false` now refuse a write before its payload is read,
  so an empty body is reported as forbidden rather than as invalid input; and a
  `create` node whose relations grant `update`, `upsert`, `disconnect`, `set` or
  `delete` is refused during normalization, since a root create performs none of
  them.

  `@nocobase/app-plugin-file` exposures declare a Policy too, and it reaches
  uploads: the upload path binds a Policy derived from the exposure's, inheriting
  `create.scope` and `create.defaults` and substituting the file columns for the
  field allowlist. A file uploaded under a scoped Policy therefore lands inside
  the scope the same exposure reads from. The public content route under
  `accessPath` is unchanged and deliberately outside it.

  The method-level `writePolicy` option on `db.repository()` calls is unaffected
  and remains available for narrowing a single call.

- Updated dependencies [ceb356b]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [590861e]
- Updated dependencies [e11b855]
- Updated dependencies [72ed008]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [22b9672]
- Updated dependencies [5e17578]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [40e2d49]
- Updated dependencies [590861e]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
  - @nocobase/app-server@1.0.0-beta.11
  - @nocobase/app-client@1.0.0-beta.14
  - @nocobase/db@1.0.0-beta.5
  - @nocobase/app-plugin-file@0.1.0-beta.10

## 0.0.2-beta.2

### Patch Changes

- 5a891d7: Replace the File plugin's legacy backend and client protocol with File Repository services, multipart uploads, and configurable content routes. Preserve its editable Registry components and adapt them to ClientFileRepository and contentUrl. Remove the separate File Repository package, rename its example to app-plugin-file-example, and update application registration and Agent integration guidance.

  This is a breaking replacement of the old File API: access-token routes, inventory settings, FilesClient, and runtime component exports are removed. Applications own file collections and route security; metadata deletion retains storage objects. The example migration remains unchanged.

  Keep the File core in Default and the core plus app-plugin-file-example in Examples. Preserve Hub without a default File registration.

  Require the unified API version for Registry components, preserve PDF previews across cross-origin storage redirects, and normalize database file sizes to safe numeric values without treating custom record or records fields as response envelopes.

- Updated dependencies [e3fa827]
- Updated dependencies [c3e02bf]
- Updated dependencies [0a3fa83]
- Updated dependencies [1d042c0]
- Updated dependencies [5a891d7]
  - @nocobase/app-server@1.0.0-beta.9
  - @nocobase/app-client@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.4
  - @nocobase/app-plugin-file@0.1.0-beta.9

## 0.0.2-beta.1

### Patch Changes

- 52d1107: Declare each peer dependency once, dropping the devDependency that used to accompany it.

  The pairing was required on the grounds that a peer range is wide enough for development to drift off this repository's copy. It is not: pnpm installs a peer and links it into the plugin's own `node_modules`, resolving `workspace:^` to the same package `workspace:*` would. A plugin with the devDependency removed still links, typechecks, builds, and tests against it — verified against a clean install with every plugin's `node_modules` deleted first.

  What remained was a second declaration that changed nothing and had to be kept in step with the first. `pnpm peers:check` no longer asks for it, and `create-plugin` no longer emits it.

- Updated dependencies [52d1107]
  - @nocobase/app-plugin-file-repository@0.0.2-beta.1

## 0.0.2-beta.0

### Patch Changes

- 5281fd1: Add File Repository Client and Server services, multipart uploads and configurable stream/redirect route helpers. Keep the attachments migration, concrete API configuration and development page in a separate example plugin, and register both plugins in the default application.
- Updated dependencies [d29d1fe]
- Updated dependencies [5281fd1]
  - @nocobase/app-server@1.0.0-beta.8
  - @nocobase/app-plugin-file-repository@0.0.2-beta.0
  - @nocobase/app-client@1.0.0-beta.11
  - @nocobase/db@1.0.0-beta.3
  - @nocobase/i18n@1.0.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

### Patch Changes

- Demonstrate the File Repository core plugin with an attachments migration, concrete upload/content routes, and a development page.
