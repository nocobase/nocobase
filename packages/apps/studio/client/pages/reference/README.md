# Reference pages

Worked source to read before building a page of your own. Nothing routes anything in this directory: a build never reaches it, no user sees it, and `tests/logic/client-routes.test.ts` fails if a page here reaches the router. Copy structure out of it; never import from it or give one of its pages a route.

Two groups share the frame in `shared.tsx`:

- `examples/` holds eight complete business screens on mock data. Each is a folder with the page beside the data it reads, as `orders/orders.tsx` and `orders.data.ts`.
- `components/` holds one page per shadcn/ui primitive, showing its variants, its states and a realistic use.

Their wording lives in `locales/` here rather than in `client/locales/`, so a reference page given a route shows key paths until its strings are moved by hand.

## How to use this directory

1. Find the row below that matches the screen you are asked for and open that example page. Its module comment names every pattern the page holds, the component or block that holds each one, and the filler it carries for demonstration only.
2. Read the blocks you need, not the whole page. Each example is 600 to 1000 lines because it shows several patterns at once; a real screen usually needs two or three.
3. When one interaction is unclear, open its component page from the second table. It shows the primitive's real API here, which is Base UI and differs from the Radix-based shadcn found elsewhere.
4. Copy the skeleton: `PageContainer` and `PageHeader`, the token classes, the state shape, the `render` and `data-icon` conventions. Leave behind the mock data module, the `ExamplePage` frame and the filler the header comment lists. Move strings into `client/locales/` under your own keys.

## Examples: which screen to start from

| You are building                                        | Start from                              | The blocks to read                                                                                                                        |
| ------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A list with filters, sorting, selection and row actions | `examples/orders`                       | `columns`, the `DataTable` toolbar, the `actions` column cell, `StatCard`, the status `Tabs` with counts                                  |
| A directory that can be viewed as cards or as a table   | `examples/customers`                    | The `ToggleGroup` view switch and `visible`, the `Card` grid, `CustomerMenu` reused by both views, the `Empty` no-results block           |
| A detail panel that opens from a row                    | `examples/orders`, `examples/customers` | The `Sheet` block keyed off a nullable row; customers adds `Tabs` inside the panel and `ProfileRow` definition lists                      |
| A record create or edit form                            | `examples/product-form`                 | `draft` and `update`, `errors` and `handleSubmit`, the Details card for text and combobox fields, the sticky save bar                     |
| A short create dialog                                   | `examples/orders`, `examples/customers` | `submitNewOrder` or `submitCustomer` reading `FormData`, the `Dialog` block with `FieldGroup`                                             |
| Confirming a destructive action                         | `examples/orders`                       | `confirmCancel` and the `AlertDialog` block; product-form's Danger zone shows the trigger form                                            |
| A dashboard with KPIs and charts                        | `examples/dashboard`                    | `StatCard`, the `ChartConfig` objects, the `AreaChart` and `PieChart` blocks, the recent-orders `Card`                                    |
| A settings area with tabs                               | `examples/team-settings`                | `TABS` and the controlled `Tabs`, the horizontal `Field`s in General, the notification `FieldGroup` of switches, the billing `RadioGroup` |
| A table with inline editing                             | `examples/team-settings`                | The members `Table` and `changeRole`                                                                                                      |
| A master/detail split with a message thread             | `examples/inbox`                        | The `ResizablePanelGroup`, `ConversationRow`, `ThreadMessage`, the `MessageScrollerProvider` keyed by `selected.id`                       |
| A calendar or schedule                                  | `examples/schedule`                     | The `Calendar` with `eventDays`, `shift` navigation, `EventCard`, the `AGENDA_HOURS` grid, the `Drawer` form, `useLocale()` for dates     |
| A multi-select with chips                               | `examples/schedule`                     | The attendees `Combobox multiple` and `useComboboxAnchor`                                                                                 |
| A step-by-step questionnaire or wizard                  | `examples/survey`                       | The `Questionnaire` block, `ChoiceQuestion`, `RatingQuestion`, `SliderQuestion`, `summary`                                                |
| A prose or help panel                                   | `examples/survey`                       | The `Typography*` about card and the FAQ `Accordion`                                                                                      |
| A page whose dates must follow the user's language      | `examples/schedule`                     | `useLocale()` mapped to a `date-fns` locale and passed to `format`, `Calendar` and `DatePicker`                                           |

