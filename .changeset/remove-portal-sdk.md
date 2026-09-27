---
'@nocobase/dev-config': minor
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-file': patch
---

`@nocobase/app-portal-sdk` is removed; nothing in an application depends on it any more. The presets named after it are renamed: `@nocobase/dev-config/vite/portal` and `createPortalViteConfig` are `@nocobase/dev-config/vite/app` and `createAppViteConfig`, and `createPortalConfig` is `createApplicationConfig`. The application ESLint preset now reports any `import.meta.env` read other than `PROD`, `DEV` and `MODE`, since browser code takes runtime values from the client configuration. The i18n and file plugin Skills no longer refer to the Portal SDK.
