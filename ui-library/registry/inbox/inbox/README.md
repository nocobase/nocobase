# Inbox

The `/inbox` page of an application, over the in-app notification plugin: a master–detail list of the viewer's messages with two views (All, and To do for what waits on the viewer) and a filter by kind, a card that selects the message wherever it is clicked and shows a chevron saying so, read, unread and delete from a card's menu, a right-click or the detail pane, a detail header every kind shares (the kind line with read and delete, the title, which is itself the link to the message's page, and the decision's buttons right under it), "Mark all as read", `j` / `k` and Enter, and a refresh whenever the plugin's realtime signal, a reconnection or the window's focus says the inbox changed. It installs into `client/extensions/nocobase-inbox/`.

The messages, their read state and their deletion are always `@nocobase/app-plugin-notification-in-app`'s, through its React Query hooks in `@nocobase/app-plugin-notification-in-app/client/inbox`. What an application adds to them — who sent a message, whether it asks the viewer to decide something and whether that is still waiting — comes from an `InboxSource` the application writes over its own API. Without one, every message reads as a notification.

| File                       | Exports                                                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inbox-page.tsx`           | `InboxPage`, the route's page, and `InboxNotify`                                                                                                         |
| `inbox-list.tsx`           | `InboxList`, the left column                                                                                                                             |
| `inbox-detail.tsx`         | `InboxDetail`, the detail pane, `InboxDetailHeader`, the header every kind shares, and `InboxDetailToolbarInput`                                         |
| `inbox-item.tsx`           | `InboxItemCard` and `InboxTypeIcon`                                                                                                                      |
| `decision-actions-bar.tsx` | `DecisionActionsBar`: approve, and reject with a required comment, for a renderer's `Actions`                                                            |
| `source.ts`                | `InboxSource`, `defaultInboxSource`, `inboxSourceKeys`, and `useInboxNotices`, `useInboxWaiting` and `useInboxPending` for the application's other pages |
| `registry.ts`              | `InboxEntryRenderer`, `InboxFeed`, `InboxRegistry`, `defineInboxRenderer`, the default categories, and the hooks reading the registry                    |
| `registry-scope.tsx`       | `InboxRegistryProvider` and `ContributorScope`                                                                                                           |
| `model.ts`                 | `InboxEntry`, `InboxNotice`, the categories' types, and the pure rules of the list                                                                       |
| `frame.ts`                 | the inbox's own wording, taken outside a contributor's namespace                                                                                         |
| `inbox-actions.ts`         | `InboxAction`: read, unread and delete                                                                                                                   |
| `locales/`                 | the English resource with its `InboxLocale` type, and the Chinese one                                                                                    |

## Prerequisites

- `@nocobase/app-plugin-notification-in-app` registered in the application's server and client plugins, and `@tanstack/react-query` with a `QueryClientProvider` above the page, which the application client provides.
- A route that only signed-in people reach. The plugin's API answers the signed-in person's own messages and nobody else's; the page takes no user to show.

```ts
{
  name: 'inbox',
  path: '/inbox',
  auth: 'required',
  authz: 'skip',
  componentLoader: () => import('./pages/inbox.js'),
}
```

```tsx
import { InboxPage } from '@/extensions/nocobase-inbox/inbox-page';

export default function Inbox(): ReactElement {
  return <InboxPage />;
}
```

Give the page the height of the layout's content area: the two columns scroll on their own. The `inbox-button` component links a header to it.

## An InboxSource

A source adds three optional calls, each given the application's API client and the query's abort signal. The page owns the queries, under the plugin's `inboxKeys.all`, so invalidating that key after a decision refreshes everything.

```ts
import type { InboxSource } from '@/extensions/nocobase-inbox/source';

