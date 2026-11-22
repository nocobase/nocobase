# Inbox

The `/inbox` page of `@nocobase/app-plugin-notification-in-app`, generated from the plugin's own source (`packages/plugins/app-plugin-notification-in-app/client/inbox-page/`). **You do not need it to have an inbox:** register the plugin on the server and the client, and it provides this page at `/inbox` (route `inbox`) and the header's inbox button with its badge. Customize the plugin's page first, in this order: its options (`notificationInApp({ headerButton: false, inboxPath: '/messages' })`), its extension points (entry renderers registered with `inboxRenderersToken`, pending sources with `inboxSourcesToken`, both from `@nocobase/app-plugin-notification-in-app/client`), and only then replace the page. Install this block when you want to own the page entirely: it copies the page into `client/extensions/nocobase-inbox/` for you to edit, and the copy no longer follows the plugin's upgrades.

The page is a master–detail inbox: a rail with All, Unread, Pending (what waits on the viewer, counted in amber) and the notification categories with their unread counts; a list grouped as Pending, Today and Earlier; a detail pane with read, unread, delete and the title linking to the item's page; "Mark all as read", `j` / `k` and Enter, and a refresh whenever the plugin's realtime signal, a reconnection or the window's focus says the inbox changed. The messages, their read state and their deletion are always the plugin's, through its React Query hooks in `@nocobase/app-plugin-notification-in-app/client/inbox`; the categories come from the notification plugin's kinds (`GET /notifications/preferences`).

| File                       | Exports                                                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inbox-page.tsx`           | `InboxPage`, the route's page, and `InboxNotify`                                                                                                         |
| `inbox-rail.tsx`           | `InboxRail`, the views and categories                                                                                                                    |
| `inbox-list.tsx`           | `InboxList`, the list column                                                                                                                             |
| `inbox-detail.tsx`         | `InboxDetail`, the detail pane, `InboxDetailHeader`, the header every kind shares, and `InboxDetailToolbarInput`                                         |
| `inbox-item.tsx`           | `InboxItemCard` and `InboxTypeIcon`                                                                                                                      |
| `decision-actions-bar.tsx` | `DecisionActionsBar`: approve, and reject with a required comment, for a renderer's `Actions`                                                            |
| `categories.ts`            | `useInboxCategories` and `useInboxCategoryLabel`, the notification categories with their unread counts                                                   |
| `source.ts`                | `InboxSource`, `defaultInboxSource`, `inboxSourceKeys`, and `useInboxNotices`, `useInboxWaiting` and `useInboxPending` for the application's other pages |
| `registry.ts`              | `InboxEntryRenderer`, `InboxFeed`, `InboxRegistry`, `defineInboxRenderer`, the default categories, and the hooks reading the registry                    |
| `registry-scope.tsx`       | `InboxRegistryProvider` and `ContributorScope`                                                                                                           |
| `model.ts`                 | `InboxEntry`, `InboxNotice`, the categories' types, and the pure rules of the list                                                                       |
| `frame.ts`                 | the inbox's own wording, taken outside a contributor's namespace                                                                                         |
| `inbox-actions.ts`         | `InboxAction`: read, unread and delete                                                                                                                   |

The files say at their top that they are generated: in this repository, edit the plugin and run `node scripts/sync-ui-library-inbox.mjs` (`--check` fails when the block is stale). In your copy, delete that line and edit freely.

## Replacing the plugin's page with the copy

Keep the plugin registered: the copy still reads its hooks, its translations and its extension lists. Replace its page by the route id `@nocobase/app-plugin-notification-in-app:inbox`, passing `routeComponentOverrides` to `defineAppRuntime()` in `client/runtime.ts`:

```ts
// client/route-overrides.ts
import {
  defineClientRouteComponentOverrides,
  type AppClientRouteComponentOverrideDefinition,
} from '@nocobase/app-client/plugins';

export const routeComponentOverrides: readonly AppClientRouteComponentOverrideDefinition[] =
  defineClientRouteComponentOverrides([
    {
      routeId: '@nocobase/app-plugin-notification-in-app:inbox',
      componentEntry: './client/pages/inbox',
      componentLoader: () => import('./pages/inbox.js'),
    },
  ]);

