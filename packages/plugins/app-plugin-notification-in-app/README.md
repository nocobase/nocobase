# @nocobase/app-plugin-notification-in-app

Server-side in-app notification Channel for the NocoBase v3 notification
runtime. It stores one inbox item per Delivery and exposes an authenticated,
user-isolated inbox API.

## Public entries and registration

The package exports its Server plugin and public Server contracts from both the
package root and `/server`. Register it in the target App's Server plugin list
after `@nocobase/app-plugin-notification` when durable notification delivery is
needed. Its `/client` entry contributes the inbox page (route `inbox`, `/inbox`) and the header's inbox button. The package keeps
`@nocobase/app-plugin-notification` as a peer because it imports the shared
notification contracts. Registering the core Server plugin is optional: the
inbox store and routes require only the database and authentication services,
so they remain available when that Server plugin is not registered. Only the
Channel and Provider contribution is skipped in that case.

The plugin registers:

- the `in-app` Channel and database Provider;
- the `notificationInAppItems` migrations, including the `kind`, `category`, `sourceType` and `sourceId` columns `notify()` fills (older items keep them empty);
- authenticated inbox routes under `/api/notificationInApp`.

## Inbox API

| Operation                        | Route                                                         | Success                                        |
| -------------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| List the current user's messages | `GET /api/notificationInApp/messages`                         | `200 { data: [...], meta: { nextPageToken } }` |
| Count unread messages            | `GET /api/notificationInApp/messages/unreadCount`             | `200 { data: { count } }`                      |
| Mark every message read          | `POST /api/notificationInApp/messages/markAllRead`            | `200 { data: { updated } }`                    |
| Mark one message read            | `POST /api/notificationInApp/messages/{messageId}/markRead`   | `200 { data: message }`                        |
| Mark one message unread          | `POST /api/notificationInApp/messages/{messageId}/markUnread` | `200 { data: message }`                        |
| Delete one message               | `DELETE /api/notificationInApp/messages/{messageId}`          | `204`, no body                                 |

The running application's API document lists these operations under the `NotificationInApp` tag with their parameters, response schemas and errors: open `/api/swagger/docs` while signed in, or read the JSON at `/api/swagger`. Their operationIds are `notificationInAppListMessages`, `notificationInAppCountUnreadMessages`, `notificationInAppMarkAllMessagesRead`, `notificationInAppMarkMessageRead`, `notificationInAppMarkMessageUnread` and `notificationInAppDeleteMessage`.

