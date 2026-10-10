---
'@nocobase/app-template-default': patch
'@nocobase/app-template-hub': patch
'@nocobase/db': patch
'@nocobase/app-client': patch
'@nocobase/realtime': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-notification-in-app': patch
---

Preserve configured API and realtime endpoints after splitting the client services. Integrate file inventory and the plugin-owned inbox with the shared API and realtime clients, including reconnection refresh and isolated event listeners.

Allow the Oracle driver install script in both templates’ standalone deployment workspace settings.

Resolve SQLite auto-incrementing bigint metadata correctly, narrow Oracle LOB values before reading their type, preserve legacy file timestamps, and rebuild the AI registry against the current API client.
