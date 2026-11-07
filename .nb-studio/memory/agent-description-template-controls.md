---
name: Keep agent description templates beside the field label
description: The owner rejected rows of template buttons and nested confirmation dialogs on phones; use a compact template dropdown and one-step Undo beside the Good at label.
type: feedback
modified: 2026-10-29
---

Adding and editing runner Agents share a compact “Fill from template” dropdown to the right of the “Good at” field label. Choosing any of the six templates immediately replaces the draft. Show “Undo” beside the dropdown and restore the exact text from before the latest selection, including an empty string. A second selection replaces the single undo snapshot; undoing consumes it. Model suggestions and persistence keep their existing behavior.

**Why:** The owner found that six visible buttons occupied several rows on a phone and that a confirmation dialog nested inside the editor hid the text being edited. Immediate replacement with a local undo action keeps the input visible and lets the person recover without another overlay.

**How to apply:** Keep these controls shared between the available-models drawer and the Agent editor. Do not reintroduce a template button row or replacement confirmation. Verify both languages at desktop and phone widths, including empty input, replacement, subsequent editing and undo. This is draft-only state, with no saved undo history.
