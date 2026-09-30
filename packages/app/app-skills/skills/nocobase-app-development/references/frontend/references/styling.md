# Components and styling

The UI is composed of shadcn/ui primitives (the Base UI version) and styled with Tailwind utility classes and the theme's semantic tokens. For what the UI should look like, see [`../ui-guidelines.md`](../ui-guidelines.md) ("F Foundations", "L Page structure", "A Accessibility and adaptation"); for the full token reference and theme presets, see [`theme.md`](theme.md).

## 1. Look up components

How to use a primitive comes from the shadcn/ui skill. Read [`shadcn.md`](shadcn.md) first: it lists the primitives the template ships and how to add the others, says which of the skill's files to open, and where this application departs from the skill. For one primitive's API and examples, run `pnpm exec shadcn docs <name>` and fetch the URLs it prints; they point at the Base UI version. Do not infer an API from memory or from Radix-based examples on the web.

This document adds what the skill does not cover: the Base UI details it leaves out, the compositions this template ships, and the styling rules that keep the pages of this application consistent. For how a whole feature fits together, read the worked example ([`example.md`](example.md)).

## 2. Components are built on Base UI, not Radix

The `style` in `components.json` is `base-nova`, so every component in `client/components/ui/` is built on Base UI. Most shadcn examples on the web are the Radix version, which is written differently; the skill's [`rules/base-vs-radix.md`](../shadcn/rules/base-vs-radix.md) lists the differences: `render` instead of `asChild`, `nativeButton={false}`, `Select` with `items`, `ToggleGroup`, `Slider` and `Accordion`. It leaves out:

