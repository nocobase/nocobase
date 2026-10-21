# NocoBase business components

Single components that pages are built from. Each is its own item, installs into the consumer's `client/components/` beside the components it already owns, and belongs to the consumer from then on. The application templates ship the page-layout and route-overlay components preinstalled there.

| Item               | Installs                                                                | Exports                                                                                                                                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page-container`   | `page-container.tsx`                                                    | `PageContainer`                                                                                                                                                                                                                                                  |
| `page-header`      | `page-header.tsx`                                                       | `PageHeader`                                                                                                                                                                                                                                                     |
| `route-dialog`     | `route-dialog.tsx`, with `route-overlay.tsx` and `use-route-overlay.ts` | `RouteDialog`, `useRouteOverlay`                                                                                                                                                                                                                                 |
| `route-drawer`     | `route-drawer.tsx`, with `route-overlay.tsx` and `use-route-overlay.ts` | `RouteDrawer`, `useRouteOverlay`                                                                                                                                                                                                                                 |
| `route-child-page` | `route-child-page.tsx`                                                  | `RouteChildPage`                                                                                                                                                                                                                                                 |
| `settings-dialog`  | `settings-dialog.tsx`                                                   | `SettingsDialog`, `SettingsDialogSection`                                                                                                                                                                                                                        |
| `kanban`           | `kanban.tsx`                                                            | `KanbanProvider`, `KanbanBoard`, `KanbanHeader`, `KanbanCards`, `KanbanCard`                                                                                                                                                                                     |
| `property-fields`  | `property-fields.tsx`, with `long-text`                                 | `PropertyCard`, `PropertyRow`, `PropertySelect`, `PropertyMultiSelect`, `PropertyDate`, `PropertyNumber`, `PropertyText`, `PropertyLongText`, `PropertyLink`, `PersonValue`, `AgentIcon`, `PeopleAvatars`                                                        |
| `rich-text-editor` | `rich-text-editor.tsx`, with `rich-text-markdown.ts`                    | `RichTextEditor`, `RichTextToolbar`, `RichTextToolbarButton`, `RichTextInlineTools`, `RichTextBlockTools`, `RichTextToolbarSeparator`, `RichTextDefaultToolbar`; `richTextExtensions`, `mergeExtensions`, `MarkdownMention`, `ComposerKeys`, `roundTripMarkdown` |
| `markdown-view`    | `markdown-view.tsx`, with `remark-cjk-autolink.ts`                      | `MarkdownView`; `remarkCjkAutolink`                                                                                                                                                                                                                              |
| `long-text`        | `long-text.tsx`                                                         | `LongText`, `LongTextPreview`, `FadingText`                                                                                                                                                                                                                      |
| `comment-thread`   | `comment-thread.tsx`                                                    | `CommentTimeline`, `ThreadCard`, `TimelineActivity`, `ActorAvatar`, `CommentComposer`                                                                                                                                                                            |
| `attachment-list`  | `attachment-list.tsx`                                                   | `AttachmentList`, `PendingAttachments`, `AttachmentPanel`                                                                                                                                                                                                        |
| `setup-readiness`  | `setup-readiness.tsx`, with `setup-readiness-state.ts`                  | `SetupReadiness`, `useSetupReadiness`, `setupInspectionFailure`; inspection types                                                                                                                                                                                |
| `flow-diagram`     | `flow-diagram.tsx`, with `flow-layout.ts` and `flow-diagram-css.d.ts`   | `FlowDiagram`; `layoutFlowDiagram`, graph and layout types                                                                                                                                                                                                       |

`route-dialog` and `route-drawer` both install `route-overlay.tsx`, the implementation they share, and `use-route-overlay.ts`, the Context it provides. Installing the second of them finds both files already in place.

## Page layout

`PageContainer` renders a `section` with the full width, the responsive padding (`p-6 md:p-8`) and the spacing between sections (`space-y-6`). It accepts every `section` prop, and `className` is merged with `cn`, so it can override the defaults. `PageHeader` renders the page's only `h1`, an optional `description`, and `actions` aligned to the right from the `sm` breakpoint up.

```tsx
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

