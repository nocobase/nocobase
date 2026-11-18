---
"@nocobase/app-server": minor
"@nocobase/app-cli-client": minor
"@nocobase/app-plugin-agents": patch
---

Derive dedicated CLI operation keys from explicitly marked OpenAPI header schemas. The CLI generates or reuses a key, preserves it in success and failure output, and reports uncertain results without replaying writes. Upgrade the CLI and server together for operation-key commands. Online shells expose authorized commands but refuse unsupported writes before sending. Ordinary headers and existing commands retain their behavior.