export const approvalsSource: InboxSource = {
  id: 'approvals',
  // What the application knows about these messages, by notificationId; leave out the ones it knows nothing about.
  notices: async (ids, { api, signal }) =>
    (await api.request<{ data: InboxNotice[] }>({ path: 'approvals/notices', query: { ids: ids.join(',') }, signal })).data,
  // Every message still waiting on the viewer, in full, so an old one never falls past the first page.
  waiting: async (subject, { api, signal }) => …,
  // How many wait per category id, for the To do count.
  pending: async ({ api, signal }) => ({ decision: … }),
  // Realtime topics of the application's own that refresh the inbox.
  refreshTopics: ['approvals:inbox'],
};
```

A notice's `kind` sorts the message into a category (`decision` or anything else, by default), `source` and `type` choose its renderer, `subject.label` prefixes its card, `count` adds `×N`, and `resolvedAt` with `outcome` settle it: it stays listed, dimmed with a check, and leaves To do. `useInboxNotices`, `useInboxWaiting(source, subject)` and `useInboxPending` read the same queries elsewhere, such as a "Waiting for you" section on the page of what a decision is about, or a header badge counting what waits.

## Renderers

A message whose source nobody renders shows its title and body as sent, and nothing to act on. Register a renderer per sender for anything more, in a registry passed to the page:

```tsx
const registry: InboxRegistry = {
  renderers: [
    defineInboxRenderer({
      source: 'approvals',
      icon: () => StampIcon,
      useWording,
      useCanAct,
      Actions,
      Body,
    }),
  ],
  feeds: [],
};

<InboxPage source={approvalsSource} registry={registry} />;
```

`useWording` words the card and the detail pane (`label`, `text`, and optionally `outcome` and `open`, the hint on the title that opens the message's page); `useModel` loads what the detail pane shares once; `useCanAct` answers whether the viewer may act, and `Actions` and `Body` render in the detail pane, where `onDecided` marks the message read. `Actions` sits right under the title: render real buttons at the default size, the main decision primary and first, the others outline, and the destructive style only for an action that destroys something; `DecisionActionsBar` does this for approve and reject. Leave out a button that opens what the message is about, since the title already does. A renderer with a `namespace` renders in that i18n namespace and may bring its `resources`; the inbox's own words stay in the page's. `InboxRegistryProvider` provides a registry to other pages that render cards with `InboxTypeIcon` and `useRendererOf`.

## Categories and views

The kind filter lists every kind, then the registry's `categories`, `defaultInboxCategories` when left out: `decisionCategory` (notices of kind `decision`, which wait until settled) and `infoCategory` (everything else). All lists every message, newest first within each category; To do lists the unsettled messages of the categories that wait, and its filter offers only those. The view and the kind are `?view=todo` and `?kind=<id>`, the selection `?item=<id>`.

A category is either a group of messages (`type: 'entries'`, with `match`, `title`, `empty` and `waits`) or a collection whose records live in another API (`type: 'collection'`), such as plans the viewer is asked to decide. A collection's `useCollection` hook runs on every render of the page and answers its `group`, shown after the category named by `after` while every kind shows, its `list`, shown in place of the messages while the filter selects it, its `count` and whether it has `loaded`; `Detail` shows the record its `param` selects, under an `InboxDetailHeader` so it reads like every other kind: its kind line, its title linking to the record's page, its facts as `meta` and its actions under the title, with no second header of its own in the body. Its `params` are dropped with the selection when the filter changes. The categories are fixed for the page, since their hooks run in their order.

A feed (`InboxFeed`) is an older, narrower form for decisions kept in another API: listed before the decisions and counted as waiting.

## Slots

| Prop              | What it does                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `detailToolbar`   | Renders before the detail pane's read and delete buttons with the message, its title and its renderer's `context` |
| `listFooter`      | Renders beside the kind filter, such as a sound reminder switch                                                   |
| `onPendingChange` | Called with what waits on the viewer once loaded and whenever it changes                                          |
| `notify`          | Replaces the application toaster for "Deleted.", "All marked as read." and failed requests                        |
| `title`           | Replaces the page title and `description` the sentence under it                                                   |
| `idPrefix`        | Names the element ids and test ids it renders, such as `<prefix>-detail`; `nocobase-inbox` by default             |
| `pageSize`        | Messages loaded per page                                                                                          |

## Translations

Spread each file of `locales/` into the matching application locale, before the application's own keys so they can reword it:

```ts
import inboxEnUS from '@/extensions/nocobase-inbox/locales/en-US';

const enUS = {
  ...inboxEnUS,
  // the application's own keys
};
```

`zh-CN.ts` is typed with `InboxLocale`, so a key missing from it fails `typecheck`; add a new language the same way. The page also looks up `inbox.outcomes.<outcome>` for a settled decision whose renderer does not word it, falling back to the outcome as sent; the locales word `approved`, `rejected` and `withdrawn`, and an application adds its own outcomes beside them.