export default function OrdersPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Orders'
        description='Track every order from checkout to delivery.'
        actions={<Button>New order</Button>}
      />
      {/* sections */}
    </PageContainer>
  );
}
```

A page renders one `PageContainer`. Content that renders inside another page — an inline child route, a tab panel — already sits in that page's container and adds none of its own. A covering `RouteChildPage` is a surface of its own and places a `PageContainer` inside it; a dialog or drawer brings its own padding.

## Route overlays

The three ways a child route presents itself over the page that opened it, each at a URL of its own. The application owns the routes: declare each overlay as a child route of its page, render an `Outlet` in that page, and return the overlay from the child route's component.

```tsx
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';

function CancelButton() {
  const { close, isClosing } = useRouteOverlay();
  return (
    <Button variant='outline' disabled={isClosing} onClick={() => void close()}>
      Cancel
    </Button>
  );
}

export default function NewOrderDialog() {
  return (
    <RouteDialog title='New order' footer={<CancelButton />}>
      {/* form */}
    </RouteDialog>
  );
}
```

`RouteDialog` and `RouteDrawer` take the same props: `title`, `description`, `children`, `footer`, `className`, `closeTo`, where closing navigates and which defaults to the parent route with the current search string, and `beforeClose`, which runs before every close — the close button, Escape, the backdrop and `useRouteOverlay().close()` alike — and keeps the overlay open when it resolves `false`. An overlay opened from another overlay renders at the outer one's `Outlet`, gets its own backdrop, and returns focus into the outer panel when it closes. Both compose the installed `dialog` primitive — `DialogHeader`, `DialogTitle`, `DialogDescription` and `DialogFooter` inside the padding, spacing and close-button position of `DialogContent` — so they look like the application's other dialogs and follow a change to that primitive; `route-overlay.tsx` adds only the scrolling body between a fixed header and footer, the widths and the drawer position. To restyle both, edit `route-overlay.tsx`.

Call `useRouteOverlay()` from a component rendered inside the overlay, such as a footer button. The page component that returns `<RouteDialog>` sits outside the overlay's provider, and the hook throws there.

`RouteChildPage` is not modal. It positions itself with `absolute inset-0`, so the element that contains it must be positioned; an application's content area is. The page it covers renders its `Outlet` last, at the end of its `PageContainer`: the layer makes what comes before it `inert`, and anything after it would stay reachable. Give the child page a `PageContainer` of its own, inside `RouteChildPage`; returned bare, a child route's `PageContainer` renders below the parent's content instead of covering it. A child page that can only render inside another one — the child page of a tab, reached through the tab's outlet — covers the enclosing child page whole, because a `RouteChildPage` is two elements: the outer one positions and never scrolls, the inner one scrolls. While it is mounted, the siblings it covers are `inert`, and inside another child page so is everything around it up to that page's scrolling element. It has no close button: a back link above its heading, such as the `BackButton` the application templates carry in `client/components/back-button.tsx`, or the browser's back button, returns to the page beneath.

## Translations

The overlays' close button names itself with `useTranslation()` from `@nocobase/i18n/client` under `routeOverlay.close`, falling back to `Close`. A component ships no locale file, so add the keys to the locale resources of the namespace that renders them:

| Key                  | `en-US` | `zh-CN` |
| -------------------- | ------- | ------- |
| `routeOverlay.close` | Close   | 关闭    |

The shared DataTable and its column header and pagination controls use these keys, including when composed by `role-list`:

| Key                        | English                                    | Chinese                              |
| -------------------------- | ------------------------------------------ | ------------------------------------ |
| `dataTable.sortAscending`  | Asc                                        | 升序                                 |
| `dataTable.sortDescending` | Desc                                       | 降序                                 |
| `dataTable.hideColumn`     | Hide                                       | 隐藏                                 |
| `dataTable.noResults`      | No results.                                | 暂无结果。                           |
| `dataTable.selectedCount`  | {{selected}} of {{total}} row(s) selected. | 已选择 {{selected}} / {{total}} 行。 |
| `dataTable.rowsPerPage`    | Rows per page                              | 每页行数                             |
| `dataTable.pageOf`         | Page {{page}} of {{pageCount}}             | 第 {{page}} 页，共 {{pageCount}} 页  |
| `dataTable.firstPage`      | Go to first page                           | 第一页                               |
| `dataTable.previousPage`   | Go to previous page                        | 上一页                               |
| `dataTable.nextPage`       | Go to next page                            | 下一页                               |
| `dataTable.lastPage`       | Go to last page                            | 最后一页                             |
| `dataTable.view`           | View                                       | 视图                                 |
| `dataTable.toggleColumns`  | Toggle columns                             | 切换列                               |

`page-container`, `page-header` and `route-child-page` render no text of their own.

| Key                        | English                                      | Chinese                     |
| -------------------------- | -------------------------------------------- | --------------------------- |
| `flowDiagram.empty`        | No states to display.                        | 暂无可展示的状态。          |
| `flowDiagram.loading`      | Laying out diagram…                          | 正在布局流程图…             |
| `flowDiagram.failed`       | Unable to lay out this diagram.              | 无法布局此流程图。          |
| `flowDiagram.nodeHelp`     | Press Enter or Space to select a state.      | 按 Enter 或空格键选择状态。 |
| `flowDiagram.edgeHelp`     | Press Enter or Space to select a transition. | 按 Enter 或空格键选择转移。 |
| `flowDiagram.current`      | Current                                      | 当前                        |
| `flowDiagram.visited`      | Visited                                      | 已经过                      |
| `flowDiagram.initial`      | Initial                                      | 初始状态                    |
| `flowDiagram.final`        | Final                                        | 终止状态                    |
| `flowDiagram.state`        | State                                        | 状态                        |
| `flowDiagram.zoomOut`      | Zoom out                                     | 缩小                        |
| `flowDiagram.zoomIn`       | Zoom in                                      | 放大                        |
| `flowDiagram.configurable` | Parameters                                   | 可配置参数                  |
| `flowDiagram.actualSize`   | Actual size                                  | 实际大小                    |
| `flowDiagram.states`       | States                                       | 状态                        |
| `flowDiagram.transitions`  | Transitions                                  | 转移                        |
| `flowDiagram.overview`     | Diagram overview                             | 流程缩略导航                |
| `flowDiagram.fit`          | Fit to view                                  | 适应画布                    |

## In a plugin

`page-header` has no `#` imports and compiles in a plugin as installed. The others import `cn` from the `cn` package, which stays as it is, and most of them also import primitives as `#components/ui/<name>` — `route-dialog` and `route-drawer` the `button` and `dialog` ones, and `rich-text-editor` the `toggle` one. Keep these imports unchanged. Align the plugin's `package.json#imports` and `components.json` prefixes so the imports resolve to local source files during development and compiled `dist/client` files in the published package, using `publishConfig.imports` as [USAGE.md](../../USAGE.md#add-an-item-to-a-plugin) describes.

