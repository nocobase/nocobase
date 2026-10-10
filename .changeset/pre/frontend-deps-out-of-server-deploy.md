---
'@nocobase/i18n': patch
'@nocobase/app-client': patch
'@nocobase/app-plugin-ai-employee': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-workflow': patch
'@nocobase/app-plugin-registry-example': patch
'@nocobase/app-plugin-routes-example': patch
'@nocobase/app-template-default': patch
---

Declare browser-only packages as devDependencies rather than dependencies, and make `react-i18next` an optional peer of `@nocobase/i18n` provided by `@nocobase/app-client`. Client code is bundled by the consuming application, so these entries did nothing for the bundle while `dist/package.json` pulled every one of them into the server deployment to be installed and never required.
