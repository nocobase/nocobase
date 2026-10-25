---
name: Runner-agent repair preserves status
description: Handle stale runner markers in reads and a data migration; reports and duplicate adds keep their ordinary behavior
type: feedback
modified: 2026-10-24
---

Treat `source = runner` status as the agent's state even when legacy `deletedAt` or `archivedAt` markers remain. Runner reports do not repair stored rows, and adding an existing tool/model pair still returns `AGENT_EXISTS`. The repair migration clears markers and fills empty model entries without changing status.

**Why:** Changing a previously enabled row to a discovery state would lose the administrator’s choice. The discovery state and runtime cleanup have since been retired; the separate retirement migration retains referenced legacy records as disabled, with the owner-confirmed exception below. Preserving status avoids lifecycle writes and history lookups while keeping disabled agents under an administrator's control.

**How to apply:** Derive the runner model entry from the row's tool and model when reading it. Keep marker and missing-entry normalization in the one-time migration.

**Owner correction:** When retiring pending runner agents, ignore only audits with `action = 'created' AND actorUserId IS NULL`. Automatic discovery wrote these audits even without any use, so their existence alone must not prevent deletion. Do not add empty-change or first-revision restrictions. Any other audit, any run or any business reference still retains the agent and its history as disabled; the existing foreign key cascades ignored creation audits only when the agent is deleted. This replaces the earlier instruction to retain all creation audits.
