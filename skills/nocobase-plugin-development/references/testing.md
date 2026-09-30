# Testing and Delivery

Use this reference to select checks for the changed behavior and its target App integration. Plugin tests belong in the plugin-root `tests/` directory and use `*.test.ts` or `*.test.tsx`; they must stay out of published build output.

## Select observable checks

| Changed surface           | Verify                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Client descriptor/options | Resolved contribution entries, option propagation, intentional defaults                                                   |
| Routes and Tabs           | Paths, parents, navigation/access, actual lazy loaders, direct URLs, reload, history, parent redirect, query preservation |
| Components                | Props, interactions, accessibility, public exports, target App rendering and themes                                       |
| React Providers           | Context values, composition order, cleanup, App-owned consumers                                                           |
| Client ServiceProviders   | Service/Refine registration, options, lifecycle, startup failure and reverse cleanup                                      |
| Server Services/Providers | Original Token, lazy singleton behavior, lifecycle, failure cleanup                                                       |
| HTTP contributions        | Production router requests, validation, status/body, authentication, allowed and denied authorization paths               |
| Migration/Seed            | Real database schema and metadata, `up`, reversible `down`, required records and repeat behavior                          |
| Jobs                      | Registration before setup, execution, payload, service effects, retry/idempotency, interrupted shutdown                    |
| Queues                    | Handler execution, message, service effects, failures, retry/idempotency, unregister on shutdown                          |
| Locales                   | Key shape, namespaces, two-language rendering, request/recipient locale selection, lazy chunks                            |
| Registry                  | Config/build, copied source, App typecheck/test/build and actual integration                                              |
| CLI                       | Registration, command IDs, flags, errors, target App help/command execution                                               |
| Plugin Skills             | Valid structure, source/sync ownership, actual integration outcome                                                        |
| Exports/publishing        | Source and dist exports, consumer-resolvable declarations, tarball resources                                              |

Test actual behavior rather than only module existence or generated strings. Do not add tests for prose wording or low-impact formatting changes. Use existing focused tests and package scripts appropriate to the change.

Concrete starting points are the [production router tests](server-route-examples.md), [ServiceToken and lifecycle tests](service-examples.md), [Client behavior examples](client-examples.md), [Repository HTTP test](repository-examples.md), and [migration test](database.md#test-a-migration-against-a-real-database). Read each example's fixture and file prerequisites rather than assuming a helper is part of a public runtime API.

## Server and database verification

Use an isolated `ServiceContainer` to verify the owner-created Token and lifecycle. Test simple HTTP endpoints by calling the production contribution's `createRouter()` with test services and sending actual requests. Do not introduce `registerXxxRoutes(router, ...)` only to make tests possible. For a coherent complex child router, test both its `createXxxRoutes(options): Hono` behavior and the production contribution's Token resolution, middleware, and mounting.

App integration tests verify `/api` or Root mounting, public base paths, interactions between contributions, real login, and permissions. Every protected Route needs anonymous, authenticated-but-denied, and authorized cases as applicable; a public callback needs tests for its specific signature or protocol boundary. `plugin inspect` output is not security evidence.

Run migrations against a real test database, verifying both physical schema and metadata. Execute `down` when reversible. Seeds run against the schema migrations establish; test existing records and the declared repetition policy. Job and queue tests run the real Provider against a jobs or queue service whose memory state lives in a temporary directory, submit or publish, and observe the effects. See [Server development](server.md) and [database resources](database.md) for examples and contracts.

## UI and locale verification

Call actual component loaders and render public components through their supported imports. For routed Tabs, cover a direct child URL, reload, back/forward navigation, the parent redirect, denied children, and preserved queries. A page calling a Server endpoint needs a real page-to-API workflow in the target App.

For UI work, verify shadcn interaction and keyboard behavior, the shared theme in light/dark modes, and loading, empty, error, and success states. An App alias resolving in one development environment does not prove compiled plugin imports resolve for an installed consumer.

Use `en-US` as the locale key-shape source, run the relevant `i18n:check`/strict check, and render at least two supported languages. Public components must also work outside their plugin's render subtree. Server request tests cover session/header/default locale resolution and stable `code/ns/key/params` plus translated messages. Jobs, mail, and notifications must load resources before obtaining a fixed translator for a non-default recipient locale. Ensure emitted locale chunks are present in the build and tarball. See [internationalization](i18n.md).

## Registry and Skill verification

Build Registry items and install/materialize them into a temporary or intended App within the task's scope. Check copied paths, source extensions, dependencies, public imports, typecheck, tests, build, and rendered behavior. The App copy is not the plugin's canonical source, and a snapshot does not establish an upgrade merge strategy.

Check Plugin Skill frontmatter, ownership prefixes, absence of drafts, publication through `files`, and synchronization replacement/removal/conflict behavior. Then review every claimed public API, prerequisite, permission, and verification step against the implementation. File equality only proves synchronization; the target App must demonstrate the integration the Skill promises. The Skills example (`packages/examples/app-plugin-skills-example`) shows a public component consumer and actual App HTTP verification.

## Run scoped package and consumer checks

For modified plugin code, run:

```bash
pnpm --filter <plugin-package> lint
pnpm --filter <plugin-package> typecheck
pnpm --filter <plugin-package> test
pnpm --filter <plugin-package> build
```

Run the relevant target App and affected consumers' checks, including lint for modified consumer code:

```bash
pnpm --filter <target-app> typecheck
pnpm --filter <target-app> test
pnpm --filter <target-app> build
```

Keep checks scoped; workspace-wide tests are not a routine substitute for identifying consumers. Widen validation when public types, shared configuration, runtime contracts, or generated applications are affected. Use the repository's database integration Skill if changes also touch `packages/libs/db*`.

After exports or packaging changes, inspect source/publish mappings, emitted `.d.ts`, locale chunks, migration/seed manifests, and tarball contents. Runtime libraries ship compiled resources without source directories shadowing them. Read a workspace package's version from its manifest in tests; never assert its current version as a literal. Follow repository changeset and publish-validation rules before a PR/push.

`plugin inspect` is an optional diagnostic after registration changes, not a fixed validation phase. Use it as [registration](registration.md) describes; `consistent: true` means the observed static composition has no reported conflict, not that implementation or runtime behavior is correct.

## Completion evidence

Deliver the requested behavior from the correct owning plugin, remove unused scaffold examples, align declarations/exports/dependencies, and verify the intended target App registration. Update App-facing Skills when public integration changes. Report checks run and their results, actual runtime verification, skipped checks, and unresolved limitations. A successful scaffold or registration command alone is not a completed feature.