## Rich text editor

`rich-text-editor` edits Markdown: `value` comes in and `onChange` hands Markdown back, so a record stores text any reader can show (`markdown-view` draws it). It is assembled from official Tiptap packages — StarterKit (with links), task lists, tables, `Placeholder`, the Markdown extension, `@tiptap/extension-mention` with `@tiptap/suggestion` for mentions, and `@tiptap/extension-file-handler` for pasted and dropped files. What is its own lives in `rich-text-markdown.ts`: `MarkdownMention`, the official `Mention` node with a `kind` attribute that reads and writes the mention link `[@Name](mention://<kind>/<id>)` through the Markdown extension's custom tokenizer; the mention matcher, which also opens after CJK text and for the full-width `＠` but not inside an email address; the tidy step that keeps stored Markdown readable; and `ComposerKeys`, the message-box keys.

`onMentionSearch(query)` answers candidates (`kind`, `id`, `name`, an optional `hint` and `icon`); the first eight show in a list above the editor, or below with `mentionPlacement='below'`. The list is drawn with the theme's popover tokens rather than Tiptap UI Components' mention dropdown, which is installed by Tiptap's own CLI and styled with its own SCSS variables, and rather than shadcn's `Command`, which would take focus from the editor: focus stays in the text, and the list is a listbox the editor points at with `aria-activedescendant`. `onUpload(file)` stores a pasted or dropped file and answers `{ url, name }`, inserted as a link; without it, files are left to the browser (and to a drop zone around the editor). `onSubmit` runs on ⌘/Ctrl + Enter, and on plain Enter with `submitOnEnter`, where Shift + Enter starts a new paragraph or list item; `onEscape` runs on Escape. While the mention list is open, Enter, Tab and Escape belong to it. The `ref` handle focuses, clears, reads the Markdown and returns the Tiptap `editor`.

