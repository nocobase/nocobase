---
'@nocobase/app-plugin-notification-in-app': minor
---

Add `@nocobase/app-plugin-notification-in-app/client/inbox`, React Query hooks for an application that renders its own inbox: `inboxKeys`, `useInboxItems(pageSize)` (paged by `nextPageToken`), `useInboxUnreadCount()`, `useInboxActions()` (`mark(id, action)` and `readAll()`, applied to the cached list and count at once, restored if the server refuses and refetched once settled) and `useInboxRefresh(extraTopics)` (refetch on the realtime signal, reconnection, window focus and further topics). `@tanstack/react-query` is now a peer dependency; the application templates already provide it.
