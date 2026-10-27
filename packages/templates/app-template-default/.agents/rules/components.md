# Components and styling

Read this before adding or changing a component, a shadcn primitive, a UI Library item, or the application's visual design.

## Imports

Use package-local imports such as `#components/ui/button` and `#extensions/nocobase-auth-forms/form-parts`. `package.json#imports` declares their targets, and `components.json` uses the same prefixes for shadcn generation. Keep directory entry points explicitly mapped to their index files. Do not add a Vite alias or TypeScript `paths` mapping for these imports.

## shadcn/ui primitives

Use shadcn/ui for UI. The template ships only the primitives its shell and compositions use: `button`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `spinner`, `toast` and `tooltip`. Check `client/components/ui/` first; if the primitive is not there, add it from the shadcn registry rather than writing your own. `yes n |` answers "no" when the CLI offers to overwrite a primitive that is already installed; without an answer, a non-interactive run stops at that question. Format the files it created and translate the English a few primitives carry, as [the shadcn guide](../skills/nocobase-app-development/references/frontend/references/shadcn.md) lists; otherwise keep them as the CLI writes them:

```bash
yes n | pnpm exec shadcn add card
pnpm exec prettier --write client/components/ui/card.tsx
```

Build your own components by composing these primitives, and put them in `client/components/`. A page below another one — a covering child page, a record's own page — leaves by the header's breadcrumb when its route declares `breadcrumb` or the page declares its trail with `usePageBreadcrumb`, and otherwise by `BackButton` (`client/components/back-button.tsx`) above its heading; never both.

**Look components up in the shadcn skill.** The development Skill carries the shadcn/ui skill, unchanged from shadcn 4.21.0, in `.agents/skills/nocobase-app-development/references/frontend/shadcn/`. Read [the shadcn guide](../skills/nocobase-app-development/references/frontend/references/shadcn.md) first: it routes to the skill's rules and states where this application departs from them, among others `pnpm exec shadcn` instead of `npx shadcn@latest`, no `shadcn apply` or `--preset`, and create, edit and detail as `RouteDialog` or `RouteDrawer` child routes rather than a `Sheet`. `pnpm exec shadcn docs <name>` gives one primitive's documentation and examples for the Base UI version. For a whole page, start from the worked example that [the example index](../skills/nocobase-app-development/references/frontend/references/example.md) indexes.

## UI Library items

`PageContainer`, `PageHeader`, `RouteDialog`, `RouteDrawer`, `RouteChildPage` and `useRouteOverlay` in `client/components/` come from the NocoBase UI Library, as do the authentication blocks in `client/extensions/nocobase-auth-forms/`, `nocobase-auth-methods/`, `nocobase-auth-split-layout/` and `nocobase-device-approval/` that `client/pages/auth/` composes, and the inbox block in `client/extensions/nocobase-inbox/` that `client/pages/inbox.tsx` renders on `/inbox`; like the rest of the source, they belong to the application. `yes n | pnpm exec shadcn add @nocobase/<item>` adds another item from the library: a single component lands in `client/components/`, a complete feature in `client/extensions/nocobase-<item>/`. A date field and a list's `DataTable` are the application's own components: compose `DatePicker` in `client/components/date-picker.tsx` from the `calendar` and `popover` primitives, following shadcn's Date Picker guide, and reuse the template's standard `DataTable` and companions from `#components/data-table` (`client/components/data-table/`). They use the template's declared TanStack Table v8 dependency; do not generate a separate table engine or substitute a hand-written HTML table for a business list. Server pagination uses the same component's controlled `manualPagination`/`rowCount` and sorting props. Verify the installed version and the `useReactTable`/`getCoreRowModel` exports before reporting incompatibility; repair an incompatible dependency to the supported v8 range instead of recording a custom implementation as an accepted deviation. The CLI adds the packages an item or primitive needs to `dependencies`: move the new ones, such as `react-day-picker` for `calendar`, to `devDependencies`, as [where to declare a dependency](../skills/nocobase-app-development/references/dependencies.md) explains for everything client code imports, but leave `@nocobase/i18n` in `dependencies`, where the server needs it, and put back the `^` of its range, which the CLI pins.

## Styling and visual consistency

Style with the semantic Tailwind tokens — `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary` — so pages follow the light and dark themes. Do not hard-code colors like `bg-white` or `text-gray-900`; they break the moment someone switches theme.

**Visual consistency is a whole-application property.** Match the surrounding code's spacing, typography, and component choices. If a change genuinely calls for a different look, change the application's design tokens in `client/theme/themes/*.css` so every page moves together. Never restyle only the part you are working on — a page that looks different from the rest is a defect, not a customization.

The default brand palette and density live in `client/theme/themes/*.css`; shared hover/cursor and Badge geometry live in `client/styles.css`, outside generated shadcn primitives. For semantic status labels, use `StatusBadge` from `client/components/status-badge.tsx` with `neutral`, `info`, `warning`, or `success`; choose the tone by meaning and keep the visible status text. A badge beside a title or on a dense card is the small one, `size='sm'` on `StatusBadge` or `data-size='sm'` on `Badge`. Reuse these shared components and tokens in new pages so template upgrades can carry the design consistently.

**Follow the UI guidelines.** [The UI guidelines](../skills/nocobase-app-development/references/frontend/ui-guidelines.md) set the conventions every page follows, among them the page header and the single placement of the primary action, empty states, row actions behind one "…" menu, dates picked from a `Calendar` in a `Popover` rather than a native date input, and medium-width drawers; the frontend workflow says how much of it to read for a change.

## Standard process management

The template includes `FlowDiagram`, `LifecycleDiagram` and `client/extensions/nocobase-workflow-management/` source. Reuse them when business workflows are introduced; preinstallation does not register a settings route or sample process. `LifecycleDiagram.configuration` automatically offers configuration for authorized native parameter bindings, using the application’s real parameter editor and API. Read [Lifecycle UI](../skills/nocobase-app-development/references/lifecycle-ui.md) before wiring the workflow directory, definition and execution pages. The existing `LifecycleDiagram` supports `presentation="process"` for compact approval/work cards and start/outcome pills, with `stateKind` supplied by the application; omitting it keeps the classic presentation. Preserve configuration and recorded-history behavior when selecting a presentation. UI Library names are shadcn registry items, not npm package names; an npm 404 is not evidence that a component is unavailable.

Use `RecordLink` from `#components/record-link` for clickable record names and identifiers in lists and tables. It uses foreground text with medium weight, an underline on hover, and an underline plus focus outline for keyboard navigation. Preserve the native link semantics and route query context. Do not give record fields a permanent underline, primary-blue text, or a button-shaped surface. Keep action buttons and menu items on their own components; do not globally restyle every link in the application.
