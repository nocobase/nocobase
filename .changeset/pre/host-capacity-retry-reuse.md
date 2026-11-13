---
'@nocobase/app-host': patch
'@nocobase/app-plugin-releases': patch
---

Keep the expanded release when the App Host refuses a deployment for memory or capacity, so the retry after a recycle or a Host restart reuses it instead of extracting it again, and stop appending an unset active app limit to capacity errors. Show one state per app in the Releases app list and app overview, with a pending deployment taking precedence and the runtime's last failure as its detail, and word capacity refusals and the recycle wait in every supported language.