The list accepts `pageSize` (an integer from 1 to 100, defaulting to 20), `unreadOnly=true` to restrict the result to unread messages, `category` to restrict it to one notification category (the kind's `categoryKey`, such as `projects`), and `pageToken`, the `meta.nextPageToken` of the previous page; `nextPageToken` is absent on the last page. Pages follow a stable `(createdAt, id)` order. Clients must treat page tokens as opaque and must not construct or persist internal table queries.

The write methods take no body and need no token of their own. A write authenticated by the browser's session cookie is protected from cross-site forgery by the authentication plugin, which rejects it with 403 `INVALID_CSRF_ORIGIN` (domain `authentication`) unless its `Origin` or `Referer` is the application's own or a trusted origin.

`GET /api/notificationInApp/messages/unreadCount?byCategory=true` also answers `categories: [{ category, count }]`, the unread messages per category; messages without a category have no `category` key. The inbox page takes each category's name from `GET /api/notifications/preferences`.

Durable inbox mutations publish a user-scoped realtime invalidation event. Clients use that event as a refetch signal and continue to treat the HTTP API as the authoritative inbox state.

Every operation runs behind the authentication plugin's `auth.required()` and takes the user only from its Better Auth session, never from the NocoBase session, so signing out ends inbox access at once. Reads and writes are constrained to that user; another user's message is reported as not found. Failures use the application's standard error body with domain `notificationInApp`; clients branch on `reason`:

| Status | `reason`                                            | When                                                  |
| ------ | --------------------------------------------------- | ----------------------------------------------------- |
| 400    | `INVALID_INPUT` (domain `app`)                      | `pageSize` or another parameter is invalid            |
| 400    | `IN_APP_NOTIFICATION_INVALID_PAGE_TOKEN`            | `pageToken` is not one this list returned             |
| 401    | `AUTHENTICATION_REQUIRED` (domain `authentication`) | No signed-in user                                     |
| 403    | `INVALID_CSRF_ORIGIN` (domain `authentication`)     | A cookie-authenticated write from an untrusted origin |
| 404    | `IN_APP_NOTIFICATION_NOT_FOUND`                     | The message does not exist for this user              |

`localizedMessage` carries the error translated into the request's locale. The normal App composition provides it; custom hosts register the exported `IN_APP_NOTIFICATION_NAMESPACE` and `inAppNotificationServerLocales` with their `I18nRuntime`, then mount the request i18n middleware before this router. Authentication middleware keeps its own error contract.

## Inbox hooks for an application's own inbox

`@nocobase/app-plugin-notification-in-app/client/inbox` is the headless entry for an application that renders its own inbox. It is built on the `/client` API helpers and React Query, which the application provides as the `@tanstack/react-query` peer; the hooks use the nearest `QueryClientProvider`.

| Export                               | What it does                                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inboxKeys`                          | Query keys, all under `inboxKeys.all` (`['notificationInApp', 'inbox']`), so one invalidation refreshes the list and the count                        |
| `useInboxItems(pageSize?, filters?)` | The viewer's messages as an infinite query, 25 per page by default, narrowed by `{ category, unreadOnly }`; `fetchNextPage()` follows `nextPageToken` |
| `useInboxUnreadByCategory()`         | The unread count of each category                                                                                                                     |
| `useInboxUnreadCount()`              | The unread count                                                                                                                                      |
| `useInboxActions()`                  | `{ mark(id, action), readAll(), pending }`: updates the cached list and count at once, restores them if the server refuses, refetches settled         |
| `useInboxRefresh(extraTopics?)`      | Invalidates `inboxKeys.all` on the plugin's realtime signal, on reconnection and on window focus, and on each of `extraTopics`                        |

```tsx
import {
  useInboxActions,
  useInboxItems,
  useInboxRefresh,
} from '@nocobase/app-plugin-notification-in-app/client/inbox';

function Inbox() {
  useInboxRefresh();
  const items = useInboxItems();
  const { mark } = useInboxActions();
  const messages = items.data?.pages.flatMap((page) => page.data) ?? [];
  return messages.map((message) => (
    <button key={message.id} onClick={() => void mark(message.id, 'read')}>
      {message.title}
    </button>
  ));
}
```

Prefer these hooks over calling `fetchInbox` and the mutation helpers from components, so every inbox surface in the application shares one cache and refreshes on the same signals. `mark` and `readAll` reject when the server refuses; show the error where the call was made.

## Client inbox page and header button

Set `inboxRoute: false` to leave the inbox path to the application. Use `headerButton: false` to omit the plugin’s header action independently.

Registering `@nocobase/app-plugin-notification-in-app/client` is enough: the plugin registers the route `inbox` at `/inbox` (signed in, no page grant, because the API answers each person's own messages only) and the header button `inbox` through `headerActions`. The button opens a popover with the latest messages, "Mark all read" and a link to the page; its badge is what waits on the viewer, in the `attention` tone, when a pending source counts anything, else the unread count, else nothing. The badge hook also keeps every inbox query fresh over realtime while the person is signed in, so the button, the page and every other open tab update together.

The page is the master–detail inbox the UI Library block used to copy into the templates: a left rail with All, Unread, Pending and one entry per category; a list grouped as Pending, Today and Earlier; a detail pane that marks read or unread, deletes and opens the item's target. The view, the category and the selected item are in the URL (`?view=unread|todo`, `?category=`, `?item=`). Without a renderer for its kind an item shows its body and Open.

### Customizing it

1. **Register the plugin.** `notificationInApp()` in `client/plugins.ts`, beside `notification()`.
2. **Plugin options.** `notificationInApp({ headerButton: false })` leaves the header button out; `inboxPath: '/messages'` moves the page. The route keeps its name `inbox`.
3. **Extension points.** Two lists, bound by the plugin's client service provider; register into them from your own client service provider's `boot()`:
   - **Entry renderers** (`inboxRenderersToken`): `app.container.resolve(inboxRenderersToken).register(defineInboxRenderer({ kinds: ['approval.requested'], icon, text, detail, actions }))`. A renderer matches an item by its notification `kind` first, else by its notice's `source` and `types`; it gives the icon, the wording, the detail and the actions, such as Approve and Reject through `DecisionActionsBar`.
   - **Pending sources** (`inboxSourcesToken`): `resolve(inboxSourcesToken).register({ id, notices, waiting, pending, refreshTopics })`. `notices` says who sent each item and whether its decision still waits or how it ended ("Approved by Wang Fang"), `waiting` lists what waits on the viewer in full, `pending` counts it per category for the rail and the header badge. Several sources are combined: counts add up, and a failing source leaves the others.
4. **Replace the page.** `routeComponentOverrides: [{ routeId: INBOX_ROUTE_ID, componentLoader: () => import('./pages/my-inbox.js') }]` in the application's `client/plugins.ts` replaces the whole page (`INBOX_ROUTE_ID` is `'@nocobase/app-plugin-notification-in-app:inbox'`); `headerActionOverrides: [{ name: 'inbox', component: MyButton }]` (or `hidden: true`) replaces the button. A replacement can still render the exported `InboxPage` with its own `registry`, `source`, `title` or `detailToolbar`, or build on the `/client/inbox` hooks. The UI Library's inbox block is generated from this plugin's source, for an application that wants to copy the page and own it entirely.

## Development

Tests live in `tests/` and include the Client plugin, header badge and extension points, inbox hooks,
Server Route validation, stable pagination, Provider behavior, and real SQLite
migration `up`/`down` coverage.

```bash
pnpm --filter @nocobase/app-plugin-notification-in-app lint
pnpm --filter @nocobase/app-plugin-notification-in-app typecheck
pnpm --filter @nocobase/app-plugin-notification-in-app test
pnpm --filter @nocobase/app-plugin-notification-in-app build
```

### Recipient validation

Final delivery checks that the recipient exists through Authentication’s user administration service. Missing recipients fail with category `recipient` and disposition `never`, without an inbox write or realtime event. User lookup errors remain retryable storage failures. Custom hosts using `createDatabaseProviderDefinition` must provide `recipientExists(userId): Promise<boolean>` backed by their user directory.

## Notification targets

Pass `target: { type: 'route', path: '/topics/123' }` for application navigation. Do not include the deployment prefix: the inbox Router adds its basename. Pass `target: { type: 'url', url: 'https://example.com/main/topics/123' }` for a complete HTTP(S) link, opened through a native anchor in the current page. Query strings and fragments are supported. Without a target, no Open link is shown.

Run the target-column migration before using the updated inbox. It adds nullable JSON storage; existing `actionUrl` values are ignored and never converted. The old column is left unused. For multi-Channel sends, provide a complete message under each `messages` key, with an IM URL or links in email bodies as appropriate.

Configure `notification.channels.inbox: { type: 'in-app' }`. Business code sends to people with `notify(kind, { to: userIds })` from `@nocobase/app-plugin-notification`: the in-app channel reaches every user by their ID and fills the item's `kind`, `category`, `sourceType` and `sourceId`. A direct send uses `messages: { inbox: { to: '123', title: 'Approved', body: 'Review the result' } }`. The native `to` value accepts one application user ID or a non-empty readonly array. Each user receives an independent Delivery and retry; no current user is inferred.
