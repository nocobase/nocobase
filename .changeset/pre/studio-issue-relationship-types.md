---
'@nocobase/studio': patch
'@nocobase/app-plugin-projects': patch
---

Let issue details add "Related" links as well as prerequisites, and let editors change an existing relationship's type, so linking related work no longer holds the issue.

Group relationship conversion and removal in one row menu, and translate stale relationship conflicts in English and Chinese.

Convert relationship types atomically on the server, preserving the link ID and rejecting stale changes or an existing target relationship without deleting either link.

Protect dependency graph additions with a shared database revision so concurrent conversions, new dependencies, hierarchy changes and restores cannot commit a cycle, including transactions with an older MySQL snapshot.

Protect symmetric related links against concurrent additions and conversions, and acquire the graph guard before plan rows so mixed edits cannot reverse the issue-row lock order during rehearsal, execution or undo.

Keep relationship removal under the same graph protection as conversion, so both removal endpoints use consistent relationship types and endpoints for activity and release notifications.

Wake waiting work only when a relationship conversion or removal actually clears its blockers. Editing a completed prerequisite, or deleting an already completed issue, no longer starts an agent that was intentionally left idle.

Serialize blocker status changes and deletion with relationship edits before writing issue rows, including approvals, workflow events and automatic parent completion, so concurrent releases cannot leave unblocked work idle.
