---
"@nocobase/app-plugin-agents": minor
"@nocobase/studio": minor
"@nocobase/api-client": patch
---

Add the OnlineAgent server service foundation with versioned conversation configuration, complete SDK message persistence, injectable business tools, shared execution control, and first-subscription stream caching. Preserve ordinary conversation and message identifiers without persistent request deduplication. Connect the original chat HTTP resources and first-subscription events to one shared browser submission and stream controller used by Studio and Registry chat views. Preserve uploaded attachments, per-view drafts and unknown-outcome feedback without hidden retries or Runner fallback.

Recognize no-content streaming responses by HTTP status even when a browser exposes an empty body, so completed chats read saved history without a false disconnect warning.
