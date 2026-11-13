---
"@nocobase/app-server": minor
"@nocobase/app-cli-client": minor
"@nocobase/app-plugin-agents": patch
---

Derive dedicated CLI operation keys from explicitly marked OpenAPI header schemas. Capable clients generate or reuse a key, preserve it in success and failure output, and report uncertain results without replaying writes. Capability negotiation and separate caches keep these commands away from older clients and unsupported online shells. Ordinary headers and existing commands retain their behavior.
