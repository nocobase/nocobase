---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

`AGENTS.md` states that a child page of its own, such as a record's page or a form too long for a dialog, returns `RouteChildPage` around its `PageContainer`. Only tab content renders inline: a child route that returns a bare `PageContainer` renders at the parent's `Outlet`, below the parent's content, instead of covering it.
