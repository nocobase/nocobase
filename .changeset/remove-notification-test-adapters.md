---
"@nocobase/app-plugin-notification": major
"@nocobase/app-plugin-notification-example": patch
"@nocobase/app-plugin-notification-in-app": major
"@nocobase/app-plugin-notification-providers": major
"@nocobase/app-plugin-notification-web-push": patch
"@nocobase/app-plugin-projects": patch
"@nocobase/app-plugin-realtime-example": patch
"@nocobase/app-plugin-users": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Remove the Notification TestAdapter protocol, built-in form descriptors, generic test-send routes and permission, and test client methods. Channel classes now implement only their delivery lifecycle. Existing send/sendTransient contracts, retries, logs, and inbox records remain unchanged.

Applications should remove test buttons and test API clients, then verify delivery through their business flows or a server-side send() call. Log pages must read provider identities from recorded deliveries rather than test target metadata. Update the notification Skill and example guidance to match, and republish consumers against the new notification package line.
