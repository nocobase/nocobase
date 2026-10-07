---
'@nocobase/app-plugin-api-keys': patch
---

Declare the `/api/apiKeys` routes in the API document, under the `ApiKeys` tag, with response schemas for keys, created keys and scope options. API documentation access and the `apiKeyAuth` security scheme are now registered by the plugin's single `ApiKeysProvider`.
