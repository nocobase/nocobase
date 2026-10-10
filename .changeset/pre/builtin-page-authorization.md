---
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Install page authorization automatically alongside permission sets and database authorization in createAppAuthorization. Remove explicit pages() installation from application configuration; the Default, Examples and Hub templates now configure only optional access-rule plugins. Page grants and route access behavior remain unchanged.
