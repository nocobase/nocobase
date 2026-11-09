# Phone experience

Every page an application ships works on a phone the first time it is delivered, without the user asking for it. "Works" means a person holding a phone can find, read and complete the page's tasks with a finger and the on-screen keyboard; a desktop page that merely shrinks, wraps or scrolls sideways does not qualify. This document is part of [the UI guidelines](ui-guidelines.md) (rule A4 points here) and applies through [the design contract](design-contract.md): a user reference or confirmed design can change how a phone layout looks, never whether the page's tasks can be completed on a phone.

Phone width means below the `md` breakpoint (768px), the width at which the shell swaps its sidebar for a sheet (`useIsMobile`) and `DataTable` switches to cards. Tailwind's `sm` (640px) still separates large phones in landscape and small tablets for spacing and button rows; design the page for "below `md`" first, and use `sm` only for finer adjustments.

## Decide the phone layout while designing the page

Do this for every page you create or change, in the quick workflow as well as the full one, before writing its JSX:

1. Name the page's main task on a phone in one sentence ("find an order and check its status", "approve a request") and what the first screen must show for it.
2. Rank the page's content: what stays on the first screen, what moves into a disclosure (a Filters sheet, a collapsed section, a "More" menu, the record's detail), and what keeps its place but stacks.
3. Pick the phone pattern for each region from the table below, and write the decision down: in the quick workflow, one line per page in your report; in the full workflow, the "Phone layout" section of [the design template](templates/design.md).
4. Keep every capability. Moving an action into a menu or a filter into a sheet is fine; removing it on phones is not, unless the business says the task is desktop-only and the page says so where the action would be.

| Region                           | Default phone pattern                                                                                                                    | Keep the desktop pattern when                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Page header                      | `PageHeader` as shipped: title, at most two lines of description, actions under the title; one primary action, the rest in a "More" menu | —                                                         |
| Record list (T1)                 | `DataTable` with `renderCard`: one card per record, with name, status and two or three key fields, and the row menu                      | The rows are a matrix or comparison (M4)                  |
| Search and filters (T1.1, T1.2)  | Full-width search box; one "Filters" button with the applied count opening a bottom `Sheet`; "Clear filters" beside it                   | One single filter that fits beside the search box         |
| Sort (T1.8)                      | `DataTableSortMenu` in the toolbar (`md:hidden`)                                                                                         | —                                                         |
| Tabs and in-page navigation      | One row that scrolls sideways inside itself, keeping the current tab in view                                                             | Two or three short tabs that fit                          |
| Detail fields (T2.4)             | Label above value in one column                                                                                                          | Short label–value pairs that fit the `8rem` grid at 375px |
| Side column, sidebar, split view | Stacked under the main content, or behind a disclosure, in task order                                                                    | —                                                         |
| Metric cards (T5.1)              | Two per row with a smaller value; at most four before the main content                                                                   | —                                                         |
| Forms (T3)                       | One column; long forms grouped or stepped on a covering page; footer actions reachable above the keyboard                                | —                                                         |
| Overlays (I1)                    | The installed `RouteDialog`/`RouteDrawer`/`Dialog`, which already fit a phone; a long form becomes a covering page                       | —                                                         |

## M1 Layout and the first screen

- **M1.1 [Must]** At 375px and 390–412px, the first screen (the visible viewport after the shell header) shows the start of the page's main content: the first records of a list, the record's key fields on a detail, the first fields of a form. The title, description, metrics, filters and actions together never fill it. Pass: a screenshot of the first screen at 375×667 shows main content without scrolling.
- **M1.2 [Must]** The page has no horizontal overflow: `document.documentElement.scrollWidth <= window.innerWidth` on every state you check. A region that genuinely needs two dimensions scrolls inside its own container (M4.4, M6.3), never the page.
- **M1.3 [Must]** One vertical scroll per view. Do not nest scrolling regions on a phone page (a scrolling card inside a scrolling page) except a sideways-scrolling row (tabs, chips, a matrix) or an overlay's own body. Fixed heights such as `h-[600px]` with inner scrolling become natural height below `md`.
- **M1.4 [Must]** Columns, grids and side panels collapse below `md`: `grid md:grid-cols-[1fr_20rem]` rather than a fixed two-column grid; the side column goes below the main column, or the part of it the task needs first goes above. Order follows the task, not the desktop's left-to-right order.
- **M1.5 [Should]** Keep the shell's page padding; do not add extra horizontal padding inside full-width regions on phones. Cards stacked in one column keep `gap-4`.
- **M1.6 [Must]** Text keeps its scale: body and table text stay `text-sm`, never smaller to fit. Long words, emails, URLs and codes wrap (`break-words`, `min-w-0` on flex children) instead of widening the page.
- **M1.7 [Should]** Sticky or fixed regions (a header, a footer bar, a floating action) take at most about a quarter of the viewport height together and never cover the focused field or the last item of a list; keep the shell header the only sticky header unless the task needs another.
- **M1.8 [Must]** Rotating the phone or resizing across `md` keeps the route, query, scroll position, selection, open overlay and form input; the layout reflows without remounting the page.

