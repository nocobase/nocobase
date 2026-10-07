# Inbox Integration Contract

## Required packages

- `@nocobase/app-plugin-authentication` supplies the authenticated user and session.
- `@nocobase/app-plugin-notification-in-app/server` supplies inbox persistence and HTTP routes.
- `@nocobase/app-plugin-notification/server` is required when the application needs the registered `in-app` Channel and Provider contribution.
- `@nocobase/app-client` supplies the application-scoped HTTP and realtime clients used by the Client inbox page.

Register the core notification Server plugin before the in-app Server plugin. The in-app routes can operate without the core plugin, but notification delivery through the `in-app` Channel cannot.

## Public surfaces

The package root and `/server` export the Server plugin and supported Server contracts. Browser or shared code imports only the topic and event types from:

```ts
import {
  IN_APP_NOTIFICATION_REALTIME_TOPIC,
  type InAppNotificationRealtimeEvent,
} from '@nocobase/app-plugin-notification-in-app/realtime';
```

Do not import `server/realtime`, store implementations, or other internal implementation paths from application code.

An application that renders its own inbox imports the React Query hooks from `/client/inbox`, with `@tanstack/react-query` installed and a `QueryClientProvider` above them:

```ts
import {
  inboxKeys,
  useInboxActions,
  useInboxItems,
  useInboxRefresh,
  useInboxUnreadCount,
} from '@nocobase/app-plugin-notification-in-app/client/inbox';
```

Prefer the hooks over calling the API helpers from components: `useInboxItems(pageSize)` pages by `nextPageToken`, `useInboxActions()` marks, deletes and reads all optimistically and refetches once settled, and `useInboxRefresh(extraTopics)` mounts the realtime, reconnection and focus invalidation once for the page. Extend `inboxKeys.all` invalidation for data the application attaches to messages by passing its own realtime topics to `useInboxRefresh` rather than subscribing separately.

The package's Client plugin contributes this development-only App-relative route:

```text
/dev/notification-in-app
```

Register `@nocobase/app-plugin-notification-in-app/client` in the application Client composition root. The application renders the page inside its shell without a navigation entry, so open it by URL. The page mounts `NotificationInAppProvider` locally and cleans up its realtime and focus listeners when navigation leaves the page. The Dev Route and its exclusive dependencies are absent from production builds.

## Final delivery validation

The database Provider checks the recipient through Authentication’s user administration service immediately before writing the inbox item. A missing user returns a non-retryable `recipient` failure and creates no inbox item or realtime event. A lookup failure remains a retryable storage failure. Custom hosts calling `createDatabaseProviderDefinition` must supply `recipientExists(userId)` backed by their authoritative user directory; do not use a permissive fallback.

## HTTP and realtime behavior

The authenticated inbox API is rooted at `notificationInApp` relative to the injected `ApiClient` API base. Reads are `GET notificationInApp/messages` (`pageSize`, `unreadOnly`, `pageToken`; answers `{ data, meta: { nextPageToken } }`) and `GET notificationInApp/messages/unreadCount` (`{ data: { count } }`). Writes are `POST notificationInApp/messages/{messageId}/markRead`, `POST .../markUnread`, `DELETE notificationInApp/messages/{messageId}` (`204`) and `POST notificationInApp/messages/markAllRead`; they need no CSRF token, because the authentication plugin rejects a cookie-authenticated write from an untrusted origin with 403 `INVALID_CSRF_ORIGIN` (domain `authentication`). Without a signed-in user every inbox route answers 401 `AUTHENTICATION_REQUIRED` (domain `authentication`) from the authentication plugin. Other failures use the standard error body with domain `notificationInApp`; branch on `ApiClientError.reason`, such as `IN_APP_NOTIFICATION_NOT_FOUND` or `IN_APP_NOTIFICATION_INVALID_PAGE_TOKEN`, never on the message. Prefer the `/client/inbox` hooks in React, and the exported `fetchInbox`, `fetchUnreadCount`, `mutateInboxItem` and `markInboxRead` helpers elsewhere, over hand-written requests.

The running application documents every inbox route under the `NotificationInApp` tag at `/api/swagger/docs` (JSON at `/api/swagger`, signed in); check a request or response shape there rather than guessing it.

For a custom host, register the exported `IN_APP_NOTIFICATION_NAMESPACE` and `inAppNotificationServerLocales` with its `I18nRuntime`, initialize the runtime, then mount its request i18n middleware before the inbox router. Notification-owned failures return a stable `error.code/message/ns/key/params` envelope; branch on `code`, display `message`, and use `ns`, `key`, and `params` only when the Client needs to retranslate it. Authentication middleware retains its owning plugin's error contract.

The WebSocket topic is user-scoped by the Server. An `inbox.changed` event does not carry authoritative inbox contents; it tells the UI to refetch HTTP state. The UI also refetches when the realtime connection opens so events missed during disconnection are recovered. Window focus is a fallback invalidation.

When an application configures `api.baseURL` or `api.realtimeURL`, both transports must use those injected client settings. Never derive the HTTP endpoint from `window.location`, a Portal base, or the WebSocket URL.

#### Ownership and upgrades

The plugin owns the inbox components, Provider, Dev Route, authentication enforcement, per-user isolation, persistence, and event publication. Applications receive UI changes by upgrading the plugin. A production inbox surface requires a separate product decision and must use an authenticated App or Settings Route rather than exposing the Dev Route.

## Diagnosis order

1. Confirm the authenticated list and unread-count endpoints return the expected durable state.
2. Confirm mutations send no CSRF token and return the changed item/count.
3. Confirm the application client points HTTP and realtime transports at the intended backend.
4. Confirm the realtime connection subscribes to the public topic.
5. Confirm a valid invalidation increments the UI revision and triggers an HTTP refetch.
6. Confirm reopening the realtime connection refetches even when no event was received.
7. Confirm cleanup removes the topic, connection-open, and window-focus listeners.

Do not diagnose a missing UI update by manually changing the inbox table or publishing synthetic production events. Reproduce with an isolated test notification or inspect the durable route and subscription logs.

Configure `notification.channels.inbox: { provider: 'in-app' }` and send `messages: { inbox: { to: 'user-id', title: 'Title', body: 'Body' } }`. Channel keys are names; multiple names using `in-app` are independent targets. `to` requires an application user ID or a non-empty readonly array, with one Delivery per user. No current user is inferred. The test form requires an explicit recipient.

Use `target: { type: 'route', path: '/topics/123' }` for an internal route without the deployment prefix, or `target: { type: 'url', url: 'https://example.com/main/topics/123' }` for a complete HTTP(S) URL. The inbox adds the Router basename only for routes. Without a target, no Open link is shown. Legacy `actionUrl` is ignored; run the new target-column migration without converting old links.
