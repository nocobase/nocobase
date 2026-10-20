---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Guard unrestricted-only pages in the route guard and menus

A page whose resolved `authz` is `'unrestricted'` — declared explicitly, or the default for a protected App or settings page that omits `authz` — is now checked through the authorization client's unrestricted requirement. Only identities with unrestricted access, such as root, can open it; for everyone else it is hidden from the App, settings and dev menus, and opening its URL shows "Access denied" without loading the page component. `AGENTS.md` describes the new rule: declare `authz` on the first page of every path, nested pages inherit it, and an omitted value no longer stops the application but defaults to unrestricted-only for protected App and settings pages and to `'skip'` for guest, optional and dev pages.
