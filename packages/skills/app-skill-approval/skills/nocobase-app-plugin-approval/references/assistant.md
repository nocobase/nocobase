# AI suggestions

Default registration generates suggestions when approval decision tasks enter an actionable state with model and host prerequisites available. Missing prerequisites skip that event permanently; subsequent configuration only enables manual generation. Use the factories below only for custom recipes. The public entry is `@nocobase/app-plugin-approval/server/assistant`; see the [assistant guide](assistant-runtime.md) for the capability mapping, migration boundaries and complete provider registration.

1. Keep AI outside approval definitions and lifecycle hooks. Default registration owns suggestion migrations and worker registration; do not duplicate its worker. AI failures must not affect human approval.
2. Default jobs/results storage is automatic and isolated from custom recipe tables. Each custom recipe needs its own jobs/results collections and queue name; changing only the queue name does not isolate reconciliation. Keep existing legacy migration sources on upgrades. Stop old workers everywhere before migrating; retain request/result IDs, history and subscribers. Never edit a merged migration or run old `process()` workers alongside the new Queue consumer.
3. Supply the host's existing QueueService to `createSuggestionQueue`. Register its consumer with `start()` during provider boot; QueueServiceProvider owns setup and backend shutdown. Stop scheduled reconciliation and await `shutdown()` when the provider closes. Never create another QueueService or Redis/BullMQ instance.
4. The default ScheduleExecutor recovers only undelivered activation events and unpublished intents, never scans approval tasks and never backfills skipped events. Custom recipes can schedule `reconcile()` for their unpublished intents. It never retries executions; opted-in bounded expiry marks expired running results interrupted and fences late output. Queue owns concurrency, rate limits, retry delays, retry budget and backend recovery. There is no dispatch/process/sweep integration path.
5. Enqueue after business commit with stable owner-specific request IDs. Hash the complete authorized input, model/options and prompt/schema/recipe versions. Manual regeneration gets a new stable ID and requestKey; transport retries reuse both. Recheck access, task eligibility and revision in preparation and every stored-result read.
6. The default recipe uses the Agents public gateway for generation and usage accounting with one Queue execution attempt. Custom Agents integration can use the optional `./server/assistant/agents` entry. It resolves the public model and disables SDK retries so Queue remains the sole execution retry owner. Supply validation and usage recording. Reuse the public gateway; do not implement a model gateway or tool runtime. Agents Runner `jobs.register()` is not a general model-generation executor.
7. Authorize cancellation as the subscription owner. Last-subscriber cancellation retires the shared result before best-effort local abort; a remote execution may continue but cannot publish. New subscribers obtain a fresh result.

Queue ID retention is bounded, cancellation is local and Memory only persists on graceful shutdown. Use the actual Redis backend for shared production recovery and test against real database concurrency. The business reconciler is not a second execution queue and cannot repair lost acknowledged Memory jobs. No assistant tool may approve, reject or edit business records.

Use `approvalSuggestionsToken.status(taskId, authenticatedUserId)` to hide or disable the generation button with a configuration hint when prerequisites are absent. Refreshing status after configuration enables the button without enqueuing anything. Only an explicit user action calls `generate()`. The server rechecks ownership and current state; duplicate clicks reuse work and failed generation can be retried manually.

The default `read()` result is `{ report, diagnostics } | null` (the public custom-recipe result type is `Record<string, unknown> | null`). Drive the detail UI from `{ state, canGenerate, advice }`: `ready` offers Generate, `generating` disables submission, `generated` displays `advice.report`, and `failed` offers an explicit Retry. Use host Realtime invalidation and reconnect reconciliation as the example does; propagate read failures into its retry mechanism and provide a read-only refresh. Hide generation for `not_found` / `not_actionable`; show a localized prerequisite hint for `model_unconfigured` / `services_unavailable`. Refresh after manual generation, human approval actions and reassignment. A null `read()` result alone cannot distinguish these states. The application owns authenticated detail/status handlers and an authorized mutation handler for Generate/Retry; derive the user ID from the server session, never from the request body, and apply the application's approval-detail access policy before calling the service. Opening or refreshing the page must never call `generate()`.

Activation delivery runs independently at startup and every two minutes, so automatic suggestions need not start immediately after the approval action. Only committed pending intents are delivered; no approval-task scan or replay of skipped activations runs.

## Structured default reports

The default recipe stores validated `report` objects rather than raw provider prose: findings with stable check IDs, verdicts, explanations and verified references, server-owned coverage, model and generation time. Definitive conformity judgments require both cited field facts and a supplied knowledge rule with an exact nonempty quotation; otherwise the validator downgrades them to verification required. Evidence provenance is not proof of semantic entailment; human review remains required. Invented references or nonmatching quotations fail generation. Render this shape with the standard UI Library `@nocobase/approval-review` block by default. See [Registry integration](review-ui.md) for installation, ownership, state mapping and adapter boundaries.

