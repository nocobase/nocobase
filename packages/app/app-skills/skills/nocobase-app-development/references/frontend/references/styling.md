# Components and styling

The UI is composed of shadcn/ui primitives (the Base UI version) and styled with Tailwind utility classes and the theme's semantic tokens. For what the UI should look like, see `../ui-guidelines.md` ("F Foundations", "L Page structure", "A Accessibility and adaptation"); for the full token reference and theme presets, see `theme.md`.

## 1. Read the reference pages first

`client/pages/reference/` holds worked example source: it has no routes, the build does not bundle it, and users never see it. Before you write a page, read its `README.md`:

- The first table: the page you are building → which `examples/` page to start from and which blocks to read. `examples/` has eight complete business pages (orders, customers, a form, a dashboard, and more); each page sits in the same directory as the mock data it reads, for example `examples/orders/orders.tsx` and `orders.data.ts`. The comment at the top of each page lists the patterns it contains and the matching code blocks; read only the blocks you need.
- The second table: the interaction you need → which `components/<component>.tsx` to read. Each primitive has one page showing how it is actually used in this application: which parts it needs, its controlled usage, and how each state is styled. Do not infer an API from memory or from Radix-based examples on the web.

Rules for using them:

- Copy only the structure and the token usage: `PageContainer` and `PageHeader`, card grids, `DataTable`, and how `render` and `data-icon` are written. Do not carry over the mock data, the `ExamplePage` frame in `shared.tsx`, or the demonstration content marked in the comments.
- Do not import anything from the reference pages, and do not add routes for them. If a reference page reaches the router, `tests/logic/client-routes.test.ts` fails.
- The reference pages' copy lives in `client/pages/reference/locales/`, not in the application's copy. For UI you copy over, rewrite the copy under `client/locales/` with your own keys (see `i18n.md`).
- Do not copy these two things as they are:
  - **Toasts**: the reference pages call the Base UI `toast` manager from `@/components/ui/toast` and each mounts its own `<Toaster />`, because nothing routes them and no application runs around them. In this application, show the same toast with `useToaster()` and leave the `<Toaster />` behind; see section 7.
  - **How they open**: the create dialog and the detail `Sheet` in the reference pages use open state held inside the component. In this application, create, edit, and detail views are child routes by default (`RouteDialog` / `RouteDrawer`, see `overlay.md`); you can borrow their appearance, but write how they open as `overlay.md` describes.

## 2. Components are built on Base UI, not Radix

The `style` in `components.json` is `base-nova`, so every component in `client/components/ui/` is built on Base UI. Most shadcn examples on the web are the Radix version, which is written differently; the first difference you run into is composition:

| This application (Base UI)                                       | Radix version (examples elsewhere)   |
| ---------------------------------------------------------------- | ------------------------------------ |
| `<Button render={<Link to='/projects' />} nativeButton={false}>` | `<Button asChild><Link …/></Button>` |
| `<DialogTrigger render={<Button variant='outline' />}>`          | `<DialogTrigger asChild>`            |
| `<DropdownMenuTrigger render={<Button size='icon' />}>`          | `<DropdownMenuTrigger asChild>`      |

- There is no `asChild`; passing it is a type error. Pass the element to render as through `render`, and give that element **no children**; write the children between the component's opening and closing tags, and the props are merged automatically.
- When `Button` renders as a link or another non-`<button>` element, add `nativeButton={false}`.

Other patterns:

| Pattern                                                                                                  | Notes                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Put `DropdownMenuLabel` inside `DropdownMenuGroup` (or `DropdownMenuRadioGroup`)                         | Outside one, it throws `MenuGroupContext is missing` at runtime. The reference pages wrap each group's `Label` and `Item` elements in `DropdownMenuGroup` |
| Pass `items` (`{ value, label }[]`) to `Select`                                                          | Without it, the `SelectValue` in the trigger shows the raw value instead of the label                                                                     |
| `Select`'s `onValueChange` can pass `null`                                                               | Check before storing it. The same applies to `Combobox`                                                                                                   |
| The value passed by `onValueChange` of `RadioGroup` and `DropdownMenuRadioGroup` has no specific type    | Validate that it is an allowed value before using it                                                                                                      |
| Give an icon in a button `data-icon='inline-start'` (before the text) or `'inline-end'` (after the text) | The button adjusts its padding accordingly. Icons in icon-only buttons, menu items, `Alert`, `TabsTrigger`, and `ItemMedia` do not get it                 |
| Open on hover: set `openOnHover` and `delay={0}` on the trigger                                          | Component options of `DropdownMenu` and `Popover`; do not write your own mouse event handlers. For when to use it, see section 12                         |
| Close on selection: add `closeOnClick` to radio items and checkbox items                                 | By default, a radio item does not close the menu when selected                                                                                            |

