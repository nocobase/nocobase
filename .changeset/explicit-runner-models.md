---
"@nocobase/app-plugin-agents": patch
"@nocobase/agent-runner": patch
"@nocobase/agent-protocol": patch
"@nocobase/studio": patch
---

Require explicit models for every saved runner entry and reject missing or unavailable models before tool execution, including session resume. Legacy empty entries remain editable without inferred defaults; migration 202610210002 holds unclaimed work for configuration while preserving inputs, active attempts and history. Waiting runs are excluded from claim candidates and queue expiry, and become eligible after explicit models are saved. Expose modelPending and the translated modelNotConfigured wait reason for application run displays. Reasoning effort remains optional and reported execution facts keep their source.

Rollback is supported only while the run table is empty; populated histories require a forward migration to avoid cascading deletion of related inputs and execution records.

Give newly created Studio demo runner agents explicit models and align service-created test agents with the required configuration.
