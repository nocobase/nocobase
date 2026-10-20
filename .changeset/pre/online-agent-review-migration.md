---
"@nocobase/app-plugin-agents": major
"@nocobase/app-template-examples": patch
---

Remove the old conversation start, fallback and restore HTTP operations and the conversation fallback/restore CLI commands without aliases. Replace start with POST /api/agents/conversations followed by POST /api/agents/conversations/:id/messages, or conversation create followed by conversation message send. These are two non-atomic requests and may leave an empty conversation if sending fails. Fallback and restore have no same-session replacement: explicitly create a new conversation with the desired executor/agent, without automatically copying history or changing an existing binding. Trusted domain start/fallback/restore methods remain available.

Historical unbound conversations remain read-only, with owner-authorized cancellation of unfinished old runs. Browser callers must use the narrow configuration input: move tool lists, model lists and system-prompt policy into trusted server configuration, and declare business variables through selected-scope schemas. Existing thinking handling remains unchanged. Apply the visibility migration before serving requests; existing ordinary records default to visible and new background sessions are hidden, with known-session authorization preserved.

Background run still acknowledges admission. Use get to wait for validated, saved and finalized results, or try with a finite observation budget; observation timeout does not cancel execution. Deliver can return null after saving a notice in the caller's transaction without waking a new-bound conversation. Remove proposed-plan quantity hints from consultation cards while retaining historical data and plan mechanisms, and consolidate the framework and application upgrade documentation.
