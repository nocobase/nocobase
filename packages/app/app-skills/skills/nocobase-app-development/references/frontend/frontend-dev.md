# Frontend development handbook

When you write or change code under `client/`, first decide the workflow with `ui-workflow.md`, then read the documents listed here by topic. For what the UI should look like, see `ui-guidelines.md`; this handbook covers only how to write the code.

All code examples use the example "projects" domain; its endpoints and types are at the start of `references/api.md`. Every example is complete as code: hooks are called at the top level of a component, a snippet comes with the component or function it belongs to, and omitted parts are marked with `// …`. The translation keys an example calls are not all in the template: add the shared `actions.*` keys listed in `references/i18n.md` and the example's own feature group before copying it.

## Basic conventions

**Directories**

| Location                  | Contents                                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/routes.ts`        | Route and menu declarations                                                                                                                                                                                 |
| `client/pages/<feature>/` | Pages: `index.tsx` is the entry; child route pages go in the same folder, following their paths (a child page with child routes of its own gets a folder); the page's own components and types also go here |
| `client/components/`      | Components shared across the whole application                                                                                                                                                              |
| `client/components/ui/`   | shadcn primitives; add a missing one with `pnpm exec shadcn add <name>`, do not hand-write it                                                                                                               |
| `client/locales/`         | Copy: `en-US.ts`, `zh-CN.ts`                                                                                                                                                                                |
| `tests/`                  | Tests; never beside the source                                                                                                                                                                              |

Write the logic a page needs (loading data, the search box, error checks) directly in the page component, using only the APIs the framework already provides. Do not create "application-wide" files under `client/hooks/` or `client/lib/` for a single feature.

**Imports**: `@/` points to `client/`; relative imports use the `.js` extension (the source files are `.ts`/`.tsx`).

**Components are built on Base UI, not Radix** (see `references/styling.md` for details):

- Compose with the `render` prop; there is no `asChild`: `<DropdownMenuTrigger render={<Button variant='ghost' />}>`.
- When a button renders as a link, add `nativeButton={false}`: `<Button render={<Link to='new' />} nativeButton={false}>`.
- Pass `items` (`{ value, label }[]`) to `Select`, or the trigger will not show the selected item's text; `onValueChange` may pass `null`, so check before using the value.
- `DropdownMenuLabel` must be placed inside a `DropdownMenuGroup`.

**Page container**: wrap page content in `PageContainer` (`@/components/page-container`), which provides the page padding and the spacing between sections. Inline child pages and tab content do not add another one; a covering child page places its own inside `RouteChildPage`; dialogs and drawers use the container that comes with the overlay.

**Overlays**: create, edit and detail views are child routes by default, using `RouteDialog` / `RouteDrawer`, so a link opens them directly and a refresh restores them. Only a confirmation for a single action (`AlertDialog`) and a temporary panel (`Sheet`) use open state inside the component. See `references/overlay.md`.

**Icons**: `lucide-react`; an icon inside a button gets `data-icon='inline-start'` (before the text) or `'inline-end'` (after the text).

**Toasts**: `const toaster = useToaster()` from `@nocobase/app-client`, then `toaster.show({ type: 'success', title })`. `client/service-provider.ts` connects it to the application's one `Toaster` component, which `client/react-providers.ts` mounts, so do not mount another.

**Copy**: all user-visible text goes through translation keys; see `references/i18n.md`.

## Look up by task

| Task                                                                                                  | Read                         |
| ----------------------------------------------------------------------------------------------------- | ---------------------------- |
| New pages, menu entries, page permissions, settings pages, breadcrumbs, showing buttons by permission | `references/page.md`         |
| Child pages, tabs, covering child pages, navigation groups                                            | `references/child-routes.md` |
| Dialogs, drawers (child routes), confirmation dialogs, temporary panels                               | `references/overlay.md`      |
| Forms, field types, validation, submission, server errors                                             | `references/form.md`         |
| Calling endpoints, loading data, error handling, writes, toasts                                       | `references/api.md`          |
| Lists, tables, search and filters, row actions, list states                                           | `references/table.md`        |
| Choosing components, color, font size, spacing, buttons, icons, dark theme, header buttons            | `references/styling.md`      |
| Full theme token reference, creating or changing a theme preset                                       | `references/theme.md`        |
| Copy and translation, languages, date and number formatting                                           | `references/i18n.md`         |
| Frontend testing                                                                                      | `references/testing.md`      |

## Common mistakes

- **Calling a hook outside a component**: `useApiClient()`, `useTranslation()`, `useState()` and other hooks can be called only at the top level of a component or custom hook, never at module top level, in an event handler, or inside a condition or loop.
- **Overlays that use component state**: create, edit and detail views must be child-route overlays; otherwise a link cannot open them directly and they disappear on refresh (see `references/overlay.md`).
- **Calling `useRouteOverlay()` in the component that renders the overlay**: it can be called only from a child component inside `RouteDialog`/`RouteDrawer` (see `references/overlay.md`).
- **Overwriting the routes file**: append to the existing array in `client/routes.ts`; do not replace the whole file, or the home page and the sign-in page disappear with it.
- **Forgetting to update the route test**: `tests/logic/client-routes.test.ts` pins the route names of pages that require sign-in. After adding such a page (including a child route), add its name there, or the test fails (see section 12 of `references/page.md`).
- **Missing `authz`**: declare `authz` on the first page of every path; nested pages inherit it. A first page that omits it does not fail registration, but a protected App or settings page then defaults to `'unrestricted'`, which only root can open, and a development warning names it. For a page every signed-in user can use, write `authz: 'skip'`; otherwise check `{ resource: { type: 'page', id }, action: 'access' }` (see `references/page.md`).
- **Hard-coded colors or copy**: see `references/styling.md` and `references/i18n.md`.
- **Prefixes in endpoint paths**: the `path` passed to `api.request` includes neither `/api` nor `/main`.
- **Type errors from `useForm`**: do not write `useForm<z.infer<typeof schema>>`; let it infer the type from `zodResolver(schema)` (see `references/form.md`).
- **Binding the search box to the URL**: do not take the input's `value` directly from a URL parameter, or Chinese input methods break (see `references/table.md`).
- **Syncing state in an effect**: this application enables the `@eslint-react/set-state-in-effect` rule, so calling `setState` synchronously inside an effect fails lint. When loading data, call `setState` only in the request callbacks (see `references/api.md`); for "update state when props or the URL change", compare with the previous value during render and update there instead.
- **The confirmation dialog title flickers as it closes**: store the open state and the target (the record to delete) separately, and change only the open state when closing (see `references/overlay.md`).

## Self-check before finishing

The workflow chosen with `ui-workflow.md` decides which checks to run: a quick change runs only the first three, which are static checks; the full workflow runs all of them and then does the acceptance review in the browser as the workflow describes. Scope every check to the changed files and the affected parts; do not run full checks every time.

```bash
pnpm exec tsc -p tsconfig.json --noEmit
pnpm exec eslint --max-warnings 0 <changed-files>
pnpm exec prettier --check <changed-files>
pnpm exec vitest run <related-test-files>
```

Passing all of these commands shows only that the code compiles and that the assertions you wrote hold; it does not mean the feature works. In your report, state what you ran, the results, and what you did not verify and why.
