---
name: Runner-agent repair preserves status
description: Handle stale runner markers in reads and a data migration; reports and duplicate adds keep their ordinary behavior
type: feedback
modified: 2026-10-23
---

Treat `source = runner` status as the agent's state even when legacy `deletedAt` or `archivedAt` markers remain. Runner reports do not repair stored rows, and adding an existing tool/model pair still returns `AGENT_EXISTS`. The repair migration clears markers and fills empty model entries without changing status.

**Why:** Changing a previously enabled row to pending can expose it to PM-541 cleanup. Preserving status avoids lifecycle writes and history lookups while keeping disabled agents under an administrator's control.

**How to apply:** Derive the runner model entry from the row's tool and model when reading it. Keep marker and missing-entry normalization in the one-time migration.
