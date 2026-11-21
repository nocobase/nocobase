# Components from shadcn/ui

`client/components/ui/` holds shadcn/ui primitives in their Base UI version (`style: base-nova` in `components.json`). The official documentation is https://ui.shadcn.com/docs; for one primitive, `pnpm exec shadcn docs <name>` prints its API, examples and the URLs of the Base UI version. Never infer an API from Radix-based examples ([section 2 of `styling.md`](styling.md#2-components-are-built-on-base-ui-not-radix)). Which component a need calls for is [`../design-contract.md`](../design-contract.md).

## 1. What the template ships and how to add the rest

Default ships `button`, `dropdown-menu`, `input`, `label`, `popover`, `spinner`, `toast`, `tooltip` and `dialog` (used by the shell, the sign-in pages, `RouteDialog` and `RouteDrawer`); Examples adds more for its pages. Every other primitive is added with the CLI when a page first needs it; a file importing a missing primitive does not compile. Check `client/components/ui/` (or `pnpm exec shadcn info --json`), add everything missing in one run, then format what was created:

```bash
yes n | pnpm exec shadcn add field card alert
pnpm exec prettier --write client/components/ui/field.tsx client/components/ui/separator.tsx client/components/ui/card.tsx client/components/ui/alert.tsx
```

- **Answer "no" to every overwrite question.** A primitive often depends on installed ones that differ from the registry; `yes n |` keeps them. Unanswered outside a terminal, the question ends the run with exit code 0 and missing files, so check that the printed "Created" list covers every name.
- **Format every created file**, dependencies included (`separator.tsx` for `field`): the registry writes double quotes.
- **Translate built-in English** ([below](#english-built-into-primitives)); otherwise keep each primitive as the CLI writes it and change the look through props or the theme ([`theme.md`](theme.md)).
- A bare name comes from `@shadcn`; `@nocobase/<item>` comes from the NocoBase UI Library ([section 3 of `styling.md`](styling.md#3-use-shadcn), offline [`ui-library.md`](ui-library.md)). Ask before adding from any other registry.
- npm packages a primitive brings (`recharts` for `chart`, `react-day-picker` for `calendar`) land in `dependencies`; move them to `devDependencies`, since client code is bundled ([adding a dependency](../../dependencies.md)). If an item re-adds `@nocobase/i18n` with an exact version, keep it in `dependencies` and restore the `^`.
- Import `cn` from the `cn` package; `client/lib/utils.ts` only re-exports it.
- Dates use the application's `DatePicker` ([`form.md`](form.md)); tables use `DataTable` ([`table.md`](table.md)).
- To update a primitive, compare with `pnpm exec shadcn add <name> --diff <file>`, overwrite only with the user's approval, and translate again; `tests/client/primitive-labels.test.tsx` catches a lost translation.

### English built into primitives

Every visible or audible string is translated (guideline C1). Where the primitive takes the text as a prop, pass the translation where you render it; where it does not, replace only that literal in the file with `t(…)`.

- `dialog`, `sheet`: "Close" of the corner button and `DialogFooter`'s close button. `toast`: "Close toast". `spinner`: its "Loading" `aria-label`. The template's copies already use `t('actions.close')` and `t('status.loading')`.
- `sidebar`: kept as written; `app-sidebar.tsx` renders the phone sheet with translated text, and you pass `aria-label` to `SidebarTrigger` and `SidebarRail`.
- Props: `pagination` (`text`, `aria-label`; `dataTable.previousPage`/`nextPage` hold the labels), `carousel` (`aria-label`), `command` (`title`, `description` of `CommandDialog`), `message-scroller` (`aria-label`), `questionnaire` (button `children`).

After adding a primitive, search the created files for other English in `sr-only` spans, `aria-label`, `title`, default parameters and `children ??` fallbacks, and handle it the same way. Note any file you change in the application's `AGENTS.md`.

## 2. Where this application departs from upstream

1. **Run the application's CLI**: `pnpm exec shadcn …`, never `npx shadcn@latest`, `pnpm dlx` or `bunx`, which fetch another version.
2. **Themes are this application's presets.** Never run `shadcn init`, `shadcn apply` or `--preset`, never add variables to `:root`/`.dark` in `client/styles.css`, never set up `next-themes`. Tokens live in `client/theme/themes/*.css` ([`theme.md`](theme.md)).
3. **Overlays follow the URL.** Create and edit are a `RouteDialog`, record details a `RouteDrawer` or a detail page; `Sheet` is only for a temporary panel that represents no record ([`overlay.md`](overlay.md)). Upstream's `Drawer` is a bottom sheet, not `RouteDrawer`.
4. **Labels go above inputs**; ignore `Field orientation="horizontal"` except for a Checkbox, Switch or radio option (guideline T3.2).
5. **Toasts have one host**: `useToaster()` from `@nocobase/app-client`, not `toast()` ([section 6 of `styling.md`](styling.md#6-toasts)).
6. **The MCP server is configured** in `.mcp.json`, `.cursor/mcp.json` and `.vscode/mcp.json` with `pnpm exec shadcn mcp`; never run `shadcn mcp init`.
7. **Blocks are for reading.** A block (`pnpm exec shadcn search @shadcn -t block`) brings its own layout and sidebar; read it with `pnpm exec shadcn add @shadcn/<block> --view` and build the page from `PageContainer` ([`page.md`](page.md)).