## Components: which primitive shows the interaction

Grouped by what you need. Each row is a file under `components/`.

### Actions and feedback

| You need to                                          | Read               | Worth knowing                                                                                                                                                                                                   |
| ---------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A clickable action                                   | `button.tsx`       | Icons beside text take `data-icon='inline-start'` or `'inline-end'`; icon-only uses an `icon-*` size and `aria-label`                                                                                           |
| Join related buttons or a split button               | `button-group.tsx` | Sizes go on each `Button`; an `Input` is a legal child                                                                                                                                                          |
| A button that holds an on/off state                  | `toggle.tsx`       | State is `pressed` and `onPressedChange`, not `checked`                                                                                                                                                         |
| Switch a view mode or toggle several filters         | `toggle-group.tsx` | `value` is an array even for single select; `spacing={0}` welds the items                                                                                                                                       |
| Confirm a consequential action                       | `alert-dialog.tsx` | `AlertDialogTrigger render={<Button />}`; `AlertDialogAction variant='destructive'`; guard `onOpenChange` while pending                                                                                         |
| Confirm that something completed, with optional undo | `toast.tsx`        | Take `const toaster = useToaster()` at the top of the component, call `toaster.show({ type, title, description })` from handlers, and do not copy a page's own `<Toaster />`. `toast.promise` is on the manager |
| An inline status or error banner                     | `alert.tsx`        | The icon is a direct child of `Alert`; `AlertAction` is its own slot                                                                                                                                            |
| Signal indeterminate work                            | `spinner.tsx`      | Sized with `className='size-4'`; inside buttons it takes `data-icon` like an icon                                                                                                                               |
| Show determinate progress                            | `progress.tsx`     | `ProgressLabel` and `ProgressValue` are children of `Progress`                                                                                                                                                  |
| Hold layout while data loads                         | `skeleton.tsx`     | No props; shape it with `className` to match the real content's boxes                                                                                                                                           |
| Explain an icon button on hover                      | `tooltip.tsx`      | Wrap the page in `TooltipProvider`; a disabled button needs a `span` wrapper as trigger                                                                                                                         |
| Print a keyboard shortcut                            | `kbd.tsx`          | Display only; inside a button it takes `data-icon='inline-end'`                                                                                                                                                 |

### Overlays and menus

| You need to                                      | Read                  | Worth knowing                                                                                                             |
| ------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| A modal for a short form or confirmation         | `dialog.tsx`          | Size is a `className` on `DialogContent`; triggers use `render={<Button />}`                                              |
| A panel sliding in from an edge                  | `sheet.tsx`           | `side` is on `SheetContent`; the body needs its own padding and `min-h-0 flex-1 overflow-y-auto` to scroll                |
| A swipe-to-dismiss panel, snap points, non-modal | `drawer.tsx`          | Position comes from `swipeDirection`; `snapPoints` take CSS lengths                                                       |
| A small anchored panel, inline edit              | `popover.tsx`         | Seed draft state in the `onOpenChange(true)` branch so cancel discards cleanly                                            |
| A preview on hover over a link                   | `hover-card.tsx`      | `delay` and `closeDelay` go on the trigger, `side` on the content                                                         |
| A menu of actions off a button                   | `dropdown-menu.tsx`   | Every `Label` and `Item` block sits inside a `DropdownMenuGroup`; item icons take no `data-icon`; `variant='destructive'` |
| Right-click actions                              | `context-menu.tsx`    | The trigger is the target element itself and takes `className` directly                                                   |
| A persistent File/Edit/View bar                  | `menubar.tsx`         | Each menu is `MenubarMenu > MenubarTrigger + MenubarContent`                                                              |
| A filterable command palette                     | `command.tsx`         | `CommandDialog` needs `title` and `description`; items use `onSelect`                                                     |
| Collapse content behind a toggle                 | `collapsible.tsx`     | `CollapsibleTrigger render={<Button />}`; rotate the chevron off `group-data-panel-open/button`                           |
| Expandable FAQ or settings sections              | `accordion.tsx`       | `value` is an array even in single mode; `multiple` is a boolean prop                                                     |
| Marketing-style top navigation with panels       | `navigation-menu.tsx` | `NavigationMenuLink render={<a />}`; bare links need `navigationMenuTriggerStyle()`                                       |

