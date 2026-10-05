# Invocation and Service API

## Contents

- [Choose the correct entry](#choose-the-correct-entry)
- [Find a workflow to trigger](#find-a-workflow-to-trigger)
- [Internal service access](#internal-service-access)
- [Service method map](#service-method-map)
- [Authenticated management HTTP API](#authenticated-management-http-api)
  - [Inspect workflows in a deployed application](#inspect-workflows-in-a-deployed-application)
  - [Inspect runs in a deployed application](#inspect-runs-in-a-deployed-application)
- [Invocation verification](#invocation-verification)
- [Implementation references](#implementation-references)

## Choose the correct entry

| Intent                                                  | Contract                                        | Identifier                | Result                                                           |
| ------------------------------------------------------- | ----------------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| Business/domain event starts a workflow                 | `workflowRuntime.trigger(key, input, options?)` | workflow key              | `accepted`/`skipped` receipt; accepted execution is asynchronous |
| Authorized administrator manually executes a definition | authenticated management HTTP API               | definition id             | persisted run list item                                          |
| Manage/inspect workflows and runs                       | authenticated management HTTP API               | mostly definition/run ids | typed view/list/detail                                           |
| Browser/admin client                                    | authenticated `/api` routes                     | definition/run ids        | `{ data }` or paged response                                     |

There is intentionally no generic public `POST /workflows/:key/trigger`. A cron, webhook, route, or domain module authenticates and validates its own event, constructs the declared input, then calls the internal service.

## Find a workflow to trigger

When source is available, discover a workflow for new business-trigger code from the DSL package list, not from database ids or management titles. In the configured Workflow source root, each direct child directory is one workflow package; the directory name is the stable `workflowKey`, and `workflow.ts` contains its input schema and node definition. In the default application this is `workflows/<key>`. Enumerate these directories (for example with `rg --files workflows`) and read each `workflow.ts` top-level `title` and optional `description`. If the request names an exact key, locate that directory directly. Otherwise compare the business requirement with those human-facing fields and select the best matching workflow; inspect its nodes when title and description are not enough to distinguish candidates. If multiple candidates remain materially plausible, present their key/title/description and ask which one to use. After selection, the chosen directory name—not its title or description—is the key passed to `workflowRuntime.trigger()`.

The trigger input must be a JSON object that conforms to the definition's `input.schema` (or its `inputSchema` shorthand). Use `title` and `description` to select a workflow, but use the invocation schema as the contract for constructing its input; database records and administrator parameters are not substitutes.

This discovery works while offline and does not require a running application,
database, or management API. The runtime remains the authority at execution
time, so a missing package/deployment can still produce a `not-found` receipt.

Do not use `enabled`, `current`, database ids, or management API results to
invent a business trigger contract. Titles and descriptions are discovery
metadata; the final trigger identifier is always the selected DSL directory
key. In a deployed environment where source is unavailable, the authenticated
management API remains appropriate for inspection and manual operations, but
it is not a substitute for the source contract when writing new trigger code.

## Internal service access

The public server entry exports `workflowServiceToken`. The Workflow
ServiceProvider registers the service in the application's container. Its
public contract exposes `registerInstruction()` for application extensions and
`trigger()` for business invocation; management routes use additional
package-internal methods. Do not bind services to `AppRuntime` or add a mutable
plugin-services object.

An installed server plugin may contribute an Instruction class through the
public service:

```ts
const workflow = app.container.resolve(workflowServiceToken);
workflow.registerInstruction(CustomInstruction);
```

Registration rejects an existing instruction type. The Artifact build process
must register the same Instruction contract before building a DSL that uses it.

Business invocation:

```ts
import { workflowServiceToken } from '@nocobase/app-plugin-workflow/server';

if (!app.container.has(workflowServiceToken)) {
  throw new Error('Workflow service is not configured.');
}
const workflowRuntime = app.container.resolve(workflowServiceToken);
const receipt = await workflowRuntime.trigger(
  'quotation-decision',
  { quotationId: 'Q-100', amount: 150000 },
  { eventKey: 'quotation-submitted:Q-100' },
);
if (receipt.status === 'skipped') {
  return receipt; // caller handles the runtime result; do not poll for a run
}
const { eventKey, runId } = receipt;
```

`workflowRuntime.trigger(key, input, options?)`:

- Resolves the workflow by stable key at runtime.
- May return a `skipped` receipt. It has no `eventKey` and creates no run to poll; handle the receipt after calling rather than pre-filtering DSL keys through runtime management state.
- Requires a JSON object and validates it against the invocation schema declared by the selected DSL package's `workflow.ts` (`input.schema`, or the `inputSchema` shorthand). Read and obey that schema before writing the trigger call; `input` is not the workflow's administrator `parameters` object.
- Rejects input over 65,536 UTF-8 bytes.
- Resolves administrator defaults/overrides into an immutable run input snapshot.
- Accepts optional `eventKey` and `parentRunId`; parent linkage is used for nested calls and stack-limit checks.
- Creates the Workflow Run and enqueues work before returning `{ status: 'accepted', eventKey, runId }` in the ordinary path; execution continues asynchronously. `runId` is the stable execution reference for status queries and integrations such as Scheduler.
- Uses event key for invocation deduplication. Reusing it must represent the same business event. If a run already exists, another trigger with that key does not execute it again; reuse is appropriate when the caller does not know whether the original submission was accepted, not as a rerun mechanism for a confirmed failure.

For a workflow that exists and is enabled, `trigger()` can still throw `INVALID_INPUT`, `INPUT_TOO_LARGE`, `PARENT_RUN_NOT_FOUND`, or `STACK_LIMIT_EXCEEDED` before it returns an accepted receipt.

The management run endpoint resolves the exact materialized database definition/version identified by `definitionId`. It does not require that revision to be `current` or `enabled`, so an operator with workflow management permission can run a historical revision. The Run is marked manual and preserves that definition's version, hash, Input Schema, and input snapshot. The optional event key uses the same idempotency mechanism as `trigger()`; the server generates one when it is omitted. The current DSL has no top-level trigger-source field.

## Management operation map

These names describe the repository behavior behind the authenticated routes;
they are not additional package-root service exports.

| Method                               | Purpose                                                                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `list()`                             | Current definitions with their actual enabled/version/hash state; a newer deployed Artifact is reported separately as `pendingArtifact` |
| `getWorkflow(id)`                    | One definition and its materialized nodes/input/input settings; a current definition may include `pendingArtifact`                      |
| `revisions(id)`                      | All revisions sharing the selected definition's key, newest first, including a deployed Artifact that has no row yet (null id/version)  |
| `enable(idOrArtifactHash)`           | Enable a synchronized definition by id or publish/enable an unsynchronized Artifact by hash                                             |
| `disable(id)`                        | Disable the current definition                                                                                                          |
| `setStatus(id, enabled)`             | Change enabled state on a current definition                                                                                            |
| `getParameters(id)`                  | Read administrator input schema and explicit override values                                                                            |
| `updateParameters(id, values)`       | Replace validated override values on a current definition                                                                               |
| `runs(options?)`                     | Paged runs across workflows; default page size is 20                                                                                    |
| `runsForWorkflow(id)`                | Latest 50 runs for the selected definition's workflow key                                                                               |
| `getRun(id)`                         | Run input, version identity, timing/reason, and latest attempt per node key                                                             |
| `nodeRuns(id, nodeKey?)`             | All node attempts, optionally filtered by node key                                                                                      |
| `nodeRunPayload(runId, nodeRunId)`   | Redacted/truncated result, error, and log for one attempt                                                                               |
| `run(definitionId, input, options?)` | Authorized manual execution of the selected revision; accepts the common `eventKey` option                                              |

Input override updates accept only declared scalar values with exact types and enum membership. The stored map contains explicit overrides, not resolved defaults. Read back after changing it.

### Enable by synchronized id or Artifact hash

Read before writing. A synchronized item has a database `id`; an unsynchronized
Artifact has no id and is identified by its deployed `hash`.

- Read an unsynchronized Artifact with `getWorkflow(hash)` or `GET /api/workflows/<hash>`, and find its hash in `pendingArtifact` or in `revisions(id)`. Reading it materializes nothing, so a candidate revision can be inspected without being enabled.
- For an unsynchronized Artifact, call `enable(hash)` or `POST /api/workflows/<hash>/enable`.
- For a synchronized workflow, call `enable(id)` or `POST /api/workflows/<id>/enable`.
- Enabling a revision atomically makes it the current revision and enables it; the previous current revision is no longer current or enabled.
- After enable, read back id/key, `enabled`, `current`, version, and hash before configuring parameters or running it.

## Authenticated management HTTP API

All current routes are below `/api` and require authentication plus the `manage` action on `{ type: "settings", id: "workflow" }`. This single permission covers definitions, parameters, enable/disable, manual execution, runs and node results. The management pages use the same permission. In Settings → Authorization → Permission sets, grant Automation → Workflow → Manage and assign that permission set to the intended users. The root permission set already has unrestricted access; ordinary users are denied with HTTP 403 unless granted management access. Existing `read` grants do not confer management access and must be replaced deliberately by an administrator. Internal service calls and scheduled triggers retain their own business authorization boundaries. Per-workflow/per-action grants and audit hooks are not provided.

Every route below is described in the application's OpenAPI document under the `Workflow` tag, with its parameters, response schemas and error statuses: browse it at `/api/swagger/docs`, or fetch the JSON at `/api/swagger` (both need a signed-in session or an API key). Operation ids start with `workflows`, such as `workflowsRunWorkflow`. Prefer the document over this table when they disagree, because it is generated from the routes themselves.

| Method and path                                            | Purpose/body                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `GET /workflows`                                           | filters `q`, `enabled`; paged with `page`, `pageSize`                                       |
| `GET /workflows/sources/{key}`                             | latest discovered source for a stable workflow key, without materializing it                |
| `GET /workflows/sources/{key}/revisions`                   | revisions for the discovered source key; paged                                              |
| `GET /workflows/{workflowId}`                              | definition detail; the id may be an unsynchronized Artifact hash                            |
| `GET /workflows/{workflowId}/revisions`                    | revision list; paged                                                                        |
| `POST /workflows/{workflowId}/enable`                      | id is a synchronized definition id or an unsynchronized Artifact hash                       |
| `POST /workflows/{workflowId}/disable`                     | disable the current revision; synchronized id only                                          |
| `GET /workflows/{workflowId}/parameters`                   | input settings                                                                              |
| `PUT /workflows/{workflowId}/parameters`                   | `{ "parameterValues": { ... } }`, replacing the override map                                |
| `POST /workflows/{workflowId}/run`                         | `{ "input": { ... } }`; optional `Event-Key` header; id is the selected definition revision |
| `GET /workflows/runs`                                      | filters `workflowId`, `workflowKey`, `workflowTitle`, `status` (a code or `null`); paged    |
| `GET /workflows/runs/{runId}`                              | run detail                                                                                  |
| `GET /workflows/runs/{runId}/nodeRuns`                     | node attempts; optional `nodeKey` query; paged                                              |
| `GET /workflows/runs/{runId}/nodeRuns/{nodeRunId}/payload` | node result/error/log                                                                       |

A workflow id is a positive integer or a 64-character hexadecimal Artifact hash, so it never collides with the fixed segments `runs` and `sources`. Every list answers `{ data, meta: { page, pageSize, total } }` with `pageSize` up to 100; everything else answers `{ data }`. Request bodies are strict: an unknown field is rejected with `400 INVALID_INPUT`.

Failures use the standard `/api` error body; branch on `error.reason`, never on `message`. Reasons in the `workflows` domain: `WORKFLOW_MANAGEMENT_REQUIRED` (403), `WORKFLOW_SERVICE_NOT_CONFIGURED` (503), `WORKFLOW_NOT_FOUND`, `WORKFLOW_SOURCE_NOT_FOUND`, `WORKFLOW_RUN_NOT_FOUND` and `NODE_RUN_NOT_FOUND` (404 for the resource the path names), `INVALID_WORKFLOW_ID` and `INVALID_PARAMETER_VALUES` (400), and the invocation reasons `INVALID_INPUT` (400, with a field violation per invalid input path), `INPUT_TOO_LARGE` (413), `WORKFLOW_DISABLED`, `PARENT_RUN_NOT_FOUND` and `STACK_LIMIT_EXCEEDED` (400 `FAILED_PRECONDITION`). A malformed path, query, header or body fails earlier with reason `INVALID_INPUT` in the `app` domain. Translated text, when the request has a language, is in `error.localizedMessage`.

The run endpoint maps the `Event-Key` header to `{ eventKey }`; it must not accept arbitrary runtime options from the request body. Do not allow clients to inject `parentRunId` or bypass authorization through arbitrary bodies.

### Inspect workflows in a deployed application

Use an authenticated management account to list definitions and select the returned database definition id. `q` searches the list and `enabled=true|false` filters it; omit either filter when it is not needed. Then inspect that definition's detail, revisions, administrator parameters, and latest runs for its workflow key. All requests below are read-only:

```bash
curl --fail-with-body -G \
  -H 'Authorization: Bearer <session-token>' \
  --data-urlencode 'q=<search-text>' \
  --data-urlencode 'page=1' \
  --data-urlencode 'pageSize=20' \
  https://app.example/api/workflows

curl --fail-with-body \
  -H 'Authorization: Bearer <session-token>' \
  https://app.example/api/workflows/<definition-id>

curl --fail-with-body \
  -H 'Authorization: Bearer <session-token>' \
  https://app.example/api/workflows/<definition-id>/revisions

curl --fail-with-body \
  -H 'Authorization: Bearer <session-token>' \
  https://app.example/api/workflows/<definition-id>/parameters

curl --fail-with-body -G \
  -H 'Authorization: Bearer <session-token>' \
  --data-urlencode 'workflowId=<definition-id>' \
  --data-urlencode 'pageSize=50' \
  https://app.example/api/workflows/runs
```

The lists, revisions and runs return `{ data, meta: { page, pageSize, total } }`; detail and parameters return `{ data }`. A source preview can be fetched by stable key at `GET /api/workflows/sources/<workflow-key>`, with `/revisions` appended for its revision list, even before that source has a materialized id. An unsynchronized Artifact can also be read by its hash through `GET /api/workflows/<artifact-hash>`. Distinguish key, materialized id, and Artifact hash before using an endpoint that changes state.

### Inspect runs in a deployed application

To inspect execution records in a deployed application, use a management account with Workflow Manage permission. First list runs by the stable workflow key; then use a returned run id to inspect the run, every node attempt, and only the relevant attempt's payload. These are read-only requests:

```bash
curl --fail-with-body -G \
  -H 'Authorization: Bearer <session-token>' \
  --data-urlencode 'workflowKey=<workflow-key>' \
  --data-urlencode 'page=1' \
  --data-urlencode 'pageSize=20' \
  https://app.example/api/workflows/runs

curl --fail-with-body \
  -H 'Authorization: Bearer <session-token>' \
  https://app.example/api/workflows/runs/<run-id>

curl --fail-with-body \
  -H 'Authorization: Bearer <session-token>' \
  https://app.example/api/workflows/runs/<run-id>/nodeRuns

curl --fail-with-body \
  -H 'Authorization: Bearer <session-token>' \
  https://app.example/api/workflows/runs/<run-id>/nodeRuns/<node-run-id>/payload
```

The run and node-run lists are paged; run detail and payload return `{ data }`. `workflowId=<definition-id or artifact-hash>` on the run list is an alternative to `workflowKey` when a definition id is already known, and lists the runs of every revision of its workflow key. Use `nodeKey` on the node-runs request to narrow attempts; inspect attempt ids and timestamps rather than assuming the first attempt is current. Payloads may be redacted or truncated. Keep session tokens out of tracked files and shared diagnostic reports.

Example authenticated management calls (replace the base URL, credentials, ids, and last-read digest):

```bash
curl --fail-with-body -X POST \
  -H 'Authorization: Bearer <session-token>' \
  https://app.example/api/workflows/<artifact-hash>/enable

curl --fail-with-body \
  -H 'Authorization: Bearer <session-token>' \
  -H 'Content-Type: application/json' \
  -H 'Event-Key: operator-request-42' \
  -d '{"input":{"quotationId":"Q-100","amount":150000}}' \
  https://app.example/api/workflows/<definition-id>/run

curl --fail-with-body \
  -H 'Authorization: Bearer <session-token>' \
  https://app.example/api/workflows/runs/<run-id>
```

An unsynchronized Artifact is addressed by its hash; after enable, use the persisted definition id returned/read back by the API. These are management routes only; business modules resolve `workflowServiceToken` from the Application container, call its `trigger()` method, and handle the `accepted`/`skipped` receipt.

## Invocation verification

1. Enumerate the configured Workflow DSL source root. Use an explicit key when supplied; otherwise match the business requirement against each `workflow.ts` title and description, inspect nodes to resolve close candidates, and ask when ambiguity remains. Use the selected directory name as the key; do not query the API or database for discovery.
2. Validate the exact input locally against the declared schema, including extra fields and byte size.
3. Choose a stable event key for the source event. Reuse it only to resubmit an invocation whose acceptance is unknown; inspect an existing failed run before choosing a separately authorized recovery action.
4. Resolve `workflowServiceToken` from `app.container`, fail explicitly if the token is not registered, then call `workflowRuntime.trigger(key, input, options)` for business logic. Use the authenticated management routes only for explicit inspection or manual management.
5. Discriminate the receipt. For `skipped`, record the reason and stop; there is no event key or run. For `accepted`, retain both its event key and stable run ID.
6. Verify the run's workflow id/key, version, hash, input, event key, status, and timestamps.
7. Verify side-effecting run scripts by their business idempotency evidence, not merely a resolved workflow status.

The current public service and management routes do not expose node rerun or failed-run replay. Do not promise recovery by sending the same event key again. After a confirmed failure, distinguish a deliberately new business invocation or manual execution from compensation of effects already completed.

## Installed implementation discovery

Resolve `@nocobase/app-plugin-workflow/server` through the project's package manager and inspect its installed declarations when verifying the runtime and route exports. Keep application calls on public package exports rather than importing plugin-internal file paths.

For extension criteria, the public API, and a complete checker/build/Provider example, read [Custom Instructions](custom-instructions.md).

Manual management execution returns the persisted run (including its ID) before waiting for node completion. Navigate to that run immediately; acceptance does not imply success. The runtime tracks background manual execution and drains it on shutdown.