Extend it without editing the file. `extensions` is added to `richTextExtensions()`, and an extension with the name of a default one replaces it (pass a module constant or a memo: the editor reads it when it is created). `toolbar` is `true` for the default toolbar, `false` for none, or a function that receives the editor and returns your own, composed from the parts: `RichTextToolbar` is the labelled row, `RichTextInlineTools` and `RichTextBlockTools` are the default groups, `RichTextToolbarSeparator` divides them, and `RichTextToolbarButton` is a shadcn `Toggle` bound to the editor through Tiptap's `useTiptap`, pressed while `isActive` holds.

```tsx
const Timestamp = Extension.create({
  name: 'timestamp',
  addKeyboardShortcuts() {
    return { 'Mod-Shift-d': () => this.editor.commands.insertContent(today()) };
  },
});
const EXTENSIONS = [Timestamp];

<RichTextEditor
  value={notes}
  onChange={setNotes}
  extensions={EXTENSIONS}
  toolbar={() => (
    <RichTextToolbar>
      <RichTextToolbarButton
        label='Heading'
        icon={HeadingIcon}
        run={(editor) =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        isActive={(editor) => editor.isActive('heading', { level: 2 })}
      />
      <RichTextInlineTools />
      <RichTextToolbarSeparator />
      <RichTextBlockTools />
    </RichTextToolbar>
  )}
/>;
```

`roundTripMarkdown(markdown, extensions)` runs Markdown through the same schema without a view, which is what saving an untouched draft would send. Every word comes from `labels` (`RichTextLabels`, English by default).

## Markdown view

`markdown-view` renders GitHub-flavoured Markdown with `remark-gfm` followed by `remarkCjkAutolink` from `remark-cjk-autolink.ts`. GFM ends a bare URL only at whitespace or `<`, so in Chinese or Japanese text it swallows what follows: `PR：https://example.com/pull/8（分支 x）` would link `…/pull/8（分支`. The plugin ends a bare `https://…` or `www.…` link at the first Han, kana or Hangul character or full-width punctuation mark, trims the trailing punctuation GFM would have trimmed, and turns the rest back into text, linking any bare URL the rest contains. A URL written as `<https://…>` or `[text](https://…)` is left whole, which is how to link a URL that really contains CJK characters. Pass it to any other `react-markdown` you render the same text with.

## Long text

`long-text` shows a long text in part, and the place it sits in decides which component. `LongText` is for where there is room — the description under a page's title, a comment, a note in a wide pane: up to five lines (`lines`), the last fading out while there is more, unfolding in place on a click or Enter and folding on the next. `LongTextPreview` is for a narrow column — a record's introduction, description or address in the particulars beside its page, a card: up to three muted lines, opening the whole text in a pop-up beside it, headed by its `label`, so the column never grows and pushes what is under it. Both measure the text with a `ResizeObserver` and react only while it overflows: a text that fits is plain, with no fade and no pointer. A double-click or a selection does not fold `LongText`, so its words can be selected and copied. A string keeps its line breaks; pass rendered content, such as `MarkdownView`, as children to show formatted text the same way. Editing is the consumer's: a field that edits its text in place puts its editor in its own pop-up beside `LongTextPreview`.

## Kanban

