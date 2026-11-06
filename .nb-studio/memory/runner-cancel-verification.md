---
name: Verify cancelled streams through the worker
description: Adapter-only cancellation checks miss worker event loss; use native-shaped SDK aborts and follow cancellation through stored events and reloaded history.
type: feedback
modified: 2026-10-24
---

Cancellation verification must exercise the real worker's abort, tool stop, final event consumption, event reporting and conversation history reload together. Directly collecting an adapter's events after `handle.stop()` does not verify that the worker records those events.

**Why:** Independent real Codex and Claude verification found visible partial replies missing after refresh despite earlier adapter and page checks. Those checks collected native adapter output separately and injected completed events into the page harness, bypassing the worker's abort race. The Claude fake also invented an `AbortError` name; the installed SDK exports an `AbortError` whose runtime name is `Error` and whose class name is minified. Constructor-name matching therefore passed the fake and failed the native tool.

**How to apply:** Use the SDK's exported exception type and native interruption confirmations in fixtures. Cover the pending event at cancellation, completed-block deduplication, a shared bounded stop/result/event deadline and late events after that deadline. Keep model transport fixtures distinct from real-model page acceptance. Reasoning retention remains unchanged; this correction concerns partial reply delivery, not new persistent storage.