`Select`:

```tsx
// client/pages/projects/project-status-select.tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  Select,
  SelectContent,
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
  const items = PROJECT_STATUSES.map((status) => ({
    value: status,
    label: t(`projects.status.${status}`),
  }));
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
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

Dropdown menu (group label, radio items, close on selection):

```tsx
// client/pages/projects/project-status-menu.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronDownIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { PROJECT_STATUSES, type ProjectStatus } from './types.js';

export function ProjectStatusMenu({
  status,
  onChange,
}: {
  readonly status: ProjectStatus;
  readonly onChange: (status: ProjectStatus) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' />}>
        {t(`projects.status.${status}`)}
        <ChevronDownIcon data-icon='inline-end' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        {/* DropdownMenuLabel must be inside DropdownMenuGroup. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('projects.fields.status')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={status}
            onValueChange={(next: unknown) => {
              // The radio group's value has no specific type; confirm it is a valid status first.
              const matched = PROJECT_STATUSES.find((item) => item === next);
              if (matched) onChange(matched);
            }}
          >
            {PROJECT_STATUSES.map((item) => (
              // A radio item does not close the menu on selection by default; add closeOnClick when selecting completes the action.
              <DropdownMenuRadioItem key={item} value={item} closeOnClick>
                {t(`projects.status.${item}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

For the "More" menu in table rows, see `table.md`.

## 3. Page container: PageContainer

Wrap a page component's content in `PageContainer` (`@/components/page-container`). It renders a `section` and owns the full width, the spacing between blocks, and the responsive padding (`w-full space-y-6 p-6 md:p-8`).

```tsx
// client/pages/projects/index.tsx (skeleton)
import { useTranslation } from '@nocobase/i18n/client';
import { PlusIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function ProjectsPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader
        title={t('projects.title')}
        description={t('projects.description')}
        actions={
          <Button render={<Link to='new' />} nativeButton={false}>
            <PlusIcon data-icon='inline-start' />
            {t('projects.create.action')}
          </Button>
        }
      />
      {/* The toolbar, the table, and the loading, empty, and error states all go here; the child routes' <Outlet /> goes at the end (see overlay.md) */}
    </PageContainer>
  );
}
```

- Do not hand-write an outer `div`, `main`, or `section` with page padding.
- Put the title, breadcrumbs, actions, content, and the loading, empty, and error states inside `PageContainer`.
- It accepts native `section` props and merges `className`. Do not change its spacing on a single page; to adjust page spacing across the application, change the component itself.
- Child routes:
  - Inline child pages and tab content are part of the parent page and are wrapped by the parent's `PageContainer`; the child page must **not** add another layer.
  - A covering child page places its own `PageContainer` inside `RouteChildPage`.
  - Dialogs and drawers use the overlay's own container: `RouteDialog` / `RouteDrawer` already have a title area, a scrollable content area (`p-4`), and a footer button area; do not nest a `PageContainer` or add outer padding inside the content.
  - For details, see `child-routes.md` and `overlay.md`.

## 4. Use shadcn

First check whether `client/components/ui/` has the component you need. If it does not, add it from the shadcn registry:

```bash
pnpm exec shadcn add card
pnpm exec shadcn add dialog table badge
```

- The CLI writes into `client/components/ui/`, as `components.json` configures.
- Adding is the first choice. Do not hand-write a button, dialog, or select that shadcn already provides, and do not copy one from another project.

To see what a component provides before adding it:

```bash
pnpm exec shadcn view card                 # the source it will write
pnpm exec shadcn docs card                 # docs and example links
pnpm exec shadcn search @shadcn -q dialog  # search by keyword
```

`search` takes a registry name (such as `@shadcn`) plus a `-q` query, not a component name; without a registry name, it searches every registry configured in `components.json`.

## 5. Customize template and registry components

When a component provided by the template or a registry (for example `nocobase-auth-ui` or `nocobase-file-component-ui` under `client/extensions/`) needs different behavior or a different appearance, choose in this order:

1. **Use existing capabilities first**: props, slots, page composition.
2. **If that is not enough, write the application's own component**: put it in `client/components/` (or the feature's own directory, not under `client/extensions/`), compose it from the existing primitives and public hooks, then switch the pages that use the original over to the new component. Keep the original extension files for reuse and upgrades.
   - The new component must genuinely control the behavior you need. Hiding a hard-coded link with CSS or DOM manipulation is not customization.
   - The new component keeps theme tokens, accessibility, validation, and loading and error handling; do not reimplement the underlying service.
3. **Change the original component only as a last resort**: modify a template-provided component only when the user explicitly asks for it or composition genuinely cannot do the job; keep the change as small as possible and explain why. The application owns this code, but editing `client/extensions/` is not the default way to customize.

Also:

- Do not modify the primitives in `client/components/ui/` for a single page. When you need a different look, first check for props such as `variant` and `size`; for a global change, change the theme (`theme.md`).
- When changing a shared composed component under `client/components/`, only add optional props and keep the default behavior unchanged (see `table.md`).

## 6. Compose upward

`client/components/ui/` holds the primitives. Build your own components by composing them: components shared across the application go in `client/components/`, and components only one page uses go in that page's directory.

`client/components/` already has a few composed components (shadcn treats them only as patterns in its documentation and does not publish them to the registry). Use them first instead of writing from scratch:

| Component                                                                           | Purpose                                                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PageContainer`, `PageHeader`                                                       | Page frame: padding, title, description, actions area                                      |
| `DataTable`, `DataTableColumnHeader`, `DataTablePagination`, `DataTableViewOptions` | Sortable, filterable, paginated lists built on TanStack Table (`table.md`)                 |
| `DatePicker`, `DateRangePicker` (`date-picker.tsx`)                                 | Date and date range selection with `Popover` plus `Calendar`                               |
| `Typography*` (`typography.tsx`)                                                    | Long-form text: headings, paragraphs, lists, quotes                                        |
| `Breadcrumbs`                                                                       | Breadcrumbs generated from routes' `breadcrumb` declarations (`page.md`)                   |
| `RouteDialog`, `RouteDrawer`, `RouteChildPage`                                      | Dialogs, drawers, and covering child pages opened by URL (`overlay.md`, `child-routes.md`) |
| `Loading`                                                                           | The shared loading indicator                                                               |