`kanban` is adapted from the [Kibo UI kanban](https://www.kibo-ui.com/components/kanban) (MIT) on `@dnd-kit`: the same composition, without `tunnel-rat` and `ScrollArea`. It keeps the drag in progress as a draft, so the consumer's items are never mutated, and reports a drop as `onMove({ itemId, fromColumn, toColumn, toIndex })`; the consumer applies it (or refuses it) and passes the items back. A card can be dropped into an empty column. `overlay` renders the card that follows the pointer, `disabled` turns dragging off, and `labels` words the screen reader announcements (`{item}`, `{column}`). Card and column ids share one namespace, so keep them distinct. A card lifts under the pointer, on the hover grey with a firmer shadow, as a card that opens something does; given `onClick` it shows the pointer cursor and the grab only while held, otherwise the grab. The column the card in hand would land in, whether the pointer is over its empty space or over one of its cards, is marked as a focused field is, a half-strength line of the ring colour with a faint halo. Draw the card in hand (`overlay`) the same way, lifted by a large shadow, as the demo does. A board wider than its place scrolls sideways: its bar always shows, thicker, to be dragged (`scroll-shown`, which the application templates' `client/styles.css` defines; elsewhere the bar is the browser's), and holding the board's empty space, outside a card or anything clickable, and dragging pans it, as a mouse without a sideways wheel needs.

## Property fields

`property-fields` draws a record's property card, as the issue page's and the project page's side columns use it: `PropertyCard` (a titled card with a spinner while `busy`) holds `PropertyRow`s of a label and a field. `PropertySelect` picks one option (`noneLabel` adds an empty choice shown as a dash, `renderValue` draws the chosen one), `PropertyMultiSelect` picks several as chips and, with `onCreate`, offers to create a typed name (`action` places a control at the field's end, such as a colour picker for the chosen items), `PropertyDate` picks a calendar date (`YYYY-MM-DD`) with a clear button, and `PropertyNumber` takes a whole number up to `max`. `PersonValue` draws a person or an agent as a chosen value, and `PeopleAvatars` a row of overlapping avatars named in tooltips. Values come in and changes go out through `onChange`; the words the fields show themselves come from `labels` (`PropertyFieldLabels`, English by default), and the component ships no locale keys.

`PropertyText` edits a line of text, `PropertyLongText` a description, an introduction or an address (a textarea in the form variant; in an inline card three lines fading out, `FadingText` from `long-text`, which it installs, opening into a pop-up), and `PropertyLink` an address, such as a website, shown inline as its host in a chip that opens it in a new tab. A row given `copyable` shows a copy button at its end under the pointer, which copies the value as it reads, or a link's whole address, and is not shown while the value is empty or being edited.

`PropertyCard`'s `variant` decides how its fields look. `form`, the default and how the card looked before the option existed, shows every value in its control, ready to change, which suits a card filled in at once. `inline` reads first, as a record's particulars beside its page do: each value is plain text, shaded with `--hover` under the pointer while it may be edited, and becomes its control on a double-click, Enter or F2, a single click leaving its words selectable to copy. A select, the chips and a date open their pop-up as editing starts and save on the pick, closing it ending editing; a number or a line of text saves when it loses focus or on Enter, a long text on Cmd/Ctrl+Enter, and Escape leaves either as it was. A long text opens beside the column in a pop-up on a click, its whole text read there and edited there with a double-click (an empty one opens straight into its editor), so the column keeps its height; leaving the pop-up saves the edit, Cmd/Ctrl+Enter saves at once and Escape leaves it as it was. A link, which a click on its chip opens, is edited from a pencil shown under the pointer left of the copy button, from F2, or from a double-click beside its chip. A disabled field is plain text, with no shading and no pencil. Give each field an `aria-label` (`label` for the long text and the link): it names the value while it shows as text. `PropertyFieldLabels` gained `copy`, `copied`, `edit` and `open`, each optional with an English default, so existing labels keep compiling.

## Settings dialog

`settings-dialog` is shadcn's [sidebar-13](https://ui.shadcn.com/blocks/sidebar#sidebar-13) settings dialog as a component: `SettingsDialog` lists `groups` of `{ id, label, icon }` items in a sidebar on the left, under each group's label, and renders `children`, the open entry, on the right; on a phone the groups become one scrolling row above the content. The consumer owns the state: `open` and `onOpenChange`, the `activeId` (marked active and `aria-current`), and `onSelect`. To keep the open entry in the URL, pass `renderItem` to draw each entry as a router link, such as a router `Link` to `?settings=<id>`. `title` heads the sidebar and names the dialog, `description` is read by screen readers, and `navigationLabel` names the navigation. `SettingsDialogSection` gives the content a heading and a description and is labelled by the heading. Every word comes from the props, and the component ships no locale keys.

## Flow diagram

Install `@nocobase/flow-diagram` for a read-only React Flow canvas with ELK layered layout and orthogonal edge routing. Import `FlowDiagram` from `#components/flow-diagram`; `flow-layout.ts` supplies the graph types and `layoutFlowDiagram()` for callers that need layout data separately. It handles cycles, self-loops and parallel edges. Nodes and edges each need unique ids, and every edge endpoint must name an existing node. Invalid graphs report a translated error and call `onLayoutError` when provided.

