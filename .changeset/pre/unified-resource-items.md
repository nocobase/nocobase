---
'@nocobase/authorization': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Unify grantable resource registration through getResource(type).items and separate recursive display groups. Move authorization settings to module-qualified items under the built-in settings resource, replace the database collections registration entry point, and preserve page navigation groups in the resource picker. Existing authorization settings grant records are not migrated.

Replace the permission-set list and separate detail view with a collapsible, searchable sidebar and routed permission configuration and user-assignment tabs. Keep edits in the workspace with save/discard controls and protected-set restrictions. Present registered resources in an expandable tree with searchable field configuration in a local floating panel, and toggle simple permissions directly between full access and no grant.
