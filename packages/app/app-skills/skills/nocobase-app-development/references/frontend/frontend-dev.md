# Frontend development handbook

An index of the frontend references and the few code facts that have no other home. The workflow is in [`ui-workflow.md`](ui-workflow.md); what the interface looks like is in [`ui-guidelines.md`](ui-guidelines.md).

The examples use a "projects" domain. Take the rule an example shows, not its values: field names, copy keys, columns, filters and widths are placeholders. Copy a file unchanged only where its document calls it shared infrastructure, such as `session-expired-alert.tsx`.

## Basic conventions

- `client/routes.ts`: route and menu declarations; append, never rewrite.
- `client/pages/<feature>/`: `index.tsx` is the entry; child route pages and the page's own components and types sit beside it, following their paths.
- `client/components/`: components shared across the application; `client/components/ui/`: shadcn primitives, added with the CLI ([`references/shadcn.md`](references/shadcn.md)), never hand-written.
- `client/locales/`: `en-US.ts` and `zh-CN.ts`, each spreading the template's copy from `system/`, which a template upgrade replaces.
- `tests/`: tests, never beside the source.

Write logic in the component first. When the same logic would be copied unchanged into a second place, move it into one hook: a file in the feature folder for one feature (`client/pages/projects/use-project.ts`), `client/hooks/` across features. Components move to `client/components/` by the same rule.

Import through package-local subpaths such as `#components/ui/button` and `#hooks/use-mobile`, which `package.json#imports` maps to `client/`; do not add a Vite alias or TypeScript `paths`. Relative imports use the `.js` extension.

## Browser API compatibility

Check browser support and secure-context requirements before choosing a browser API, including those a library calls. An HTTPS-only API is allowed when the feature needs it: detect its absence or a permission failure and show a localized explanation of what the user can do, and keep unrelated actions working. Never fail silently or report success. A LAN IP over HTTP is not a secure context while `localhost` is, so test the unavailable state on a non-secure origin.

UUID generation and copying text work on plain HTTP: use `createUuid()` and `copyText()` from `@nocobase/app-client` instead of `crypto.randomUUID` or `navigator.clipboard`. Server-side `node:crypto` is unaffected.

### Copy and clipboard actions

Call `copyText(text)` directly in the click handler and await its boolean. It falls back to selection-based copying on HTTP and returns `false` when the browser refuses. Show "Copied" only on `true`; on `false`, show the text in a selectable field with localized manual-copy instructions. Inside a dialog whose trigger does not take focus, pass `copyText(text, { container: dialogElement })`. Verify on an origin where `window.isSecureContext` is `false`, including copying from a dialog, by pasting into a normal input (multiline and non-ASCII text too).

## Look up by task

| Task                                                              | Read                                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Workflow, page plan, verification, acceptance                     | [`ui-workflow.md`](ui-workflow.md), [`ui-acceptance.md`](ui-acceptance.md)                                         |
| Layout, page templates, interactions, states, copy, accessibility | [`ui-guidelines.md`](ui-guidelines.md)                                                                             |
| What changes on a phone                                           | [`mobile.md`](mobile.md)                                                                                           |
| Design references, component selection, the checker               | [`design-contract.md`](design-contract.md)                                                                         |
| Routes, menus, the page component, permissions, settings pages    | [`page.md`](references/page.md)                                                                                    |
| Child pages, tabs, covering pages, navigation groups              | [`child-routes.md`](references/child-routes.md), [`navigation.md`](references/navigation.md)                       |
| Dialogs, drawers, confirmations, the discard question             | [`overlay.md`](references/overlay.md)                                                                              |
| Forms: fields, dates, validation, server errors, uploads          | [`form.md`](references/form.md)                                                                                    |
| Lists: `DataTable`, search, filters, row actions, phone cards     | [`table.md`](references/table.md), [`table.md`](references/table.md#7-list-feedback-states)                        |
| Endpoints, loading data, errors, toasts, realtime                 | [`api.md`](references/api.md)                                                                                      |
| Refreshing other views after a write                              | [`data-changes.md`](references/data-changes.md), [`data-changes.md`](references/data-changes.md#no-refresh-button) |
| The runnable list/edit example                                    | [`executable-list-edit.md`](references/executable-list-edit.md)                                                    |
| Relations and batch actions example; the full projects example    | [`executable-relation-batch.md`](references/executable-relation-batch.md), [`example.md`](references/example.md)   |
| Shipped primitives, adding one, registry components               | [`shadcn.md`](references/shadcn.md), [`ui-library.md`](references/ui-library.md)                                   |
| Base UI composition, tokens, buttons, icons, charts, dark mode    | [`styling.md`](references/styling.md) §2, §7, §8, §10, §12                                                         |
| Changing a template or registry component, `client/extensions/`   | [`styling.md` §4](references/styling.md#4-customize-template-and-registry-components)                              |
| The application shell and its header                              | [`shell.md`](references/shell.md)                                                                                  |
| Theme tokens and presets                                          | [`theme.md`](references/theme.md)                                                                                  |
| Copy keys, dates and numbers, languages                           | [`i18n.md`](references/i18n.md)                                                                                    |
| Frontend tests, the harness, running tests                        | [`testing.md`](references/testing.md)                                                                              |

## Self-check before finishing

Every change runs these, scoped to the changed files and the tests that cover them:

```bash
pnpm exec tsc -p tsconfig.json --noEmit
pnpm exec eslint --max-warnings 0 <changed-files>
pnpm exec prettier --check <changed-files>
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/app-locale-coverage.test.ts <related-test-files>
```

- ESLint takes only `.ts`, `.tsx`, `.js` and `.mjs` files (it exits nonzero on `.css` and `.md`); Prettier takes every changed file.
- Primitives the change added count as changed files: formatted, their built-in English translated ([`references/shadcn.md`](references/shadcn.md#english-built-into-primitives)), otherwise as the CLI wrote them.
- Run the [component checker](design-contract.md#component-checker) on the changed client source of each owning package.
- Lint does not check where this application departs from upstream shadcn; read the changed components against [section 2 of `references/shadcn.md`](references/shadcn.md#2-where-this-application-departs-from-upstream).
- The route test and the copy test always run with any change under `client/`: they catch a route that clashes with another (the application then fails to start) and a `t()` key or route title missing from a locale ([`references/i18n.md`](references/i18n.md#checks)). Add the related tests found by searching `tests/` for the changed component, page or route and confirm every named test file ran ([`references/testing.md`](references/testing.md#running-tests)).
- Server or database code changed: also `pnpm exec tsc -p tsconfig.server.json --noEmit`. A browser test under `tests/playwright/` changed: also `pnpm exec tsc -p tsconfig.node.json --noEmit`.

Passing these shows that the code compiles and the assertions hold, not that the feature works; the browser check in [`ui-workflow.md`](ui-workflow.md#verify-in-the-browser) does that.
