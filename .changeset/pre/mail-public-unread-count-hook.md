---
'@nocobase/app-plugin-mail': patch
---

Expose `useMailUnreadCount` and `MailUnreadCountState` from the public client entry for custom menus, and reuse the Hook in the navigation icon. Preserve current-user count semantics, local/realtime/reconnect/focus refresh, polling, debounce and serialized requests. The Hook distinguishes an unknown initial count from zero, retains the last successful count on refresh failure, and exposes loading/error state. Consumers must remount with session changes; separate Hook instances fetch independently without a global cache.
