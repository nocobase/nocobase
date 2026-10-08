---
'@nocobase/app-plugin-agents': minor
'@nocobase/agent-protocol': minor
---

Add run requests to the agents plugin: when someone other than the person who answers for a subject wakes an agent on it, the work waits for that person to confirm it, or runs on the asker's own account.

- `runs.enqueue` takes `responsibleUserId`, `requestedByUserId` (the source of the chain of work), `causedByRunId` (work a run caused keeps that run's source) and `execution: 'auto' | 'mine'`. When the source is the responsible, or no responsible is given, work is queued as before. When the source is someone else, `auto` stores a run request instead of queueing anything. `mine` queues the work at once as the source, on their own runner or a team runner, and is refused with `NO_RUNNER_AVAILABLE` when none is online.
- Breaking for callers that read the result: `EnqueueResult` is now `RunEnqueued | RunRequestPending`, and `outcome` gains `'pending'`. A pending result has a `requestId` and has `runId` and `inputId` set to `null`. Check `outcome` before using `runId`. Work that names no responsible is never pending.
- `actorUserId` is optional on `EnqueueRequest` when a `responsibleUserId` is given.
- New `runs.requests` service:
  - `confirm` and `reject`: only by the responsible. Confirming queues the work as the responsible with the input as it was asked, and its actor is the asker.
  - `withdraw` and `runAsRequester`: only by the asker.
  - `list`, `get` and `pendingOn` read requests.
  - `reassign`: for when the subject's responsible changes.
  - `expireDue`: run by the sweeper. A request expires after seven days and the asker gets a `run_request_expired` notice.
- New routes, for people by session or unscoped API key only:
  - `GET /api/agents/runRequests`
  - `GET /api/agents/runRequests/{requestId}`
  - `POST /api/agents/runRequests/{requestId}/confirm`, `reject`, `withdraw` and `runAsMe`
  - CLI commands: `run request list|get|confirm|reject|withdraw|run-as-me`.
- New events: `runRequest.created`, `confirmed`, `rejected`, `withdrawn`, `superseded` and `expired`. The `notice` event's `notice` is now `AgentsNotice` (`RunnerNotice | RunRequestNotice`).
- Runs record `requestedByUserId` and `confirmedByUserId`. Migration `202610080001_ag_create_run_requests` creates `agRunRequests`, adds both columns to `agRuns`, and fills `requestedByUserId` of existing runs from `actorUserId`.
- The sweeper's report gains `requestsExpired`.
- `@nocobase/agent-protocol` adds the error reasons `RUN_REQUEST_NOT_FOUND`, `RUN_REQUEST_SETTLED` and `NO_RUNNER_AVAILABLE`.
