---
'@nocobase/app-plugin-api-keys': patch
---

Let a person disable and enable their own API keys (`POST /api/apiKeys/:keyId/disable` and `/enable`, `ScopedApiKeys.setEnabled`), and let an application record disabling, enabling and revoking without the secret through `ScopedApiKeys.onOwnKeyChange`.
