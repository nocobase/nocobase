---
'@nocobase/authorization': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-notification': patch
---

Separate business resource declarations from underlying handler registration through `resourceTypes`. Remove transitional registration aliases and legacy title decoding. Store rule record IDs directly in each action's JSON, preserving independent named scopes without auxiliary record tables. Initialize the sales example and Hub permission titles directly in their final form, without development-version upgrade scripts.
