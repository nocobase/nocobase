# Notification Logs UI

Install `@nocobase/notification-logs-ui` from the UI Library for editable delivery and Provider attempt logs. The block uses the authenticated `GET /api/notifications/logs` API exposed by `@nocobase/app-plugin-notification`. It displays the newest 100 logs; the API's `meta.nextPageToken` can be passed back as `pageToken` when extending the application-owned UI with pagination.

Import `NotificationLogsPage` from the installed `index.ts` and mount it in an application-owned route. The application chooses the route and its access policy; the block registers neither a plugin nor a route. `NotificationLogsView` accepts a `loadLogs(signal)` callback for a different data source or a static preview. Keep authorization on the server API.

Merge each installed `locales/<locale>.ts` default export into the matching application or consuming plugin resource, before local overrides. The block uses the current namespace under `notificationLogs`, with English defaults. All ten existing translations are included. It does not require the original plugin's namespace for presentation.

Inside the NocoBase repository, copy the files and dependencies declared in `ui-library/registry/notification/registry.json`, preserving workspace dependency ranges. Outside the repository, run `pnpm exec shadcn add @nocobase/notification-logs-ui` from the consuming project. Installed source belongs to the application: merge upstream changes while preserving its customizations, and remove only the installed block when it is no longer used.
