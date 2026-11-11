---
'@nocobase/app-client': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Let child page, dialog and drawer routes declare their presentation so the application opens that container before the page module, its authorization check and its data arrive, keeps waits, denials and a module-only retry inside it, and leaves undeclared routes and route component overrides on their own containers.
