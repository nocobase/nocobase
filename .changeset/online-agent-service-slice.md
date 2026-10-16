---
"@nocobase/app-plugin-agents": minor
"@nocobase/app-plugin-projects": patch
"@nocobase/api-client": patch
---

Add the OnlineAgent server service foundation with versioned conversation configuration, complete SDK message persistence, injectable business tools, shared execution control, and first-subscription stream caching. Preserve ordinary conversation and message identifiers without persistent request deduplication. Connect the original chat HTTP resources and first-subscription events to one shared browser submission and stream controller for application and Registry chat views. Preserve uploaded attachments, per-view drafts and unknown-outcome feedback without hidden retries or Runner fallback.

Recognize no-content streaming responses by HTTP status even when a browser exposes an empty body, so completed chats read saved history without a false disconnect warning.

Resolve Scope/Provider model changes consistently through the configuration API. Let users explicitly permit a new input after an unknown send result, and preserve Registry drafts and files when the shared client refuses a submission.

Let application-provided Organize entries own their availability feedback while retaining default Runner availability hints.
