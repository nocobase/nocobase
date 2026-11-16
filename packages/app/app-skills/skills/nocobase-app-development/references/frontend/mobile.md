# Phone experience

Every page works on a phone without the user asking (A4 in [`ui-guidelines.md`](ui-guidelines.md)): a person can find, read and complete its tasks by touch and with the on-screen keyboard; a desktop page that merely shrinks, wraps or scrolls sideways does not. This file holds only what changes on a phone; `PageHeader`, `DataTable`, `RowActions` and the route overlays already implement most of it.

Phone width means below `md` (768 px), where the shell swaps its sidebar for a sheet and `DataTable` switches to cards. Use `sm` (640 px) only for finer adjustments.

## Decide the phone layout while designing the page

Decide it in the page plan ([`ui-workflow.md`](ui-workflow.md)), before writing JSX: name the page's main task on a phone and what the first screen shows for it; rank the content into what stays on the first screen, what moves into a disclosure (the Filters sheet, a "More" menu, a collapsed section, the record's detail) and what stacks; and keep every capability, since moving an action into a menu is fine and removing it on phones is not.

| Region                | Phone pattern                                                             |
| --------------------- | ------------------------------------------------------------------------- |
| Page header           | `PageHeader` as shipped: title and one primary action, the rest in "More" |
| Record list           | Cards through `renderCard` (M3.1)                                         |
| Search, filters, sort | One row (M4.1)                                                            |
| Tabs                  | One row scrolling inside itself (M2.2)                                    |
| Detail fields         | Label above value (M5.1)                                                  |
| Side column           | Stacked in task order                                                     |
| Metric cards          | Two per row                                                               |
| Forms, overlays       | The installed route overlays (M7)                                         |

## M1 Layout and the first screen

- **M1.1** At 390 px the first screen shows the start of the main content: the first cards of a list, the key fields of a detail. Title, description, metrics, tabs and controls together never fill it; on a list, the title and its primary action share one row, and nothing but one row of view tabs and the search row sits between the header and the first card (put a count in `DataTable`'s `summary`, a label in `PageHeader`'s `eyebrow`).
- **M1.2 [Must]** The page never scrolls sideways (`document.documentElement.scrollWidth <= window.innerWidth` in every checked state). A region that genuinely needs two dimensions scrolls inside its own container.
- **M1.3** One vertical scroll per view: no scrolling card inside a scrolling page, and fixed heights become natural height below `md`.
- **M1.4** Grids and side panels collapse below `md` (`grid md:grid-cols-[1fr_20rem]`), ordered by the task rather than the desktop's left-to-right order. Text keeps `text-sm`, and long words, emails and URLs wrap (`break-words`, `min-w-0`).
- **M1.5** Sticky regions take at most about a quarter of the height and never cover the focused field; rotating keeps the route, input and open overlay.

## M2 Navigation, tabs and returning

- **M2.1** The shell's sidebar sheet and parent arrow (L6) are the only phone navigation; add no bottom bar or in-page back button.
- **M2.2** Tabs and other link rows stay on one row (`flex overflow-x-auto`, `shrink-0` items, no `flex-wrap`) with the current tab scrolled into view within the row; more than about five tabs become a `Select`. See [child routes](references/child-routes.md).
- **M2.3** Deep links, reload, back and the parent arrow keep the list's query, page and scroll position as on desktop ([`references/table.md`](references/table.md)).

## M3 Lists, cards and tables

- **M3.1 [Must]** An ordinary business list renders one card per record through `DataTable`'s `renderCard` ([phone cards](references/table.md#phone-cards)): the `RecordLink` name, the status `Badge`, two or three key fields as short muted text, and the row's own `RowActions` menu, which `DataTable` places on the card; never write a second action control into the card. Card text wraps or clamps instead of relying on hover.
- **M3.2** Cards keep the list's capabilities: sort, pagination, the cap notice, every state and, when the list has selection, a checkbox per card and "Select all on this page" (`DataTable` renders it).
- **M3.4** A table stays on phones only when rows are compared across columns (a matrix, a permission grid, a statement), scrolling inside its own container with the first column frozen; say why in the page plan.

## M4 Search, filters and the toolbar

