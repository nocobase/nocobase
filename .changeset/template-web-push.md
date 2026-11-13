---
"@nocobase/app-template-default": minor
"@nocobase/app-template-examples": minor
"@nocobase/app-plugin-notification-web-push": patch
"@nocobase/app-skills": patch
---

The Default and Examples templates install `@nocobase/app-plugin-notification-web-push`: the plugin in `server/plugins.ts` and `client/plugins.ts`, `push` configuration, a `webPush` notification channel, and a Push notifications item in the account menu where each person subscribes this device, pauses, removes or tests their own devices. Push stays off and the settings say it is not configured until `push.privateKey` (`WEB_PUSH_PRIVATE_KEY`) is set; `pnpm nocobase config init` does not generate it, and `config.example.yml` shows how. Notification permission is requested only from the Subscribe button, never on page load, sign-in or installation, and the plugin's worker is the only one registered. Signing out removes the current browser's device first and stops if that fails. Nothing is sent until the application's own code sends to the channel.

`unsubscribeDevice` now treats a device that was already removed, for example from another device, as done, so signing out is no longer blocked by it.

Existing applications adopt it through the template upgrade, which adds the `webPushSubscriptions` table through the plugin's migration; the `nocobase-app-upgrade` Skill lists the files to merge.
