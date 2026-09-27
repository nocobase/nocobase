---
'@nocobase/app-client': patch
'@nocobase/app-plugin-file': minor
---

Support FormData requests in the v3 App client without overriding the browser's multipart boundary, and preserve actionable messages from plain-text and nested error responses.

Remove the File plugin's Portal SDK dependency and v2 authentication behavior. `createFilesClient()` now requires the owning application's v3 `AppClient`, accepts endpoints relative to the application `/api` root, and relies exclusively on Cookie authentication.