export default routeComponentOverrides;
```

```tsx
import { InboxPage } from '#extensions/nocobase-inbox/inbox-page';

export default function Inbox(): ReactElement {
  return <InboxPage />;
}
```

Give the page the height of the layout's content area: the columns scroll on their own. Without a `source` or `registry` prop the page uses what is registered with the plugin's `inboxSourcesToken` and `inboxRenderersToken`, so renderers and sources other plugins register keep working in the copy.

## An InboxSource

A source adds three optional calls, each given the application's API client and the query's abort signal. The page owns the queries, under the plugin's `inboxKeys.all`, so invalidating that key after a decision refreshes everything.

```ts
import type { InboxSource } from '#extensions/nocobase-inbox/source';

export const approvalsSource: InboxSource = {
  id: 'approvals',
  // What the application knows about these messages, by notificationId; leave out the ones it knows nothing about.
  notices: async (ids, { api, signal }) =>
    (await api.request<{ data: InboxNotice[] }>({ path: 'approvals/notices', query: { ids: ids.join(',') }, signal })).data,
  // Every message still waiting on the viewer, in full, so an old one never falls past the first page.
  waiting: async (subject, { api, signal }) => …,
  // How many wait per category id, for the Pending count and the header badge.
  pending: async ({ api, signal }) => ({ decision: … }),
  // Realtime topics of the application's own that refresh the inbox.
  refreshTopics: ['approvals:inbox'],
};
```

A notice's `kind` sorts the message into a category (`decision` or anything else, by default), `source` and `type` choose its renderer, `subject.label` prefixes its card, `count` adds `×N`, and `resolvedAt` with `outcome` settle it: it stays listed, dimmed with a check, and leaves Pending. `useInboxNotices`, `useInboxWaiting(source, subject)` and `useInboxPending` read the same queries elsewhere, such as a "Waiting for you" section on the page of what a decision is about, or a header badge counting what waits.

## Renderers

A message nobody renders shows its title and body as sent, with Open when it has a target, and nothing to act on. A renderer matches a message by its notification `kind` (`kinds: ['approval.requested']`) first, else by its notice's `source` and `types`. Register renderers with the plugin (`app.container.resolve(inboxRenderersToken).register(renderer)` from a client service provider's `boot()`), or pass a registry to the page:

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

## Views and categories

The rail's views are All, Unread (`?view=unread`, asked of the server with `unreadOnly`) and Pending (`?view=todo`: the unsettled messages of the categories that wait); a notification category is `?category=<key>`, asked of the server with `category`. Within them the list groups the messages by the registry's `categories`, `defaultInboxCategories` when left out: `decisionCategory` (notices of kind `decision`, which wait until settled), `todayCategory` (today's other messages) and `infoCategory` (Earlier). A registry with collection categories adds a type filter, `?kind=<id>`. The selection is `?item=<id>`.

A category is either a group of messages (`type: 'entries'`, with `match`, `title`, `empty` and `waits`) or a collection whose records live in another API (`type: 'collection'`). A collection's `useCollection` hook runs on every render of the page and answers its `group`, shown after the category named by `after` while every kind shows, its `list`, shown in place of the messages while the filter selects it, its `count` and whether it has `loaded`; `Detail` shows the record its `param` selects, under an `InboxDetailHeader` so it reads like every other kind: its kind line, its title linking to the record's page, its facts as `meta` and its actions under the title, with no second header of its own in the body. Its `params` are dropped with the selection when the filter changes. The categories are fixed for the page, since their hooks run in their order.

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

The page renders in the plugin's namespace, `@nocobase/app-plugin-notification-in-app`, so the plugin's locales translate it. To reword the copy, change its keys' `defaultValue` or bind it to your application's namespace and add the keys to your locales. The page also looks up `inbox.outcomes.<outcome>` for a settled decision whose renderer does not word it, falling back to the outcome as sent.