- **M4.1** Search, filters and sort share one row: `DataTableSearch` as `search` takes the remaining width, followed by the icon "Filters" and "Sort" buttons that `DataTable` adds. Never put search, filters or sort into `toolbar` or a column layout of your own; `toolbar` is for other controls such as export or bulk actions. Only "Clear filters" and selection actions may wrap onto a second row while active.
- **M4.2** Filters are `DataTableFilter`s passed as `filters` with `filterCount`: inline from `md` up, in a bottom sheet behind "Filters · N" on a phone, writing the same URL parameters on every width. Pass `filtered` and `onClearFilters` so "Clear filters" stays on the row while filtered results are listed. Runnable reference: [`executable-relation-batch.md`](references/executable-relation-batch.md).
- **M4.4** Pass translated column names as `getColumnLabel` and the URL's sortable columns as `sortableColumns`, so the phone "Sort" menu offers exactly the sorts the list accepts.

## M5 Details and complex content

- **M5.1** Detail fields stack label above value below `sm` unless every value is short; rarely read sections collapse rather than disappear.
- **M5.2** The record's actions stay together and reachable, and Edit remains available because double-click editing (T2.5) is desktop-only.
- **M5.3** Related records follow M3; attachments use `attachment-list`.
- **M5.4** A complex view has a phone plan: charts one per row, legend below; a board one column at a time with "Move to…"; a calendar as an agenda list; diagrams pan inside their canvas.

## M6 Forms and input

- **M6.1** Forms are one column below `sm`.
- **M6.2** Inputs ask for the right keyboard (`type='email'`, `type='tel'`, `inputMode='numeric'`, `autoComplete`, `enterKeyHint`); keep the shared `Input`'s `text-base md:text-sm` so iOS does not zoom.
- **M6.3** After a failed submit the first invalid field is scrolled into view above the keyboard and the footer; pickers stay within the screen (I12) and a range calendar shows one month.

## M7 Overlays and action areas

- **M7.1** Use the installed overlays: on a phone they fit the screen width, cap their height at `100dvh - 2rem`, keep header and footer fixed and stack footer buttons with the primary on top. Unsaved input is handled by the overlay as T3.9 describes.
- **M7.2** On a phone the stack is the same as on desktop and goes no deeper than drawer → dialog → confirmation (I1); only the top layer takes taps, and each Cancel, Esc or back returns one layer. Anything deeper replaces the open overlay.
- **M7.3** With the keyboard open, the focused field and the footer stay visible; bottom bars respect `env(safe-area-inset-bottom)`. For a composer pinned to the bottom, reuse the UI Library chat's `use-keyboard-fit.ts`.

## M8 Touch and accessibility

- **M8.1** Tap targets are comfortably large and spaced (WCAG 2.5.8 asks for at least 24×24 px). Use the components' own sizes for their controls (`RowActions`, `DataTable` toolbar buttons, the Retry of `ListFeedback`) rather than resizing them, and use `gap-2` between neighbouring controls; a bare icon or inline text link is never the target of a main action.
- **M8.2 [Must]** Nothing essential depends on hover, double-click, right-click or dragging: menus open by tap, and drag-and-drop has a menu alternative ("Move to…").
- **M8.3** Sideways-scrolling rows and canvases do not trap vertical scrolling, and no custom swipe replaces the browser's back gesture.
- **M8.4** Every state (loading, empty, failure, submitting) fits the card list or form, and toasts do not cover the primary action for long.
- **M8.5** The accessibility rules hold (A1, A3, A6); each card is named by its record link. Long English labels wrap or move into menus.

## M10 Verifying the phone experience

Verify every page change at 390 px in a real browser with the commands in [`scripts/capture.md`](scripts/capture.md) (`isMobile: true`), alongside the desktop width from [`ui-workflow.md`](ui-workflow.md). Check the first screen (M1.1), sideways overflow (M1.2, reported by the capture log), cards and the search row (M3, M4), and walk the main task by touch: find, filter, open, edit, save, go back to the filtered list. Add the dark theme, the second language, 375×667 for short-height overlays and keyboards, or a real device only when the change touches colors, copy, overlays or bottom-fixed input respectively.

## Checklist

- [ ] First screen shows main content at 390 px; no sideways page scroll (M1.1, M1.2)
- [ ] Ordinary lists render cards with the row's menu; tables kept only for comparison (M3.1, M3.4)
- [ ] Search, Filters and Sort on one row through `DataTable` (M4.1, M4.2)
- [ ] Tabs on one row; back and the parent arrow keep the list's state (M2.2, M2.3)
- [ ] Overlays fit, keep their footer visible and close one layer at a time (M7)
- [ ] Everything works by touch, with no hover or drag dependency (M8.1, M8.2)