- There is no `asChild`; passing it is a type error. Give the element passed to `render` **no children**; write the children between the component's opening and closing tags, and the props are merged automatically.
- A `Button` rendered as a link with `nativeButton={false}` keeps its `href` but is announced as a button (`role='button'`). That is right for an action that happens to be a route, such as "New project", "Edit" or "Import projects", which open a dialog or a child page. Navigation between places (tabs, menus, the back button, breadcrumbs) stays a link: style a `Link` or `NavLink` with `buttonVariants(…)` instead ([section 4 of `child-routes.md`](child-routes.md#4-page-tabs)). Tests query the former by the `button` role.

| Pattern                                                                                               | Notes                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Select`'s `onValueChange` can pass `null`                                                            | Check before storing it. The same applies to `Combobox`                                                                                                                                                                                                                                  |
| The value passed by `onValueChange` of `RadioGroup` and `DropdownMenuRadioGroup` has no specific type | Validate that it is an allowed value before using it; in a form field, `z.enum` in the schema does this, so `field.onChange` can take it directly ([`form.md`](form.md))                                                                                                                 |
| Open on hover: set `openOnHover` and `delay={0}` on the trigger                                       | Component options of `DropdownMenu` and `Popover`; do not write your own mouse event handlers. For when to use it, see [section 2 of `shell.md`](shell.md#2-header-icon-buttons) and, for a cut-off table cell, [section 8 of `table.md`](table.md#8-column-definitions-and-row-actions) |
| Close on selection: add `closeOnClick` to radio items and checkbox items                              | By default, a radio item does not close the menu when selected; the language items of the account menu (`client/layouts/components/language-switcher.tsx`) set it                                                                                                                        |
| A `DropdownMenuLabel` outside a `DropdownMenuGroup` or `DropdownMenuRadioGroup`                       | Throws `MenuGroupContext is missing` at runtime. The skill's rule of putting every item and label inside its group avoids it                                                                                                                                                             |

`Select` (the status filter of the example; its options are translated at render time, see ["Derived values that use `t`" in `i18n.md`](i18n.md#derived-values-that-use-t)):

```tsx
// client/pages/projects/project-status-select.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useMemo } from 'react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PROJECT_STATUSES, type ProjectStatus } from './types.js';

export function ProjectStatusSelect({
  value,
  onChange,
}: {
  readonly value: ProjectStatus;
  readonly onChange: (value: ProjectStatus) => void;
}): ReactElement {
  const { t } = useTranslation();
  // Pass these as items so the SelectValue in the trigger shows the selected item's label, not the raw value.
  // Depends on t: t changes when the language switches, and the labels are regenerated.
  const items = useMemo(
    () =>
      PROJECT_STATUSES.map((status) => ({
        value: status,
        label: t(`projects.status.${status}`),
      })),
    [t],
  );
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        // onValueChange can pass null; check before using it.
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger
        aria-label={t('projects.fields.status')}
        className='w-full sm:w-40'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
```

For the "More" menu in table rows, see [`table.md`](table.md).

## 3. Use shadcn

The template ships only the primitives its shell and compositions use ([section 1 of `shadcn.md`](shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)). First check whether `client/components/ui/` has the component you need. If it does not, add it from the shadcn registry:

```bash
yes n | pnpm exec shadcn add card
yes n | pnpm exec shadcn add alert-dialog badge
```

- The CLI writes into `client/components/ui/`, as `components.json` configures. `yes n |` answers "no" when it offers to overwrite a primitive that is already installed; then format the files it created, translate the English some of them carry, and leave them otherwise as they arrived ([section 1 of `shadcn.md`](shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).
- Adding is the first choice. Do not hand-write a button, dialog, or select that shadcn already provides, and do not copy one from another project.
- `pnpm exec shadcn search @shadcn -q <word>` finds an item by keyword (it takes a registry name and a query, not a component name), and `pnpm exec shadcn docs <name>` gives its documentation and examples. The other commands are in the skill's [`cli.md`](../shadcn/cli.md).

`components.json` also configures the `@nocobase` registry, the NocoBase UI Library: `pnpm exec shadcn search @nocobase` lists its items, and `yes n | pnpm exec shadcn add @nocobase/<item>` writes a single component to `client/components/` and a complete feature to `client/extensions/nocobase-<item>/`.

New files under `client/` need no Tailwind registration: `client/styles.css` scans the application and its primitives, and `tailwind.config.mjs` adds the client directories of the installed `@nocobase/app-client` and `@nocobase/app-plugin-*` packages.

## 4. Customize template and registry components

When a component provided by the template or a registry (for example `nocobase-auth-ui` or `nocobase-file-component-ui` under `client/extensions/`) needs different behavior or a different appearance, choose in this order:

1. **Use existing capabilities first**: props, slots, page composition.
2. **If that is not enough, write the application's own component**: put it in `client/components/` (or the feature's own directory, not under `client/extensions/`), compose it from the existing primitives and public hooks, then switch the pages that use the original over to the new component. Keep the original extension files for reuse and upgrades.
   - The new component must genuinely control the behavior you need. Hiding a hard-coded link with CSS or DOM manipulation is not customization.
   - The new component keeps theme tokens, accessibility, validation, and loading and error handling; do not reimplement the underlying service.
3. **Change the original component only as a last resort**: modify a template-provided component only when the user explicitly asks for it or composition genuinely cannot do the job; keep the change as small as possible and explain why. The application owns this code, but editing `client/extensions/` is not the default way to customize.

Also:

- Keep the primitives in `client/components/ui/` as the CLI writes them, apart from formatting and translating their built-in English ([`shadcn.md`](shadcn.md)). When you need a different look, first check for props such as `variant` and `size`; for a global change, change the theme ([`theme.md`](theme.md)).
- When changing a shared composed component under `client/components/`, only add optional props and keep the default behavior unchanged (see [`table.md`](table.md)).

## 5. Compose upward

`client/components/ui/` holds the primitives. Build your own components by composing them: components shared across the application go in `client/components/`, and components only one page uses go in that page's directory, until several pages use them.

`client/components/` already has a few composed components. Use them first instead of writing from scratch. Most come from the NocoBase UI Library, preinstalled so that a new page can use them at once; like the rest of the source, they belong to the application:

| Item                                                                             | Components                                     | Purpose                                                                                                                                                           |
| -------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nocobase/page-container`, `@nocobase/page-header`                              | `PageContainer`, `PageHeader`                  | Page frame: padding, title, description, actions area                                                                                                             |
| `@nocobase/back-button`                                                          | `BackButton`                                   | The way back from a page below another one, above its title; leads to the parent route with the query string ([`page.md`](page.md#7-back-button-and-breadcrumbs)) |
| `@nocobase/route-dialog`, `@nocobase/route-drawer`, `@nocobase/route-child-page` | `RouteDialog`, `RouteDrawer`, `RouteChildPage` | Dialogs, drawers, and covering child pages opened by URL ([`overlay.md`](overlay.md), [`child-routes.md`](child-routes.md))                                       |

Two are the template's own, because they depend on the shell:

| Component     | Purpose                                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Breadcrumbs` | Breadcrumbs generated from routes' `breadcrumb` declarations, in place of `BackButton` when the user asks for them ([`page.md`](page.md#7-back-button-and-breadcrumbs)) |
| `Loading`     | The shared loading indicator                                                                                                                                            |

Lists and date fields come from the UI Library too, but the template does not preinstall them. Add the item before the first file that imports it, as [section 1 of `shadcn.md`](shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest) describes; from then on it belongs to the application like the components above:

| Item                         | Components                                                                                          | Purpose                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `@nocobase/data-table`       | `DataTable`, `DataTableColumnHeader`, `DataTablePagination`, `DataTableViewOptions` (`data-table/`) | Sortable, filterable, paginated lists built on TanStack Table ([`table.md`](table.md)) |
| `@nocobase/date-picker`      | `DatePicker`, `DateRangePicker` (`date-picker.tsx`)                                                 | Date and date range selection with `Popover` plus `Calendar` ([`form.md`](form.md))    |
| `@nocobase/date-time-picker` | `DateTimePicker` (`date-time-picker.tsx`), with `date-picker.tsx`                                   | A moment to the minute, or a start and an end within one day                           |

A composition uses the full structure of the primitives it is built from, such as `CardHeader`, `CardTitle`, `CardAction` and `CardContent` for a card (the skill's [`rules/composition.md`](../shadcn/rules/composition.md)). [`example/project-summary.md`](example/project-summary.md) is a complete one: a card that loads one record and shares `ProjectStatusBadge` ([`i18n.md`](i18n.md)) with the list, so a status looks the same everywhere. Do not reimplement a primitive's behavior: focus, keyboard interaction, and ARIA attributes are already handled in the shadcn components, and they are easy to get wrong by hand.

### Charts

Charts use `recharts` through the `chart` primitive, which the template does not ship: add it with `yes n | pnpm exec shadcn add chart`, format the created file, and move the `recharts` it installs to `devDependencies` ([section 1 of `shadcn.md`](shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)). `pnpm exec shadcn docs chart` has the API and every chart type. In this application:

- Colors come from the theme's chart tokens: `color: 'var(--chart-1)'` through `var(--chart-5)` in the `ChartConfig`, whose keys match the `dataKey`s. `ChartContainer` writes each key's color to `--color-<key>`, so set the shapes' `fill` and `stroke` to `var(--color-<key>)`. The chart library does not pick theme colors on its own; referenced this way, the colors follow light, dark and every preset.
- The `label` of each `ChartConfig` key, which the tooltip and the legend show, and the category names in the data go through `t` like any other copy.
- `ChartContainer` is `aspect-video` by default; for a fixed height, write `className='aspect-auto h-64 w-full'`. A pie chart's radius is in pixels, so give the container a definite height, as `h-64` does.

## 6. Toasts

How to call `toaster.show` and which type fits which situation is in ["Toasts" in `api.md`](api.md#toasts). What the shell provides, and must keep providing:

- How a toast is presented is decided once, in `client/lib/toaster.ts`, for the application's toasts and the plugins' alike: it forwards to the Base UI `toast` manager and announces an error written as plain text to screen readers at once. Any other error — one with an action, or whose title or description is an element rather than text — keeps the default priority, because it may hold a control, and Base UI hides a high-priority toast's controls from assistive technology until its viewport is focused. Clicking an action runs its `onClick` and leaves the toast open.
- `client/react-providers.ts` mounts the application's `Toaster` once, in the `application` layer, and `client/service-provider.ts` registers the toaster service that feeds it: toasts appear in the bottom-right corner and take their colors from `--popover`, `--popover-foreground`, and `--border`, so they follow the theme. Mounting another one renders every toast twice, because both listen to the same `toast` manager.
- Toasts stay above dialogs, sheets and popovers because a `[data-slot='toast-viewport']` rule at the end of `client/styles.css` lifts the viewport to `z-index: 100`. Every overlay in `client/components/ui/` uses `z-50`, and the toaster, mounted first, would otherwise paint under a dialog opened later. Keep that rule, and leave the generated component's `z-50` alone.
- Plugin pages report through the same `useToaster()`. Keep the toaster service's registration in `client/service-provider.ts` and the `toaster` entry that mounts the `Toaster` component in `client/react-providers.ts` when you customize them: without the registration nothing throws, but every toast is only logged to the browser console.

## 7. Semantic tokens

For the full token reference (names, meanings, defaults, units), see [`theme.md`](theme.md). When writing styles, use semantic class names; do not write literal colors, fonts, font sizes, or shadows.

### Colors

| Purpose                   | Use                                                                    | Not                              |
| ------------------------- | ---------------------------------------------------------------------- | -------------------------------- |
| Page background           | `bg-background`                                                        | `bg-white`, `bg-gray-50`         |
| Cards, panels             | `bg-card text-card-foreground`                                         | `bg-white`                       |
| Overlays (dialogs, menus) | `bg-popover text-popover-foreground` (built into the components)       |                                  |
| Muted areas               | `bg-muted`                                                             | `bg-gray-100`                    |
| Body text                 | `text-foreground`                                                      | `text-black`, `text-gray-900`    |
| Secondary text            | `text-muted-foreground`                                                | `text-gray-500`, `text-gray-600` |
| Borders                   | `border` (its color is `border-border` by default)                     | `border-gray-200`                |
| Input borders             | `border-input`                                                         |                                  |
| Focus                     | `ring-ring`                                                            |                                  |
| Primary                   | `bg-primary text-primary-foreground`, `text-primary`                   | `bg-blue-600`, `text-white`      |
| Danger                    | `text-destructive`, `bg-destructive/10`                                | `bg-red-500`                     |
| Chart series              | `fill-chart-1` … `fill-chart-5`, `stroke-chart-2`, or `var(--chart-1)` | Hex colors                       |
| Sidebar                   | `bg-sidebar text-sidebar-foreground` and the other `sidebar-*` classes |                                  |

- Do not write literal colors such as `bg-white`, `text-gray-500`, `#hex`, or `rgb(…)`. A literal color looks fine in the theme you are looking at and breaks when you switch to dark or another theme preset — this is the most common styling problem in this project.
- Tokens are defined separately for light and dark in `client/theme/themes/*.css`; once you use tokens, you do not need the `dark:` prefix.

**Choosing the right surface token matters as much as not writing literal colors.** Each surface token represents a layer, not a shade:

- `bg-background` is the page.
- `bg-card` is a panel placed on the page.
- `bg-popover` is a surface floating above, such as a dialog, drawer, or menu.
- Form controls do not name a surface and inherit the surface they sit on; the shared `Input` and `Textarea` are `bg-transparent`.
- An opaque sticky header or sticky footer must name a surface: the surface of the scroll area it sits in, not the page's. For example, a sticky header in a panel uses `bg-card`, and one in a dialog uses `bg-popover`.

Using `bg-background` because it "looks right" puts a page-colored block inside a panel. Under a preset where the page and card colors are nearly the same, you cannot see it; under a preset where they differ, it is obvious at a glance — two tabs of the same panel have different colors, or one page's list is a card while the neighboring page's is flat.

### Fonts and scales

- Fonts: `body` is `font-sans text-base`; `h1`–`h6` use `font-heading`; `code`, `pre`, `kbd`, and `samp` use `font-mono`. A heading rendered with another element needs `font-heading`. Ordinary bold text and button text still use the body font.
- Font sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, and so on. Buttons, inputs, tables, and other components come with `text-sm`; body text and descriptions on the page match the components with `text-sm`. Do not use `text-[13px]`.
- Spacing: `gap-2` (between related controls), `gap-4`, `gap-6` (between blocks you stack yourself, in a `flex flex-col` container: the skill's rule is `gap-*`, never `space-y-*`), `p-4`, `p-6`. `PageContainer` already spaces the blocks of a page. Do not use `mt-[7px]`.
- Sizes: numeric classes such as `h-8`, `size-4`, and `w-64`, which scale with `--spacing`.
- Radius: `rounded-md`, `rounded-lg`; shadows: `shadow-sm`, `shadow-md`. Usually just use the component defaults.
- Deliberate fixed values (image sizes, viewport-related limits, circular icons) may stay, but confirm that fixed sizes, separately set line heights (`leading-*`, `text-sm/6`), and shadow color classes (`shadow-black/30`) do not override the theme's settings; state the reason in the design file ([`../ui-guidelines.md`](../ui-guidelines.md) F7).
- Do not globally rewrite isolated third-party content to unify the look. Font variables take effect only after the font resources have loaded (see [`theme.md`](theme.md)).

### Common layouts

| Scenario                               | Classes                                             |
| -------------------------------------- | --------------------------------------------------- |
| Toolbar                                | `flex flex-wrap items-center gap-2`                 |
| Search box width                       | `w-full sm:max-w-xs`                                |
| Filter control width (a `Select`)      | `w-full sm:w-40`                                    |
| Stat card grid                         | `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`          |
| "Label — value" pairs in a detail view | `grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm` |
| Limiting form width                    | `max-w-2xl`                                         |
| Table in a card                        | See below                                           |

**Table in a card.** Put a `DataTable` in the card's `CardContent` as it is. There it drops its own frame and reaches the card's edges, and its first and last cells take the card's `--card-spacing` (`size='sm'` makes it smaller), so the text lines up with the card's title while the row lines and the hover color span the whole card. Do not give that `CardContent` `px-0` or write the table from `Table` by hand. A list in a card has plain headers and `pagination={false}` (guideline T5.3). The recent projects of [`example/project-dashboard.md`](example/project-dashboard.md) are a complete one.

Merge class names with `cn()` (`@/lib/utils`), for example `cn('flex gap-2', className)`.

## 8. Buttons

`Button` (`@/components/ui/button`); `pnpm exec shadcn docs button` lists its variants and sizes. Which variant a button takes:

| `variant`     | Purpose                                             |
| ------------- | --------------------------------------------------- |
| `default`     | Primary action; at most one per view (guideline L2) |
| `outline`     | Secondary actions, cancel                           |
| `secondary`   | Secondary actions (with a background fill)          |
| `ghost`       | Lightweight actions in toolbars and table rows      |
| `destructive` | Destructive actions                                 |
| `link`        | A button that looks like a link                     |

- An icon-only button uses one of the `icon` sizes (`icon`, `icon-xs`, `icon-sm`, `icon-lg`) and must have an `aria-label`; an icon button for a standalone action also gets a tooltip (a "More" button that opens a menu does not need one):

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCwIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function RefreshButton({
  onRefresh,
}: {
  readonly onRefresh: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='outline'
            size='icon'
            aria-label={t('projects.actions.refresh')}
            onClick={onRefresh}
          />
        }
      >
        <RefreshCwIcon />
      </TooltipTrigger>
      <TooltipContent>{t('projects.actions.refresh')}</TooltipContent>
    </Tooltip>
  );
}
```

- A `Tooltip` in a page works without a Provider and appears after 600ms of hovering by default. To show it immediately, as the header does, wrap it in `TooltipProvider` (`@/components/ui/tooltip`; this application's wrapper sets `delay` to 0).
- A disabled button does not respond to mouse events, so a tooltip explaining why it is disabled (guideline I7) goes on a `span` around it:

```tsx
// client/pages/projects/delete-project-button.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { Trash2Icon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/** A delete the user may not run yet; `reason` is the translated explanation. */
export function DeleteProjectButton({
  reason,
}: {
  readonly reason: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Tooltip>
      {/* The disabled button ignores the pointer, so the span around it is the trigger. */}
      <TooltipTrigger render={<span className='inline-block w-fit' />}>
        <Button variant='outline' disabled>
          <Trash2Icon data-icon='inline-start' />
          {t('projects.actions.delete')}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
```

## 9. Badge

`Badge` (`@/components/ui/badge`, added with `yes n | pnpm exec shadcn add badge`); `pnpm exec shadcn docs badge` lists its variants.

- Status data needs text; do not rely on color alone to tell values apart.
- Make each enum (for example project status) one component, shared by the list and the detail view (`ProjectStatusBadge`, see [`i18n.md`](i18n.md)).
- Icons in a Badge also get `data-icon`; to render it as a link, use `render={<Link … />}`.

## 10. Icons

- Use `lucide-react`, for example `import { PlusIcon } from 'lucide-react'`.
- Inside a component, the component sizes the icon, as the skill's [`rules/icons.md`](../shadcn/rules/icons.md) says. A standalone icon takes a scale class such as `size-4`, not fixed pixels, so it follows the text beside it.
- An icon inside a control that has text (a button, menu item, badge, alert or tab) needs no attribute: an `<svg>` without a title adds nothing to the control's accessible name, which is why the examples leave it bare. An icon-only button gets its name from `aria-label`. A decorative icon standing on its own outside a control may take `aria-hidden='true'`.

## 11. Application-wide consistency

- **The application must look like one product.** Before writing a component, look at how neighboring pages handle the same problem: spacing scale, heading sizes, cards or flat sections, where actions go. Follow them.
- **When a different look is genuinely needed, change it globally.** Change the tokens in `client/theme/themes/*.css` ([`theme.md`](theme.md)), or change the component all pages share, so the whole application changes together.
- **Do not change only the part you are working on.** A page with its own spacing, button styling, or color scheme is a defect. If you think the application's style should change, raise it and change it globally; do not let one page's look diverge.

## 12. Dark mode

- Light and dark come from the same set of tokens; if the tokens are used correctly, dark mode is correct as well.
- `client/theme/` owns the theme Provider and the header's Appearance popover (`theme-settings.tsx`): the color mode can be light, dark, or follow the system, and the theme can be Compact (the default) or Spacious.
- Use the `dark:` prefix only for the few cases tokens cannot express. Frequently needing `dark:` usually means literal colors have crept in.
- Check both modes before finishing.

## 13. Loading, empty, and error states

- Every view that loads data needs these three states (for the four list states, see [`table.md`](table.md); for how to handle loading and errors, see [`api.md`](api.md)).
- Components: `Loading` (`@/components/loading`, the shared loading indicator) and `Spinner` (a small loading indicator in a button or toolbar) ship with the template; `Skeleton` (a skeleton screen that preserves the layout), `Empty` (empty state) and `Alert` (error message) are added with `yes n | pnpm exec shadcn add skeleton empty alert`.
- Put loading feedback inside the surface that is loading. A page-level loading indicator rendered for a dialog's content appears behind the dialog, not inside it.

## 14. Verification

- Both light and dark display correctly; when spacing, type, radius or shadow changed, also check both the Compact and Spacious presets, which differ in exactly those.
- The page's spacing, fonts, and component usage match the neighboring pages.
- Ordinary colors, fonts, spacing, radius, and shadows are all controlled by tokens; the reason for each deliberate fixed value is known.
- If you changed fonts, font sizes, spacing, or shadows, check Chinese and long text, narrow screens (375px), and overlay content (menus, dialogs).
- Interactive elements can be reached and operated with the keyboard, and the focus style is visible.
- Loading, empty, and error states all display correctly.
