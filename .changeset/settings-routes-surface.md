---
'@nocobase/app-client': minor
---

Add `defineSettingsRoutes()` so plugins and applications can declare configuration pages again. Settings pages take the same definitions as `defineAppRoutes()`, join the one shared route tree with its authorization, breadcrumbs and lazy component loading, and are mounted under `/settings` (`SETTINGS_ROUTE_PATH`) with `surface: 'settings'` on every registered route (`isSettingsRoute()`). A group declared at the root of a settings contribution is a category shared across packages, so a plugin places a page with a bare `parent` such as `parent: 'settingsSystem'`; a missing or duplicate category, and nesting a route under a group of the other surface, fail registration with a message that names the fix.
