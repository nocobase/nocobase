### This is a ...
- [ ] New feature
- [ ] Improvement
- [x] Bug fix
- [ ] Others

### Motivation
When resizing a column at an edge, a row's total width could grow beyond the configured `columnCount`, causing layout overflow and inconsistent behavior. This PR prevents such overflow by clamping the resize delta.

### Description 
- Export `recalculateGridSizes` and clamp the computed delta so a row's total width never exceeds `columnCount` when expanding at edges.
- Retain existing behavior for neighbor adjustments and use `addEmptyColumnToRow` / `removeEmptyColumnFromRow` for corner cases.
- Add unit tests covering edge expansion and the case when no remaining width is available.

Potential risks: small change limited to `recalculateGridSizes` logic. Existing add/remove empty column helpers are reused; no large refactor.

Testing suggestions: run client unit tests under `packages/core/client` and specifically the new test `GridModel.recalculateGridSizes.test.ts`.

### Related issues

(leave empty if none)

### Showcase
(visual change is limited; no UI screenshot)

### Changelog

| Language   | Changelog |
| ---------- | --------- |
| 🇺🇸 English | Fix: prevent row total width overflow during column resize |
| 🇨🇳 Chinese | 在调整列宽时，防止单行总宽度溢出 |

### Docs

| Language   | Link |
| ---------- | ---- |
| 🇺🇸 English |  |
| 🇨🇳 Chinese |  |

### Checklists
- [ ] All changes have been self-tested and work as expected
- [x] Test cases are updated/provided
- [ ] Doc is updated/provided or not needed
- [x] Changelog is provided
- [ ] Request a code review if it is necessary
