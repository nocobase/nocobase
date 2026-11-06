---
"@nocobase/app-plugin-agents": patch
---

Pin official AI SDK providers to the compatible ai/provider-utils release set to prevent independent provider patch upgrades from breaking Agents builds. The workspace also constrains Ollama's provider-utils dependency; independently installed applications must manage Ollama's transitive dependency alignment themselves.
