---
'@nocobase/app-plugin-agents': minor
'@nocobase/agent-runner': minor
'@nocobase/agent-protocol': minor
---

A message sent while a runner conversation's agent works is no longer refused as busy: `POST /api/agents/conversations/{conversationId}/queue` (`conversation message queue`) joins it to the run at work, which the runner steers into the running turn when its tool can and takes as the next turn otherwise, and `POST /api/agents/conversations/{conversationId}/messages/{messageId}/withdraw` takes it back while its runner has not taken it. A queued message carries `metadata.queue` (`queued`, `withdrawn` or `unanswered`), and the answer to it is its own response. The agent's todo list shows as a `data-plan` part, from Codex's `turn/plan/updated` and ACP plan updates; conversation usage adds `costUsd` from the cost Claude Code, Pi and OpenCode report. A live runner response opens at once and says where it stands before its first output (`data-phase`: `waiting`, `starting`, `thinking`).

Runs respond faster. Claude Code starts with `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` unless the runner is started with `NOCOBASE_RUNNER_CLAUDE_NONESSENTIAL_TRAFFIC=1` or the run sets the variable itself. The events answer carries input that arrived for the run (`EventsResponse.inputs`, absent from older servers), so it reaches the agent with the next events rather than the next status poll, and tool steps, input, status, usage and error events are sent as they happen instead of at the next spool interval.
