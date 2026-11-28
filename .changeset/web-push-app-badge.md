---
'@nocobase/app-plugin-notification-web-push': patch
---

Let a push message carry the installed app's icon badge count and its version from `nextBadgeVersion()`; the worker sets or clears the badge when the push arrives and ignores a count older than the newest one a push or a page applied through `setAppBadge()`, and asks open windows to set it again.
