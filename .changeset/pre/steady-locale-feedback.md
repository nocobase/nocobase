---
'@nocobase/i18n': patch
'@nocobase/app-client': patch
'@nocobase/app-server': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Resolve application namespace aliases in React translations, synchronize the document language at startup and on changes, and inject the configured default language into served HTML. Allow client-only language selections with an English server fallback and an informational toast, and standardize documented locale checks on `pnpm nocobase app i18n:check`.
