---
'@nocobase/app-client': minor
'@nocobase/app-plugin-foundation': patch
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-skills': minor
---

Organize application administration as one System settings sidebar entry that opens a home page of cards grouped by category, with URL-backed tabs inside a module. Route navigation accepts an optional `description` that the settings home shows on each card, and App Foundation declares one. Existing settings URLs, route ids and authorization stay unchanged; updating dependencies alone keeps an existing application's navigation, so reconcile the application-owned navigation transform, routing, settings pages and locales with the `nocobase-app-upgrade` Skill's System settings navigation guide.
