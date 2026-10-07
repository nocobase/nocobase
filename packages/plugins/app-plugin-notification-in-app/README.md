# @nocobase/app-plugin-notification-in-app

Server-side in-app notification Channel for the NocoBase v3 notification
runtime. It stores one inbox item per Delivery and exposes an authenticated,
user-isolated inbox API.

## Public entries and registration

The package exports its Server plugin and public Server contracts from both the
package root and `/server`. Register it in the target App's Server plugin list
after `@nocobase/app-plugin-notification` when durable notification delivery is
needed. Its `/client` entry contributes a development-only inbox page. The package keeps
`@nocobase/app-plugin-notification` as a peer because it imports the shared
notification contracts. Registering the core Server plugin is optional: the
inbox store and routes require only the database and authentication services,
so they remain available when that Server plugin is not registered. Only the
Channel and Provider contribution is skipped in that case.

The plugin registers:

- the `in-app` Channel and database Provider;
- a test adapter requiring an explicit application user ID;
- the `notificationInAppItems` migration;
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

The list accepts `pageSize` (an integer from 1 to 100, defaulting to 20), `unreadOnly=true` to restrict the result to unread messages, and `pageToken`, the `meta.nextPageToken` of the previous page; `nextPageToken` is absent on the last page. Pages follow a stable `(createdAt, id)` order. Clients must treat page tokens as opaque and must not construct or persist internal table queries.

The write methods take no body and need no token of their own. A write authenticated by the browser's session cookie is protected from cross-site forgery by the authentication plugin, which rejects it with 403 `INVALID_CSRF_ORIGIN` (domain `authentication`) unless its `Origin` or `Referer` is the application's own or a trusted origin.

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

| Export                          | What it does                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `inboxKeys`                     | Query keys, all under `inboxKeys.all` (`['notificationInApp', 'inbox']`), so one invalidation refreshes the list and the count                |
| `useInboxItems(pageSize?)`      | The viewer's messages as an infinite query, 25 per page by default; `fetchNextPage()` follows `nextPageToken`                                 |
| `useInboxUnreadCount()`         | The unread count                                                                                                                              |
| `useInboxActions()`             | `{ mark(id, action), readAll(), pending }`: updates the cached list and count at once, restores them if the server refuses, refetches settled |
| `useInboxRefresh(extraTopics?)` | Invalidates `inboxKeys.all` on the plugin's realtime signal, on reconnection and on window focus, and on each of `extraTopics`                |

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

## Client inbox page

Register the package's `/client` entry to add the inbox component example to
the built-in Dev Route. In development it is available at
`/dev/notification-in-app` inside the App shell, such as
`/main/dev/notification-in-app` when the App public base is `/main`. The App's
navigation does not list dev pages, so open the URL directly. The route and its
page module are absent from production builds.

The page mounts its inbox Provider locally, subscribes only while the page is
open, reconnects after authentication changes, and refetches the unread count
on realtime invalidation, WebSocket reconnection, and browser focus. HTTP state
remains authoritative.

## Development

Tests live in `tests/` and include Client Route and inbox runtime behavior,
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

Configure `notification.channels.inbox: { provider: 'in-app' }` and send `messages: { inbox: { to: '123', title: 'Approved', body: 'Review the result' } }`. The native `to` value accepts one application user ID or a non-empty readonly array. Each user receives an independent Delivery and retry; no current user is inferred.
