---
'@nocobase/app-plugin-users': minor
---

Add per-user preferences. The migration `202610020201_create_user_preferences` creates the `userPreferences` table, one JSON value per person and key; `userPreferencesServiceToken` resolves `UserPreferencesService` (`list`, `get`, `set`, `setMany`, `remove`, `removeAll`); and `/api/users/me/preferences` lets the signed-in person read and write their own (`GET`, `PATCH`, `PUT /:key`, `DELETE /:key`), refusing scoped API keys and service-account keys. The new `@nocobase/app-plugin-users/client/preferences` entry exports `useUserPreference`, which keeps a local cache for the first paint, takes the server's values as the source of truth, and moves a value an application kept in `localStorage` to the server once.
