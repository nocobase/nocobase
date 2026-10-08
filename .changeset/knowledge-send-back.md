---
'@nocobase/app-plugin-knowledge': minor
---

Send knowledge back for changes. A decider sends a pending proposal back with a comment (`POST /api/knowledge/proposals/:proposalId/requestChanges`), and someone who may edit sends a document's current version an agent wrote back to it (`POST /api/knowledge/docs/:docId/requestChanges`). The proposal waits as `revising` and the new `proposal.changesRequested` event lets the application wake its proposer; the next proposal from the same source, or one naming it in `replacesId`, replaces it (`superseded`), its review shows the diff from what was sent back, and the version it becomes records the comment in `revision`. The proposal list gains a "Sent back" tab, the review bar a "Send back" action and a document's menu "Ask the agent to revise". Adds the migration `202610080010_kb_proposals_add_revisions`.
