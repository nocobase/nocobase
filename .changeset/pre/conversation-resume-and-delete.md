---
'@nocobase/app-plugin-agents': minor
'@nocobase/agent-runner': patch
'@nocobase/agent-protocol': minor
---

A conversation no longer loses its context when its kept tool session cannot be resumed. When the brief changed since the session was kept, the claim starts a new session with the conversation's recent history, as a first one gets; when it resumes, the payload carries `prompt.recoveryContext` (that history), which the runner gives a new session should the kept one be gone on its machine. A subject's per-turn rules can now change without ending the kept session (`ConversationRuleLines.turn`).

`DELETE /api/agents/conversations/{conversationId}` (`conversation delete`) deletes the owner's conversation for good: its open runs are cancelled, its messages, files (and their stored bytes), links and kept sessions are deleted, its inbox notices are settled, and runners remove its working directories and session files on their next workspace report. Conversations archived longer than `agents.conversations.archivedRetentionDays` (30 by default, 0 keeps them) are deleted the same way by a daily cleanup.