Composition example:

```tsx
// client/pages/projects/project-summary-card.tsx
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useMemo } from 'react';

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { ProjectStatusBadge } from './status-badge.js';
import type { Project } from './types.js';

export interface ProjectSummaryCardProps {
  readonly project: Project;
}

/** A page's own composed component: keep it in the page directory; move it to client/components/ once several pages use it. */
export function ProjectSummaryCard({
  project,
}: ProjectSummaryCardProps): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }),
    [locale],
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardAction>
          {/* Shares one status component with the list, so a status looks the same everywhere. */}
          <ProjectStatusBadge status={project.status} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className='grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm'>
          <dt className='text-muted-foreground'>
            {t('projects.fields.owner')}
          </dt>
          <dd>{project.owner ?? '—'}</dd>
          <dt className='text-muted-foreground'>
            {t('projects.fields.updatedAt')}
          </dt>
          <dd>{dateFormat.format(new Date(project.updatedAt))}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
```

For the `ProjectStatusBadge` code, see `i18n.md`. Do not reimplement a primitive's behavior: focus, keyboard interaction, and ARIA attributes are already handled in the shadcn components, and they are easy to get wrong by hand.

### Charts

Charts use `recharts`, wrapped in `ChartContainer` (`@/components/ui/chart`) with a `ChartConfig`:

- The keys of `ChartConfig` match `dataKey`; `label` is used by the tooltip and the legend; `color` is `var(--chart-1)` through `var(--chart-5)`.
- `ChartContainer` writes each key's color to a CSS variable `--color-<key>`; set the shapes' `fill` and `stroke` to `var(--color-<key>)`. The chart library does not pick theme colors on its own, so you must reference them explicitly like this.
- `ChartContainer` is `aspect-video` by default; for a fixed height, write `className='aspect-auto h-64 w-full'`. A pie chart's radius is in pixels, so give the container a definite height, as `h-64` does.
- For more chart types (area, line, pie, donut), see the reference pages `components/chart.tsx` and `examples/dashboard`.

