---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
'@nocobase/app-plugin-authorization': patch
---

Saving a role keeps every scope it has on other objects' records while that object's View is off, so opening a seeded role and saving it, or only renaming it, no longer clears them; the editor shows the stored value read-only with "Needs X view" until an administrator turns that View on. The authorization guides explain how preset roles grant the View of the objects their operations read.
