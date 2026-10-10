---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/create-app': patch
'@nocobase/app-client': patch
---

Replace the last references to command names the application command line no longer has. The Bubble reference page in each template now shows `pnpm nocobase db apply` instead of `pnpm migrate`, and comments in `@nocobase/create-app` and `@nocobase/app-client` no longer name the removed `client:inspect`.