```tsx
// client/pages/projects/project-status-chart.tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

import { PROJECT_STATUSES, type Project } from './types.js';

export function ProjectStatusChart({
  projects,
}: {
  readonly projects: readonly Project[];
}): ReactElement {
  const { t } = useTranslation();
  // The config keys match dataKey; colors come from the theme's chart tokens, so they follow light, dark, and every preset.
  const config = {
    count: { label: t('projects.chart.count'), color: 'var(--chart-1)' },
  } satisfies ChartConfig;
  const data = PROJECT_STATUSES.map((status) => ({
    status: t(`projects.status.${status}`),
    count: projects.filter((project) => project.status === status).length,
  }));
  return (
    <ChartContainer config={config} className='aspect-auto h-64 w-full'>
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='status'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        {/* ChartContainer writes the colors in config as --color-<key>. */}
        <Bar dataKey='count' fill='var(--color-count)' radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
```

## 7. Toasts

- Get the toaster with `const toaster = useToaster()` from `@nocobase/app-client`, and call `toaster.show({ type, title })` in event handlers. `type` is `'success'`, `'info'`, `'warning'`, `'error'`, or `'loading'`; `description` adds a second line.
- How a toast is presented is decided once, in `client/lib/toaster.ts`, for the application's toasts and the plugins' alike: it forwards to the Base UI `toast` manager and announces an error written as plain text to screen readers at once. Any other error — one with an action, or whose title or description is an element rather than text — keeps the default priority, because it may hold a control, and Base UI hides a high-priority toast's controls from assistive technology until its viewport is focused. Clicking an action runs its `onClick` and leaves the toast open.
- You do not need to mount a `Toaster` yourself. `client/react-providers.ts` mounts the application's `Toaster` once, in the `application` layer, and `client/service-provider.ts` registers the toaster service that feeds it: toasts appear in the bottom-right corner and take their colors from `--popover`, `--popover-foreground`, and `--border`, so they follow the theme. Mounting another one renders every toast twice, because both listen to the same `toast` manager.
- Toasts stay above dialogs, sheets and popovers because a `[data-slot='toast-viewport']` rule at the end of `client/styles.css` lifts the viewport to `z-index: 100`. Every overlay in `client/components/ui/` uses `z-50`, and the toaster, mounted first, would otherwise paint under a dialog opened later. Keep that rule, and leave the generated component's `z-50` alone.
- Plugin pages report through the same `useToaster()`. Keep the toaster service's registration in `client/service-provider.ts` and the `toaster` entry that mounts the `Toaster` component in `client/react-providers.ts` when you customize them: without the registration nothing throws, but every toast is only logged to the browser console.
- For which kind of message to use in which situation and how to write the copy, see `api.md` and `../ui-guidelines.md` (T3.7, C5, C6).

## 8. Semantic tokens

For the full token reference (names, meanings, defaults, units), see `theme.md`. When writing styles, use semantic class names; do not write literal colors, fonts, font sizes, or shadows.

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
- Spacing: `gap-2` (between related controls), `gap-4`, `gap-6` (between blocks; `PageContainer` already provides it), `p-4`, `p-6`. Do not use `mt-[7px]`.
- Sizes: numeric classes such as `h-8`, `size-4`, and `w-64`, which scale with `--spacing`.
- Radius: `rounded-md`, `rounded-lg`; shadows: `shadow-sm`, `shadow-md`. Usually just use the component defaults.
- Deliberate fixed values (image sizes, viewport-related limits, circular icons) may stay, but confirm that fixed sizes, separately set line heights (`leading-*`, `text-sm/6`), and shadow color classes (`shadow-black/30`) do not override the theme's settings; state the reason in the design file (`../ui-guidelines.md` F7).
- Do not globally rewrite isolated third-party content to unify the look. Font variables take effect only after the font resources have loaded (see `theme.md`).

### Common layouts

| Scenario                               | Classes                                             |
| -------------------------------------- | --------------------------------------------------- |
| Toolbar                                | `flex flex-wrap items-center gap-2`                 |
| Search box width                       | `w-full sm:max-w-xs`                                |
| Stat card grid                         | `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`          |
| "Label — value" pairs in a detail view | `grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm` |
| Limiting form width                    | `max-w-2xl`                                         |

Merge class names with `cn()` (`@/lib/utils`), for example `cn('flex gap-2', className)`.

## 9. Buttons

`Button` (`@/components/ui/button`):