`approvalSuggestionsToken.status(taskId, assigneeId, principalId?)` also returns generation count, authorized successful versions, the current generation ID and cancellation/regeneration capabilities. Manual `generate(taskId, assigneeId, {principalId, requestKey, previousId})` uses the displayed generation identity and a stable operation key; preserve both on transport retry. Deliberate regeneration requires the current ID. `cancel(taskId, assigneeId, generationId, principalId?)` cancels only the current generation. Default service callers without those options retain the original one-result generation behavior.

An optional `approvalSuggestionMaterialsToken` supplies `load(principalId, content, source)` and `validate(principalId, materials, source?)`. The host owns real-reader authorization and returns bounded material text, references, titles and versions. Execution, publication and saved-report reads revalidate them. Synthetic demo personas never authorize knowledge reads; The default automatic flow in this version supports frozen fields only: it never calls material load(), has no public reader-mapping extension, and marks knowledge unavailable. Knowledge is supported only by manual generate() with principalId; use a custom recipe if automatic authorized knowledge retrieval is required. No extra generation worker or task-discovery scan is needed.

Register `defineApprovalSuggestionsConfig` from `@nocobase/app-plugin-approval/config` as `approvalSuggestions` in the host configuration aggregator to override the default 12000 output tokens, 120-second timeout and 8 findings. Its environment mappings are `APPROVAL_SUGGESTIONS_MAX_OUTPUT_TOKENS`, `APPROVAL_SUGGESTIONS_TIMEOUT_SECONDS` and `APPROVAL_SUGGESTIONS_MAX_FINDINGS`. Attempt history includes safe completion/validation diagnostics and execution times; no raw output is exposed. Default-recipe expired executions become `interrupted` during startup/two-minute reconciliation and require explicit retry; the sweep never calls the model. Custom recipes opt into the queue `recovery` policy explicitly. See [runtime and custom recipes](assistant-runtime.md) for shutdown, legacy deadlines and queue ownership.

The built-in report’s optional `nextStep` is the model-generated recommendation stored with each version; new generations require it, while older reports can omit it. Show it as plain text with the selected report, without a next-step label. New generations use the assignee’s saved `locale` preference, falling back to the application default language; this applies to the recommendation and finding titles/summaries, while evidence quotes remain unchanged. Changing the locale changes the generation fingerprint. Missing materials can coexist with a reasoned recommendation; do not replace it with a verdict-based template or execute it as an approval action.

## Material composition and invalidation

Only the host registers `approvalSuggestionMaterialsToken`. Use `composeApprovalSuggestionMaterials({ approvalSource: adapter, otherSource: otherAdapter })` to dispatch loading and validation by the persisted source. Unknown sources load no knowledge; nonempty materials without a recognized persisted source fail validation. Example exports its own adapter token and source list and never registers the global token. Existing reports without a persisted source become unavailable with this composer and require manual regeneration.

Use `subscribeApprovalSuggestionChanges(databaseManager, async ({ taskId }) => { ... })` during host boot and call its returned disposer at shutdown. It emits task-specific, committed default-recipe invalidations, without report content. The host defines a Realtime topic family, authorizes each subscription and delivery using its detail-access policy, and publishes only to that task's topic. The Example provider is a complete bridge for its explicitly shared authenticated demo access policy; production must replace that authorization with its business policy. The client subscribes to the task topic with `useRealtimeRefresh` and reloads on readiness/reconnect. Notifications are best effort, not a durable event log; reads and reconnect reconciliation remain authoritative. Never inspect default jobs/results collections from a host.

Clear previously displayed reports when status cannot be revalidated. For administrators, distinguish missing model configuration from unavailable server services and offer a read-only Refresh action after setup; ordinary users need not see configuration details. Mark bounded documents with `truncated` and the actual UTF-16 `range` (inclusive start, exclusive end, full total). Include these in prompts and coverage; partial rules cannot establish a definitive conformity verdict.

## Optional Example material adapter

Use this wiring only when the host explicitly includes Approval Example. It is an integration reference; production business adapters remain application-owned.

Register this singleton once in the host Provider's `register()`. The factory resolves the Example adapter after all plugin registrations; plugin ordering does not select or replace the host's business provider. If a business source collides with an Example name, reject the collision in host configuration instead of relying on object spread ordering.

```ts
import {
  approvalSuggestionMaterialsToken,
  composeApprovalSuggestionMaterials,
} from '@nocobase/app-plugin-approval/server/assistant';
import {
  approvalExampleMaterialsToken,
  approvalExampleSources,
} from '@nocobase/app-plugin-approval-example/server';

this.app.container.singleton(approvalSuggestionMaterialsToken, (resolver) => {
  const example = resolver.resolve(approvalExampleMaterialsToken);
  return composeApprovalSuggestionMaterials({
    ...Object.fromEntries(
      approvalExampleSources.map((source) => [source, example]),
    ),
    // Add distinct host-owned source names and adapters here.
  });
});
```

Without this host registration the Example intentionally loads no knowledge. Existing global host adapters remain untouched. Documents longer than 8000 UTF-16 code units are explicitly marked partially read with their supplied range; the model receives that boundary and definitive policy verdicts based on a partial rule are downgraded to verification required.