### Forms and inputs

| You need to                                              | Read                | Worth knowing                                                                                                                                                   |
| -------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lay out and validate any form control                    | `field.tsx`         | `FieldSet > FieldLegend + FieldGroup > Field > FieldLabel + control + FieldDescription/FieldError`; `data-invalid` on `Field` and `aria-invalid` on the control |
| A label outside the Field layout                         | `label.tsx`         | Prefer `FieldLabel` inside `Field`; `Label` is for ad-hoc layouts                                                                                               |
| One line of text                                         | `input.tsx`         | No `size` prop; width via `className`; `type='file'` is styled by the same component                                                                            |
| Multi-line text                                          | `textarea.tsx`      | Height via `rows`; counters derive from `maxLength`                                                                                                             |
| Prefixes, suffixes or buttons on a text field            | `input-group.tsx`   | `align='inline-start' \| 'inline-end' \| 'block-start' \| 'block-end'`; use `InputGroupInput`, not `Input`                                                      |
| A short verification code                                | `input-otp.tsx`     | `maxLength` on the root and an explicit `InputOTPSlot` per index; `onChange` gives a string                                                                     |
| One of a modest, non-searchable list                     | `select.tsx`        | Pass `items` to the root so `SelectValue` renders the label; `onValueChange` gives `string \| null`                                                             |
| A plain OS `<select>`                                    | `native-select.tsx` | A real `select`: `onChange(event)`, not `onValueChange`                                                                                                         |
| One of many options, typed to filter; multi-select chips | `combobox.tsx`      | `items` on the root and a `ComboboxList` render prop; chips need `useComboboxAnchor`                                                                            |
| Exactly one of a short list                              | `radio-group.tsx`   | `onValueChange` gives `unknown`; guard it                                                                                                                       |
| One boolean, or select-many rows                         | `checkbox.tsx`      | `indeterminate` is a separate boolean prop; `onCheckedChange` gives a boolean                                                                                   |
| A setting that takes effect immediately                  | `switch.tsx`        | Put the `Switch` after `FieldContent` in a horizontal `Field` so it lands on the right                                                                          |
| A number or range by dragging                            | `slider.tsx`        | `value` is an array but `onValueChange` reports a bare number for one thumb; normalise it                                                                       |
| A day or a range in a form field                         | `date-picker.tsx`   | App-level `DatePicker` and `DateRangePicker`: `value` and `onChange`, `calendarProps` for react-day-picker options                                              |
| A day or range picked inline                             | `calendar.tsx`      | `locale` is a `date-fns` locale object; `disabled` takes matchers                                                                                               |
| A one-question-at-a-time survey                          | `questionnaire.tsx` | A stepper form: `items` on the root, `QuestionnaireItem name` per step, answers read from `FormData`                                                            |

### Data display