| `variant`     | Purpose                                        |
| ------------- | ---------------------------------------------- |
| `default`     | Primary action; at most one per view           |
| `outline`     | Secondary actions, cancel                      |
| `secondary`   | Secondary actions (with a background fill)     |
| `ghost`       | Lightweight actions in toolbars and table rows |
| `destructive` | Destructive actions                            |
| `link`        | A button that looks like a link                |

`size`: `default`, `xs`, `sm`, `lg`; for icon-only buttons, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.

- Icons in a button: `<PlusIcon data-icon='inline-start' />`; the button handles spacing and size automatically.
- Rendering as a link: `<Button render={<Link to='/projects' />} nativeButton={false}>`.
- An icon-only button must have an `aria-label`; an icon button for a standalone action also gets a tooltip (a "More" button that opens a menu does not need one):

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
- A disabled button does not respond to mouse events; to give it a tooltip explaining why, wrap the button in a `span` and use that as the trigger (see the reference page `components/tooltip.tsx`).

## 10. Badge

`Badge` (`@/components/ui/badge`) `variant` values: `default`, `secondary`, `outline`, `destructive`, `ghost`, `link`.

- Status data needs text; do not rely on color alone to tell values apart.
- Make each enum (for example project status) one component, shared by the list and the detail view (`ProjectStatusBadge`, see `i18n.md`).
- Icons in a Badge also get `data-icon`; to render it as a link, use `render={<Link … />}`.

## 11. Icons

- Use `lucide-react`, for example `import { PlusIcon } from 'lucide-react'`.
- For a standalone icon, size it with a scale class such as `size-4`, not fixed pixels, so the icon follows the text beside it.
- Inside buttons and menu items, the component controls the size; do not set it separately.
- Decorative icons (with text already beside them) get `aria-hidden='true'`; an icon-only button gets its name from `aria-label`.

## 12. Header icon buttons

The icon button area in the top-right corner of the page is in `client/layouts/components/header-actions.tsx` (the layout's header, not `PageHeader`'s `actions`). Choose the hover behavior by what the entry does:

| What the entry does                                     | On hover                                                                                                           | Examples                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Navigates to another page                               | Show a short tooltip describing the destination or purpose                                                         | Component examples, Settings, Notifications |
| Opens a menu or configuration panel on the current page | Open the panel on hover; close it once the pointer leaves the trigger and panel area. Do not add a tooltip as well | Appearance, account menu                    |

This file is layout code provided by the template. When you change it, comment in the code what you changed and why, so that a later template upgrade can judge whether the change is still needed (see `AGENTS.md`).

### Navigation entries

Use `Tooltip`, `TooltipTrigger`, and `TooltipContent`, and pass the router's `Link` through the trigger's `render`. Reuse the header's existing `TooltipProvider`, and show the tooltip below (`side='bottom'`). Declare the target page in `client/routes.ts` first (`page.md`).

```tsx
// client/layouts/components/header-actions.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { CircleHelp, MonitorCog, Settings } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
// … (the other imports and ACTION_LINK_CLASS stay unchanged)

export function HeaderActions({
  showSettings,
  showDev,
}: {
  readonly showSettings: boolean;
  readonly showDev: boolean;
}): ReactElement {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <div className='flex shrink-0 items-center gap-2'>
        {/* … */}
        {/* New navigation entry: goes to the help page and shows a short hint on hover and keyboard focus. */}
        <Tooltip>
          <TooltipTrigger
            render={<Link to='/help' className={ACTION_LINK_CLASS} />}
            aria-label={t('help.title')}
          >
            <CircleHelp className='size-5' />
          </TooltipTrigger>
          <TooltipContent side='bottom'>{t('help.title')}</TooltipContent>
        </Tooltip>
        {/* … */}
      </div>
    </TooltipProvider>
  );
}
```

