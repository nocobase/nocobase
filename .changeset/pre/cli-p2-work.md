---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-notification-in-app': patch
---

Name the command-line commands of users, API keys and the in-app inbox. The routes carry `x-cli` hints: `user list|create|update|delete|enable|disable|reset-password|revoke-sessions|options|role-scope set|invitation …|preference …` (the invitation link's `lookup` and `accept` stay off the command line), `api-key list|create|rotate|delete|scope-options|scope-objects`, and `inbox list|delete|mark-read|mark-unread|mark-all-read|unread-count`.