| You need to                                                | Read               | Worth knowing                                                                                                                      |
| ---------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| A sortable, filterable, paginated record list              | `data-table.tsx`   | App-level `DataTable` on TanStack Table: `ColumnDef[]` in `useMemo`, `toolbar`, `onRowClick`, `pagination={false}`                 |
| A static table you mark up yourself                        | `table.tsx`        | `TableFooter` for totals; density via `className`; use `data-table.tsx` when you need sorting                                      |
| Step through pages of records                              | `pagination.tsx`   | `PaginationLink isActive`; links are anchors, so `preventDefault` in `onClick`                                                     |
| A titled block with its own actions                        | `card.tsx`         | `CardAction` is a header slot; edge-to-edge lists use `--card-spacing`                                                             |
| A compact record row with media, title and trailing action | `item.tsx`         | The generic list row; `Item render={<a />}` makes it a link                                                                        |
| A record's status or a count                               | `badge.tsx`        | `Badge render={<Link />}`; icons take `data-icon`                                                                                  |
| A person or organisation with fallback and presence        | `avatar.tsx`       | `AvatarBadge` has no status variant; recolor with tokens and add an `sr-only` label; `AvatarGroupCount` for overflow               |
| Fill a panel that has no records yet                       | `empty.tsx`        | `EmptyMedia variant='icon'`; actions go in `EmptyContent`                                                                          |
| Where a detail page sits in the hierarchy                  | `breadcrumb.tsx`   | `BreadcrumbLink render={<Link />}`; the last crumb is `BreadcrumbPage`. Routed pages use `Breadcrumbs` from `@/components` instead |
| Long-form prose                                            | `typography.tsx`   | App-level `Typography*` components with built-in rhythm                                                                            |
| A themed bar, area, line, pie or radial chart              | `chart.tsx`        | `ChartConfig` keys match `dataKey`s; colors are `var(--chart-N)`; pie radii are pixels, so give a pixel height                     |
| Media locked to a ratio                                    | `aspect-ratio.tsx` | `ratio` is a computed number such as `16 / 9`                                                                                      |
| Swipe through a small set of cards                         | `carousel.tsx`     | `setApi` for dots and programmatic scroll; clean up `api.on` listeners                                                             |
| Switch panels of one record without navigating             | `tabs.tsx`         | `variant` is on `TabsList`; `orientation='vertical'` is on `Tabs`                                                                  |
| A rule between sections                                    | `separator.tsx`    | A vertical separator needs a height from its parent                                                                                |
| A bounded region with a styled scrollbar                   | `scroll-area.tsx`  | Horizontal scrolling needs `whitespace-nowrap`, an inner `w-max` and an explicit `ScrollBar orientation='horizontal'`              |
| A draggable split between panes                            | `resizable.tsx`    | Sizes are CSS strings; `orientation`, not `direction`; the group needs a bounded height                                            |
| The app shell's navigation rail                            | `sidebar.tsx`      | Everything sits in `SidebarProvider`; routing through `render={<Link />}`. The application's layouts already own this              |
| Verify a screen in right-to-left                           | `direction.tsx`    | `DirectionProvider` plus the `dir` attribute; use logical utilities such as `ms-auto` and `ps-3`                                   |

### Chat and timelines

| You need to                                          | Read                   | Worth knowing                                                                                                           |
| ---------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| One message balloon with reactions                   | `bubble.tsx`           | `BubbleContent render={<button />}` makes it tappable                                                                   |
| A chat turn: avatar, name, bubble, time              | `message.tsx`          | `Message` is the row layout, `Bubble` the balloon inside `MessageContent`; an empty `MessageAvatar` reserves the gutter |
| A growing log pinned to the newest message           | `message-scroller.tsx` | Wrap in `MessageScrollerProvider`; hooks only work inside it, so header controls must be a child component              |
| A system note in a timeline, such as a day separator | `marker.tsx`           | `variant='separator'` draws rules on both sides; `role='status'` for live updates                                       |
| An uploaded file row with progress and remove        | `attachment.tsx`       | `state` drives styling only; you supply the progress text                                                               |

## Conventions every page follows

- **Base UI, not Radix.** Composition is `render={<Element />}` on the primitive; `asChild` does not exist here. Triggers take `render={<Button variant='outline' />}`, links take `render={<Link to='…' />}`.
- **`data-icon` only beside text.** An icon, `Spinner` or `Kbd` next to a label inside `Button`, `Badge` or `InputGroupButton` carries `data-icon='inline-start'` or `'inline-end'`. Icon-only buttons and structural icon slots such as `DropdownMenuItem`, `Alert`, `TabsTrigger` and `ItemMedia` take none.
- **Menus group their items.** A `DropdownMenuLabel` or `DropdownMenuItem` lives inside a `DropdownMenuGroup`; Base UI reads the group from context.
- **Validity is a pair.** `data-invalid` on `Field` and `aria-invalid` on the control, always together.
- **Nullable values from Base UI.** `Select`, `Combobox`, `RadioGroup` and menu radio items hand back `T | null` or `unknown` from `onValueChange`; coalesce or guard before storing.
- **Overlays keyed off a nullable entity** use `open={x !== null}` with `onOpenChange={(open) => { if (!open) setX(null); }}`.
- **Colors are tokens.** `bg-card`, `text-muted-foreground`, `var(--chart-N)`; a `dark:` variant appears once in the whole tree. Numbers use `tabular-nums` and a memoised `Intl.NumberFormat` bound to `i18n.language`; dates use `date-fns` `format`.
- **Every string is a translation key** read through `useTranslation()` from `@nocobase/i18n/client`.
- **Toasts need a `Toaster`.** The pages mount `<Toaster />` as their first child because nothing routes them into the application, whose shell mounts the only one; a routed page shows toasts with `useToaster()` and mounts none.
