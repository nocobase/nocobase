---
'@nocobase/app-plugin-notification-web-push': patch
---

Let a push message carry the installed app's icon badge count and the time it was read; the worker sets or clears the badge when the push arrives, ignores a count read before the newest it applied, and asks open windows to set it again.
