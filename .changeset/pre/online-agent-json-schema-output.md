---
'@nocobase/app-plugin-agents': minor
---

Require a plain JSON Schema in OnlineAgent background `run()` calls instead of Zod. Pass the schema to the AI SDK for structured generation and validate the generated result before persistence. Reject invalid, remote-reference and oversized schemas before accepting execution.
