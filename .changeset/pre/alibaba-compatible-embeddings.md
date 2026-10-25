---
"@nocobase/app-plugin-agents": patch
"@nocobase/app-plugin-knowledge": patch
---

Use the OpenAI-compatible SDK for Alibaba Qwen embeddings while preserving its existing chat SDK, service base URL, credentials, and dimension selection. Version Alibaba Knowledge embedding identities so generations created with the former native transport require an explicit rebuild instead of silently reusing vectors across the protocol change.