Boundary: a reference in faithful mode may set its own phone layout; record it in the design and check M1.1–M1.3 against it.

## M2 Navigation, tabs and returning

- **M2.1 [Must]** The shell's phone navigation is the sidebar sheet opened from the header toggle, and the parent arrow on a detail or edit page ([navigation](references/navigation.md), L6). Do not add a second menu, bottom bar or back button inside a page.
- **M2.2 [Must]** Page tabs and other in-page link rows stay on one row: `flex overflow-x-auto` with `shrink-0` items, no `flex-wrap`, and the current item kept in view by scrolling only the row (set the row's `scrollLeft` from the `aria-current` item when the row appears and when the tab changes; `scrollIntoView` would also scroll the page). Labels never truncate mid-word; a row that would hold more than about five tabs on a phone uses a `Select` of the same links instead. See [`example/detail-page-tabs.md`](references/example/detail-page-tabs.md).
- **M2.3 [Must]** Deep links, refresh, browser back and forward, and the parent arrow behave exactly as on desktop: the list's query, page, sort and tab survive; an overlay opened on a phone has its own URL (I6) and back closes it. A filter sheet is a temporary panel and stays out of the URL; the filters it applies are in the URL (T1.7).
- **M2.4 [Must]** Returning from a detail to a list restores its scroll position on a phone too ([restore list position](references/table.md#restore-list-position)).

## M3 Lists, cards and tables

- **M3.1 [Must]** An ordinary business list renders cards on phones: pass `renderCard` to `DataTable` ([phone cards in `table.md`](references/table.md#phone-cards)). The card leads with the record's name or number as its `RecordLink` (T1.3), then its status `Badge` (T1.4), then two or three key fields as short muted text, with the row's "…" menu (T1.5) at its end. Everything else is on the detail.
- **M3.2 [Must]** The list keeps its capabilities on phones: sorting through `DataTableSortMenu`, pagination (the shared pagination wraps whole groups, T1.12), the result cap notice (T1.10), all list states (S1–S4), selection with a checkbox in the card and bulk actions in the toolbar when the desktop list has them.
- **M3.3 [Must]** Card text wraps or clamps (`line-clamp-2`) instead of relying on a hover tooltip; T1.11's hover is a desktop table rule.
- **M3.4 [Must] Exceptions with a reason**: keep a table on phones, scrolling sideways inside its own bordered container, only when the rows are meant to be compared across columns: a matrix, a price or permission grid, a financial statement, a timetable. Freeze the first column when the table is wider than the screen, and record the reason in the design. A list in a dashboard card (T5.3) with one or two columns stays a table when it fits at 375px.

## M4 Search, filters and the toolbar

- **M4.1 [Must]** The page's own controls take at most two rows on a phone: the search box at full width, then one row holding "Filters" (or the page's only filter) and "Clear filters" when it applies. `DataTable`'s toolbar row may follow with "Sort", bulk actions and the shared clear/retry actions. Secondary actions (import, export, column visibility) go into one "More" menu. Never stack every desktop filter at full width.
- **M4.2 [Must]** A list with two or more filters puts them in a bottom `Sheet` (`side='bottom'`, a scrolling body and no Apply button: each control writes the URL as it changes, as on desktop) opened by an outline "Filters" button. The button shows the number of applied filters (`Filters · 2`), and "Clear filters" sits next to it while anything is applied. Desktop keeps the filters inline.
- **M4.3 [Must]** Filters on phones use the same URL parameters, page reset and debounce as on desktop (T1.7, I5, [section 5 of `table.md`](references/table.md#5-writing-search-and-filters-to-the-url)); switching width shows the same applied filters.

Boundary: one filter that fits beside the search box at 375px stays inline.

## M5 Details and complex content

- **M5.1 [Must]** Detail fields stack label above value below `sm` unless every value is short (`grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-x-4 sm:gap-y-3`). Sections the user reads less often collapse (`Collapsible`) rather than disappear. Empty values still show "—".
- **M5.2 [Must]** A record's actions stay together and reachable: at the top under the title, or in a sticky footer bar in a drawer (T2.2). Inline editing on double-click (T2.5) is a desktop enhancement; the record's "Edit" action must remain on the phone so every editable value can be changed by touch.
- **M5.3 [Must]** Related records shown as a table on the detail follow M3. Long text follows I14; images and attachments use `attachment-list`, which previews in its own dialog; its thumbnails and actions meet M8.1.
- **M5.4 [Must] Complex views get a phone plan of their own**, recorded in the design:
  - Charts: full width, one per row, legend below the plot, at most about six categories or labels that remain readable; the tooltip opens on tap. A chart with many series also offers its numbers as a short list or table.
  - Kanban (`kanban`): show one column at a time with a sideways-scrolling column switcher or a status `Select`; moving a card works without dragging, from a "Move to…" item in the card's menu.
  - Calendar: a day or agenda list on phones instead of a month grid; the month grid only picks the date.
  - Timeline and comments (`comment-thread`): one column, newest where the business expects it, the composer reachable above the keyboard.
  - Diagrams (`flow-diagram`, `lifecycle-diagram`): fit to width, pan and pinch inside the canvas only, with node details in a sheet or list rather than hover cards.
  - Tree: indent at most a few levels and move deeper levels into a drill-down list.
  - Rich text: the editor's toolbar scrolls sideways in one row; read mode wraps.

## M6 Forms and input

- **M6.1 [Must]** Forms are one column below `sm`; field pairs (`grid sm:grid-cols-2`) stack. Labels stay above inputs (T3.2), help and errors below.
- **M6.2 [Must]** Inputs use the right keyboard: `type='email'`, `type='tel'`, `type='url'`, `inputMode='numeric'` or `'decimal'` for numbers, `autoComplete` where the browser can fill in, and `enterKeyHint` on the last field. The shared `Input` uses `text-base md:text-sm`, so iOS Safari does not zoom in when a field gets focus; do not override it with `text-sm` or a smaller size on phones.
- **M6.3 [Must]** After a failed submit, the first invalid field is focused and scrolled into view above the keyboard and any fixed footer (T3.3); the error is not hidden behind the footer.
- **M6.4 [Must]** Pickers fit a phone: `Select` and `DatePicker` popups stay within the screen (I12), a range calendar shows one month below `md`, a relation picker with search opens as a dialog or sheet with its own scrolling list rather than a wide popover, and file uploads use `file-component-ui`, whose file input opens the phone's own photo and file chooser.
- **M6.5 [Must]** A form longer than one screen on a phone keeps its submit action reachable: a `RouteDialog`/`RouteDrawer` footer, a sticky footer on a covering page, or the end of a stepped form. Drafts, validation and the unsaved-changes guard (T3.9) behave as on desktop.

## M7 Overlays and action areas

- **M7.1 [Must]** Use the installed overlays: on phones `Dialog` and `RouteDialog` take the screen width minus 2rem and `100dvh - 2rem` at most, `RouteDrawer` takes the full width, their header and footer stay fixed and the body scrolls, and footer buttons stack with the primary on top ([overlay sizes](references/overlay.md#6-plain-dialogs-sizes-and-scrolling)). Do not replace the `dvh` cap with `vh`.
- **M7.2 [Must]** At most one overlay plus one confirmation on a phone (I1's stacking rules already allow no more). A task that needs a third layer becomes a covering page.
- **M7.3 [Must]** With the keyboard open, the focused field and the footer buttons stay visible: the overlay's body scrolls, the footer is not pushed off screen, and closing the keyboard restores the layout. Fixed bars respect the safe area (`pb-[env(safe-area-inset-bottom)]`) when they sit at the bottom edge.
- **M7.4 [Must]** Close, Cancel and the back gesture mean the same thing: close without saving, with the unsaved-changes guard when the form is dirty (T3.9).

## M8 Touch, accessibility and feedback

- **M8.1 [Must]** Every tap target is at least 24×24px with no other target within 24px of its center (WCAG 2.5.8), and controls a phone user taps often (a card's "…" menu, toolbar buttons, checkboxes in cards) use the components' default sizes: `Button` `size='default'` or `size='icon'` (32px), not `xs`, `icon-xs` or `icon-sm`, with `gap-2` between neighbours. A bare icon or a text link inside a sentence is not a target for a main action. Row and card menus are reachable without hover.
- **M8.2 [Must]** Nothing essential depends on hover, double-click, right-click, a precise pointer or dragging: tooltips repeat information shown elsewhere or are reachable by tap and focus; drag-and-drop has a menu or button alternative (move up/down, "Move to…").
- **M8.3 [Must]** Gestures do not fight the page: a sideways-scrolling row or canvas does not trap vertical page scrolling, and no custom swipe handler replaces the browser's back gesture.
- **M8.4 [Must]** States look right on a phone: loading, empty, no results, denied, session expired, failed, refresh failed and submitting fit the card list or form without overflow, and toasts do not cover the primary action for long.
- **M8.5 [Must]** Phone layouts keep the accessibility rules: names on icon buttons (A1), visible focus (A3), focus restoration (A6), contrast in both themes (A5, F6), and text that reflows at 200% zoom. The card list is a semantic list; the record link is the card's accessible name.
- **M8.6 [Must]** Chinese and English copy both fit: long English labels wrap or move into menus rather than truncating mid-word; Chinese names keep their full text in the card title.

## M9 Performance and reliability on phones

- **M9.1 [Should]** Lists stay paginated on phones (the same page size); do not switch to infinite scrolling without its own navigation contract (see [Delete and recover a list](references/table.md#delete-and-recover-a-list)).
- **M9.2 [Must]** Switching between card and table rendering sends no new request; the same data renders both ways.
- **M9.3 [Should]** Images in lists use thumbnails with fixed aspect ratios so cards do not jump while loading; heavy views (charts, diagrams) load in their card with the shared loading state.

## M10 Verifying the phone experience

Verify in a real browser; static checks, DOM tests and a screenshot's file size prove nothing about geometry.

- Widths: 375×667 (a small phone and a short screen), 390×844 or 412×915 (a common large phone), and a desktop width (1280×800 or wider). Add a landscape phone (667×375) when the page has fixed regions or overlays.
- For each changed page, check M1.1 (first screen), M1.2 (no page overflow, by script), M3/M4 (cards, filters, sort), M7 (overlays at short height), M8.1 (tap target sizes, by script or inspection) and both languages with long content, in light and dark themes.
- Walk the main task on the phone width end to end: find → filter → open detail → edit with validation errors → save → cancel and confirm a delete → go back to the filtered list.
- Use Playwright's device emulation (`isMobile`, `hasTouch`) for touch and tap behavior. A desktop browser cannot show the soft keyboard, the dynamic toolbar or safe areas: check them on a real device or a simulator when the page has fixed bars, overlays with forms or input near the bottom, and otherwise record them as Not verified with that reason.
- Record each item of the checklist below as Pass, Not applicable (why) or Not verified (why). Not verified is never counted as Pass.

## Checklist

- [ ] M1 First screen shows main content at 375×667; no page overflow; one vertical scroll; columns collapse in task order; text keeps its scale; layout survives rotation
- [ ] M2 No duplicate phone navigation; tabs on one scrolling row with the current tab visible; deep links, back and the parent arrow keep the list context and scroll
- [ ] M3 Ordinary lists render cards with name, status, key fields and menu; sort, pagination, cap notice, states and selection kept; tables kept only for comparison, with a reason
- [ ] M4 Toolbar at most two rows; several filters behind a "Filters" button with the count and "Clear filters"; the same URL semantics
- [ ] M5 Details stack or fit; actions reachable; editing available without double-click; each complex view has a recorded phone plan
- [ ] M6 One-column forms; the right keyboards; the first error visible above the keyboard and footer; pickers fit; submit reachable; drafts and guards kept
- [ ] M7 Installed overlays; at most one overlay plus a confirmation; footer and focused field visible with the keyboard; consistent close semantics
- [ ] M8 Tap targets and spacing; no hover, double-click or drag dependency; no gesture conflicts; every state fits; accessibility and both languages hold
- [ ] M9 Paginated lists; no extra requests when the layout switches; stable images
- [ ] M10 Checked at two phone widths, a short height and desktop, in both languages; the main task walked through on a phone; device-only behavior verified or recorded as Not verified