- Keep the link's route, access control, and button styling unchanged (reuse the file's `ACTION_LINK_CLASS`).
- Keep the hint to a few words, such as "Settings" or "Notification center"; do not write sentences like "Click here to go to…". It also shows on keyboard focus (Base UI's Tooltip does this by default; do not turn it off).
- Translate both the tooltip and the `aria-label`; an unread count can be added to the `aria-label`.
- Do not also write a native `title` attribute, or a second browser tooltip appears. An icon-only trigger must keep an accessible name.

### Menus and configuration panels

- Use `DropdownMenu` for action menus and submenus, and `Popover` for configuration panels. Set `openOnHover` and `delay={0}` on the trigger; closing has no delay (`closeDelay` defaults to 0). See `client/layouts/components/user-menu.tsx`.
- When the pointer moves from the trigger to the panel, or between a menu and the submenu it opens, the controls must stay reachable. Leave this interaction region, positioning, focus, and dismissal to the component.
- Keep opening by click and touch, keyboard navigation, and closing with Esc.
- Keep the component's default distinction: a panel opened by hover closes when the pointer leaves; a panel opened by click stays open until an outside click or Esc. Do not use custom mouseleave handlers, coordinate checks, timers, or extra open state to force a click-opened panel to close like a hover-opened one. Prefer the component's existing public options over reimplementing them yourself.
- When selecting an item completes the action, use the component's built-in dismissal: the language radio items in the account menu have `closeOnClick`, so the menu closes immediately after a selection (`language-switcher.tsx` in the same directory); by default, radio items do not close the menu on selection. The header's Appearance popover (`client/theme/theme-settings.tsx`) stays open after a selection so you can keep adjusting, and closes the way `Popover` does by default.

### Consistency

- Translate the copy and use tokens for colors. Header icon buttons match the existing entries in size, spacing, focus style, and button styling.
- Leave overlay positioning to the component, including at the right edge of the screen.
- Whichever entry you change, reuse its existing interaction tests (for example `tests/components/header-hover.test.tsx`). Do not simulate layout or submenu pointer geometry in jsdom; it does not match how a real browser behaves.

## 13. Application-wide consistency

- **The application must look like one product.** Before writing a component, look at how neighboring pages handle the same problem: spacing scale, heading sizes, cards or flat sections, where actions go. Follow them.
- **When a different look is genuinely needed, change it globally.** Change the tokens in `client/theme/themes/*.css` (`theme.md`), or change the component all pages share, so the whole application changes together.
- **Do not change only the part you are working on.** A page with its own spacing, button styling, or color scheme is a defect. If you think the application's style should change, raise it and change it globally; do not let one page's look diverge.

## 14. Dark mode

- Light and dark come from the same set of tokens; if the tokens are used correctly, dark mode is correct as well.
- `client/theme/` owns the theme Provider and the header's Appearance popover (`theme-settings.tsx`): the color mode can be light, dark, or follow the system, and the theme can be Compact (the default) or Spacious.
- Use the `dark:` prefix only for the few cases tokens cannot express. Frequently needing `dark:` usually means literal colors have crept in.
- Check both modes before finishing.

## 15. Loading, empty, and error states

- Every view that loads data needs these three states (for the four list states, see `table.md`; for how to handle loading and errors, see `api.md`).
- Components: `Loading` (`@/components/loading`, the shared loading indicator), `Skeleton` (a skeleton screen that preserves the layout), `Spinner` (a small loading indicator in a button or toolbar), `Empty` (empty state), `Alert` (error message).
- Put loading feedback inside the surface that is loading. A page-level loading indicator rendered for a dialog's content appears behind the dialog, not inside it.

## 16. Tailwind scanning

`tailwind.config.mjs` scans the application's own `client/` source and the client directories of the installed `@nocobase/app-client` and `@nocobase/app-plugin-*` packages (resolving pnpm symlinks). New files under `client/` are scanned automatically; you do not need to register them.

## 17. What not to do

- Do not write literal colors, or arbitrary-value font sizes and spacing (`text-[13px]`, `mt-[7px]`).
- Do not modify components in `client/components/ui/` for one page.
- Do not define a custom set of spacing or colors within a single page.
- Do not hand-write components shadcn already provides, and do not write `asChild`.
- Do not import from `client/pages/reference/`, and do not add routes for it.
- Do not mount another `Toaster`; show toasts with `useToaster()`.

## 18. Verification

- Both light and dark display correctly; also check both the Compact and Spacious themes, which differ in spacing, radius, and line height.
- The page's spacing, fonts, and component usage match the neighboring pages.
- Ordinary colors, fonts, spacing, radius, and shadows are all controlled by tokens; the reason for each deliberate fixed value is known.
- If you changed fonts, font sizes, spacing, or shadows, check Chinese and long text, narrow screens (375px), and overlay content (menus, dialogs).
- Interactive elements can be reached and operated with the keyboard, and the focus style is visible.
- Loading, empty, and error states all display correctly.
