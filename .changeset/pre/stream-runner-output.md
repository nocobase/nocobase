---
"@nocobase/agent-runner": patch
"@nocobase/agent-protocol": patch
"@nocobase/app-plugin-agents": patch
---

Stream coding-tool conversation replies and supplied reasoning summaries through a bounded, redacted realtime preview channel. Automatically negotiate capable conversation runners, persist one completed snapshot per block, and preserve task execution, public log redaction and prompt history. Preserve token boundaries across chunks and verify that live text and reasoning match their completed snapshots. Preserve complete redaction context when choosing preview boundaries so token-like prose and punctuation remain consistent with completed snapshots.

Upgrade the application before its runners: protocol 14 announces the outputBlocks feature, while the upgraded application continues serving older runners. Retain ACP partial answers on length limits, refusals and cancellation, safely redact values adjacent to private keys, reconcile divergent previews through normal history refresh, skip empty assistant messages, and suppress unused Codex delta notifications for tasks.

Render every logical assistant response as one bubble with ordered text and reasoning, preserving identity across live previews, cancellation and paginated history.