Pass `nodes`, `edges`, `ariaLabel`, and optionally `direction` (`RIGHT` or `DOWN`), `renderNode`, `onNodeClick` and `onEdgeClick`. The component imports React Flow's stylesheet. Its default height is `h-96`; override with `className` or `style` for a bounded canvas, or use `autoHeight` to expand to the full graph at the available width. Prefer `direction="DOWN" autoHeight` for detailed lifecycle diagrams in a page, so a wide graph is not reduced to an unreadable strip. Automatic sizing includes routed edges and labels outside the node bounds, with reserved space for the graph summary and viewport toolbar. On narrow screens the toolbar stays at the top; clicking the zoom percentage returns to actual size for reading and panning through large diagrams. Node cards separate their title, type and execution status; current transitions use a moving dashed line that respects reduced-motion preferences. The canvas summary counts inspectable states and transitions only. Set `configurable` only for genuine parameter bindings: nodes show a badge and edge labels include the translated Parameters caption. The lifecycle adapter projects both state and transition bindings automatically. Nodes default to 232×104 canvas units, a deliberate fixed canvas size independent of zoom; customize `width`/`height` for richer content. Node labels wrap within their fixed dimensions. Edge labels reserve at most 320 canvas units; shorten long labels and show full details outside the canvas. Highlight changes preserve the viewport; topology, dimensions, direction or edge label changes rerun layout and fit the graph. Clicking opens consumer-owned details; it never changes graph data.

Nodes and edges accept `visited` for execution history and `highlighted` for the current node or available edges. Highlights use the application `--primary` token; current nodes have a stronger fill and ring, visited nodes a light fill. Ordinary edges use a subdued neutral stroke with inline labels. Defaults follow the application theme in light and dark mode. ELK can reorder ports to reduce crossings. Mark visual annotations `decorative` to remove selection and keyboard focus. For lifecycle descriptions, use `@nocobase/lifecycle-diagram` to project states, transitions, actual history and optional end markers.

Use `nodeActions` for explicit keyboard-accessible node configuration controls and `nodeDescription` for supporting policy summaries. Increase node dimensions for richer content. For bounded process canvases, `initialMinZoom={0.8}` keeps the initial view readable in bounded and automatic-height canvases and `showMiniMap` provides pan/zoom orientation; the Fit control still fits the whole graph, and focusing an offscreen node control pans it into view. Defaults remain compatible with existing consumers. Definition views must not pass execution highlights or simulate running transitions. Technical diagnostic consumers may opt into a complete-source view; standard business process pages omit technical edit paths and keep every business path.

Automatic-height canvases let wheel gestures scroll the page, preserve pinch/toolbar zoom, and place viewport controls at the top and include the complete routed height plus control padding. LifecycleDiagram defaults to top-to-bottom automatic-height presentation; generic FlowDiagram retains its RIGHT bounded-canvas default. Standard business process pages keep technical edit paths and overview minimaps out of the default interface.

## Setup readiness

`setup-readiness` installs `setup-readiness.tsx` and `setup-readiness-state.ts`. The host memoizes prerequisite descriptors and a batch inspection callback backed by authorized business reads, then passes `useSetupReadiness(checks, inspect, { enabled, refreshKey })` to `SetupReadiness`. Supply translated labels and contextual authorized actions. No inspection runs without active checks. Focus, explicit refresh and a changed host route key recheck; stale results are ignored. Initial all-ready is hidden; after explicit refresh, compact confirmation keeps the control in place. Only missing checks expose actions. Use typed unknown reasons (`unavailable`, `signIn`, `forbidden`, `invalid`) instead of raw errors; `setupInspectionFailure` maps transport failures. Empty or unsupported results are unknown, not ready. No polling, plugin scan, configuration writes or security enforcement is installed.

Both templates also prepare `RequiredRoleSetup`, which uses the real Users options and enabled-member totals for explicitly declared business roles, gates reads and member-management links with their existing permissions, and retains a validated source return URL. Application-owned manager relationships use their own authorized aggregate through the same hook. Read [the business wiring and acceptance contract](../../../packages/app/app-skills/skills/nocobase-app-development/references/setup-readiness.md) before using these parts.
