---
'@nocobase/app-cli': patch
'@nocobase/db-testkit': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Declare the workspace packages the tests read as devDependencies instead of reaching into their directories, and add a test to each application template that checks `config.example.yml` still has what `nocobase config init` relies on.
