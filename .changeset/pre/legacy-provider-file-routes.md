---
'@nocobase/app-plugin-agents': patch
---

Restore legacy PDF and image routing defaults for native agent providers while preserving DeepSeek behavior and exact model overrides. Moonshot now uploads supported documents to its selected Kimi Files service by default; an exact local profile disables remote extraction. Extract Ollama PDF text locally by default and describe explicit PDF-original overrides as unavailable when its SDK would silently omit them. Preserve authorization, budgets, cancellation and user-level document replay.
