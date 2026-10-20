---
'@nocobase/app-server': minor
'@nocobase/app-skills': patch
'@nocobase/db': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Resolve installed official database drivers asynchronously from application configuration before provider registration or standalone database tasks. Configure only the needed dialects and install their optional peer packages in application dependencies. Preserve explicit driver registrations and synchronous core manager APIs; direct core consumers continue to register drivers explicitly. Standard development and test loaders require no synchronous ESM compatibility configuration.
