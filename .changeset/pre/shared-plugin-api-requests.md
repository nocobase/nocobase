---
'@nocobase/app-plugin-notification': patch
---

Use the application's API client for Hub artifact uploads and the notification logs Registry page so requests honor the configured API base URL. Pass the client explicitly to uploadArtifact and fetchNotificationLogs while retaining upload bodies, log responses and cancellation.
