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
| `property-fields`  | `property-fields.tsx`                                                   | `PropertyCard`, `PropertyRow`, `PropertySelect`, `PropertyMultiSelect`, `PropertyDate`, `PropertyNumber`, `PersonValue`, `AgentIcon`, `PeopleAvatars`                                                                                                            |
| `rich-text-editor` | `rich-text-editor.tsx`, with `rich-text-markdown.ts`                    | `RichTextEditor`, `RichTextToolbar`, `RichTextToolbarButton`, `RichTextInlineTools`, `RichTextBlockTools`, `RichTextToolbarSeparator`, `RichTextDefaultToolbar`; `richTextExtensions`, `mergeExtensions`, `MarkdownMention`, `ComposerKeys`, `roundTripMarkdown` |
| `markdown-view`    | `markdown-view.tsx`, with `remark-cjk-autolink.ts`                      | `MarkdownView`; `remarkCjkAutolink`                                                                                                                                                                                                                              |
| `comment-thread`   | `comment-thread.tsx`                                                    | `CommentTimeline`, `ThreadCard`, `TimelineActivity`, `ActorAvatar`, `CommentComposer`                                                                                                                                                                            |
| `attachment-list`  | `attachment-list.tsx`                                                   | `AttachmentList`, `PendingAttachments`, `AttachmentPanel`                                                                                                                                                                                                        |

`route-dialog` and `route-drawer` both install `route-overlay.tsx`, the implementation they share, and `use-route-overlay.ts`, the Context it provides. Installing the second of them finds both files already in place.

## Page layout

`PageContainer` renders a `section` with the full width, the responsive padding (`p-6 md:p-8`) and the spacing between sections (`space-y-6`). It accepts every `section` prop, and `className` is merged with `cn`, so it can override the defaults. `PageHeader` renders the page's only `h1`, an optional `description`, and `actions` aligned to the right from the `sm` breakpoint up.

```tsx
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';

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
import { RouteDialog } from '@/components/route-dialog';
import { useRouteOverlay } from '@/components/use-route-overlay';

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

`RouteDialog` and `RouteDrawer` take the same props: `title`, `description`, `children`, `footer`, `className`, `closeTo`, where closing navigates and which defaults to the parent route with the current search string, and `beforeClose`, which runs before every close — the close button, Escape, the backdrop and `useRouteOverlay().close()` alike — and keeps the overlay open when it resolves `false`. An overlay opened from another overlay renders at the outer one's `Outlet`, gets its own backdrop, and returns focus into the outer panel when it closes. To restyle both, edit `route-overlay.tsx`.

Call `useRouteOverlay()` from a component rendered inside the overlay, such as a footer button. The page component that returns `<RouteDialog>` sits outside the overlay's provider, and the hook throws there.

`RouteChildPage` is not modal. It positions itself with `absolute inset-0`, so the element that contains it must be positioned; an application's content area is. The page it covers renders its `Outlet` last, at the end of its `PageContainer`: the layer makes what comes before it `inert`, and anything after it would stay reachable. Give the child page a `PageContainer` of its own, inside `RouteChildPage`; returned bare, a child route's `PageContainer` renders below the parent's content instead of covering it. A child page that can only render inside another one — the child page of a tab, reached through the tab's outlet — covers the enclosing child page whole, because a `RouteChildPage` is two elements: the outer one positions and never scrolls, the inner one scrolls. While it is mounted, the siblings it covers are `inert`, and inside another child page so is everything around it up to that page's scrolling element. It has no close button: a back link above its heading, such as the `BackButton` the application templates carry in `client/components/back-button.tsx`, or the browser's back button, returns to the page beneath.

## Translations

The overlays' close button names itself with `useTranslation()` from `@nocobase/i18n/client` under `routeOverlay.close`, falling back to `Close`. A component ships no locale file, so add the keys to the locale resources of the namespace that renders them:

| Key                  | `en-US` | `zh-CN` |
| -------------------- | ------- | ------- |
| `routeOverlay.close` | Close   | 关闭    |

`page-container`, `page-header` and `route-child-page` render no text of their own.

## In a plugin

`page-header` has no `@/` imports and compiles in a plugin as installed. The others import `cn` from the `cn` package, which stays as it is, and most of them also import primitives as `@/components/ui/<name>` — `route-dialog` and `route-drawer` the `button` and `dialog` ones, and `rich-text-editor` the `toggle` one; rewrite those imports to relative `.js` paths, as [USAGE.md](../../USAGE.md#add-an-item-to-a-plugin) describes.

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

## Kanban

`kanban` is adapted from the [Kibo UI kanban](https://www.kibo-ui.com/components/kanban) (MIT) on `@dnd-kit`: the same composition, without `tunnel-rat` and `ScrollArea`. It keeps the drag in progress as a draft, so the consumer's items are never mutated, and reports a drop as `onMove({ itemId, fromColumn, toColumn, toIndex })`; the consumer applies it (or refuses it) and passes the items back. A card can be dropped into an empty column. `overlay` renders the card that follows the pointer, `disabled` turns dragging off, and `labels` words the screen reader announcements (`{item}`, `{column}`). Card and column ids share one namespace, so keep them distinct.

## Property fields

`property-fields` draws a record's property card, as the issue page's and the project page's side columns use it: `PropertyCard` (a titled card with a spinner while `busy`) holds `PropertyRow`s of a label and a field. `PropertySelect` picks one option (`noneLabel` adds an empty choice shown as a dash, `renderValue` draws the chosen one), `PropertyMultiSelect` picks several as chips and, with `onCreate`, offers to create a typed name (`action` places a control at the field's end, such as a colour picker for the chosen items), `PropertyDate` picks a calendar date (`YYYY-MM-DD`) with a clear button, and `PropertyNumber` takes a whole number up to `max`. `PersonValue` draws a person or an agent as a chosen value, and `PeopleAvatars` a row of overlapping avatars named in tooltips. Values come in and changes go out through `onChange`; the words the fields show themselves come from `labels` (`PropertyFieldLabels`, English by default), and the component ships no locale keys.

## Settings dialog

`settings-dialog` is shadcn's [sidebar-13](https://ui.shadcn.com/blocks/sidebar#sidebar-13) settings dialog as a component: `SettingsDialog` lists `groups` of `{ id, label, icon }` items in a sidebar on the left, under each group's label, and renders `children`, the open entry, on the right; on a phone the groups become one scrolling row above the content. The consumer owns the state: `open` and `onOpenChange`, the `activeId` (marked active and `aria-current`), and `onSelect`. To keep the open entry in the URL, pass `renderItem` to draw each entry as a router link, such as a router `Link` to `?settings=<id>`. `title` heads the sidebar and names the dialog, `description` is read by screen readers, and `navigationLabel` names the navigation. `SettingsDialogSection` gives the content a heading and a description and is labelled by the heading. Every word comes from the props, and the component ships no locale keys.
