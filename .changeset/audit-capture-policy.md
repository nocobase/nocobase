---
"@nocobase/audit": minor
"@nocobase/app-plugin-authentication": patch
"@nocobase/app-plugin-users": patch
"@nocobase/app-skills": patch
---

Configure audit body capture and additional redaction in application YAML. Body capture defaults to off, and target resolution can use any available context without reading disabled bodies. Application and route redaction use `{ fields, paths }`.
