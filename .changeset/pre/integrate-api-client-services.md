---
'@nocobase/app-client': major
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-file': minor
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-workflow': patch
'@nocobase/app-plugin-routes-example': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-hub': patch
---

Replace the composite application transport with application-owned `ApiClient` and `RealtimeClient` services. Client plugins, examples, and application templates now use object-style HTTP request options through the shared API client, while realtime subscriptions resolve their dedicated WebSocket client.
