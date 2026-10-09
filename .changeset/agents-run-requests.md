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
  - `reassign`: for when the subject's responsible changes. A request whose seven days already ran out is expired instead of being renewed or queued.
  - `expireDue`: run by the sweeper. A request expires after seven days and the asker gets a `run_request_expired` notice. Any path that finds a request past its expiry treats it as expired, even before the sweep.
- A request keeps the work's `fireAt` and `maxAttempts`, and confirming restores them. A `fireAt` that has already passed means the work runs now. Work with a `parentRunId` (a consultation) is never made to wait for confirmation and is refused instead.
- New routes, for people by session or unscoped API key only:
  - `GET /api/agents/runRequests`
  - `GET /api/agents/runRequests/{requestId}`
  - `POST /api/agents/runRequests/{requestId}/confirm`, `reject`, `withdraw` and `runAsMe`
  - CLI commands: `run request list|get|confirm|reject|withdraw|run-as-me`.
- New events: `runRequest.created`, `confirmed`, `rejected`, `withdrawn`, `superseded` and `expired`. The `notice` event's `notice` is now `AgentsNotice` (`RunnerNotice | RunRequestNotice`).
- Runs record `requestedByUserId` and `confirmedByUserId`. Migration `202610090002_ag_create_run_requests` creates `agRunRequests`, adds both columns to `agRuns`, and fills `requestedByUserId` of existing runs from `actorUserId`. Its number follows the already merged runner tool slots migration and reserves the preceding number for the execution identity migration.
- The sweeper's report gains `requestsExpired`.
- Work is merged or appended only into runs with the same `actorUserId`, including `mine`, `runAsMe` and confirmed requests.
- Subjects can bind `responsibleUserId(conn, subjectId)` to recheck current responsibility when confirming or rejecting. Without a resolver, applications must reassign requests when responsibility changes. A reassignment that has no usable responsible expires the request, notifies its requester and preserves execution as the requester.
- `auto` requests require the requester's own agent permission. Identical pending snapshots reuse the existing request without renewing its expiry or emitting another creation event. Run request mutation routes declare concurrent settlement errors (409).
- `@nocobase/agent-protocol` adds the error reasons `RUN_REQUEST_NOT_FOUND`, `RUN_REQUEST_SETTLED` and `NO_RUNNER_AVAILABLE`.
