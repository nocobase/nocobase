# Approval suggestions

Default Approval server registration installs suggestion storage and a provider that uses the host's existing Queue and Jobs services. Every actionable `decide` task (`pending` or `claimed`), across all approval definitions, participates automatically. Waiting, blocked or pool-candidate tasks participate when they become actionable. No business-specific registration is required. Suggestions never approve, reject or edit records and never block human decisions.

## Default behavior and prerequisites

The host must register Agents, Queue and Jobs and apply the plugin's migrations. Agents remains an optional runtime dependency. Default registration observes approval-engine task activation events; it does not scan approval tasks at startup or on a timer. The engine marks task creation in an actionable state and genuine transitions into `pending` or `claimed`. Same-state updates, reminders, direct data imports and configuration changes do not trigger generation.

The activation intent is persisted in the approval transaction and discarded on rollback. After commit, the independent startup/two-minute scheduler checks current task eligibility and the Agents effective default chat model's provider/credential configuration without making a model call. These configuration reads run outside the approval transaction, so neither model configuration reads nor queue publication enter the human approval request’s wait chain. Automatic delivery can take up to one scheduling interval. Only eligible, configured tasks without an existing request enqueue generation. Missing configuration consumes the activation as skipped: no generation job is created, and configuring a model later does not replay skipped events or backfill existing approvals. An infrastructure delivery failure remains pending for delivery recovery, which is distinct from retrying an intentionally skipped event.

Default registration reconciles undelivered activation intents and unpublished queue intents on startup and every two minutes. It also marks expired running default-recipe results as failed with `interrupted`, fences their execution token and permits explicit regeneration; this never makes a model call. It never scans approval tasks or revives skipped events. Queue consumers alone execute generation. Generation failures leave human tasks unchanged.

The default recipe reviews only the run's frozen approval content, stage and subject. It does not fetch attachments, other business records or external policy documents. The model receives no tools. The public Agents gateway records usage and owns SDK retries; the default queue uses one execution attempt to avoid multiplying its retry budget. A failed generation remains failed until an authorized user explicitly retries.

Request identity includes the task, assignee, run, entry version, full prompt, content revision and model. Preparation and publication recheck these inputs and task eligibility; reassignment or changed content invalidates old results. Deterministic request IDs and database uniqueness deduplicate event delivery and concurrent manual clicks. Manual retries preserve failed history and create a new result version instead of resetting the old request.

## Generation budget and diagnostics

The built-in recipe defaults to 12000 output tokens (including reasoning tokens when the model reports them), 120 seconds and at most 8 relevant findings. It asks for concise summaries and bounded evidence quotes; the evidence validator still rejects invented references and nonmatching quotes. These are deployment budgets, not model capability declarations: choose values supported by the selected model. Report and prompt revisions and all generation settings enter the input fingerprint.

Export and register `defineApprovalSuggestionsConfig` from `@nocobase/app-plugin-approval/config` as the application's `approvalSuggestions` section in `defaultAppConfigs`. Registration is explicit and independent from registering the plugin. Without the factory, the provider uses code defaults and no additional environment variables are mapped. With the factory, configure:

```yaml
approvalSuggestions:
  maxOutputTokens: 12000
  timeoutSeconds: 120
  maxFindings: 8
```

The factory maps `APPROVAL_SUGGESTIONS_MAX_OUTPUT_TOKENS`, `APPROVAL_SUGGESTIONS_TIMEOUT_SECONDS` and `APPROVAL_SUGGESTIONS_MAX_FINDINGS`. Validation allows 1024–65536 output tokens, 1–600 seconds and 1–20 findings. Values remain server-only. Restart after changing them; changing the budget invalidates the current input fingerprint rather than reusing incompatible cached output.

The recorded Agents gateway contract guarantees only `{ text: string }`. The provider runtime-checks optional `finishReason`, `usage`, `durationMs` and `responseId` when a newer gateway supplies them; the Pro recipe does not require those fields in its framework type contract. `length` is classified as `output_limit` before parsing; other incomplete reasons are `model_incomplete`. Complete responses still undergo strict report and evidence checks. Failed validation persists `invalid_report` with a stable `validationCode` and numerical `validationPath`, not a provider message or raw output. Attempt history exposes safe diagnostics, start/deadline times and a persisted queued/running/finished phase. Token counts are recorded at completion, not streamed progress; phase and deadline are not heartbeats or proof that a provider is still working. Existing gateways that only return text remain compatible but cannot distinguish truncation reliably.

## Interrupted execution

The built-in recipe opts into bounded execution expiry using existing result storage. A claim records a start time, model deadline and recovery deadline (model timeout plus 30 seconds). The consumer enforces the timeout even if a generator ignores its abort signal. Startup/two-minute reconciliation conditionally marks expired running results `failed`/`interrupted`, clears their publication token and never regenerates them. Detection can take one scheduling interval after the recovery deadline. Legacy running results without a recovery deadline expire only after 600 seconds plus 30 seconds from their last update, covering the former maximum supported timeout. The conditional write cannot overwrite a refreshed claim or a completed/cancelled result.

During graceful shutdown, the execution returns to pending and Queue owns redelivery. Abrupt process loss or a changed/lost queue namespace can leave no delivery to resume; expiry makes that visible and requires an authorized manual retry. No provider stream can resume across process loss, and no exactly-once model invocation is promised. Execution tokens fence late publication. Custom recipes do not opt into expiry automatically: `createSuggestionQueue` accepts an explicit `recovery` policy if their execution contract supports a bounded deadline. Their existing retry and storage ownership stay independent.

## Manual generation and button state

Resolve `approvalSuggestionsToken` from `@nocobase/app-plugin-approval/server/assistant` in the application's authorized approval-detail handlers. Every method takes the task ID and authenticated user ID; never accept an arbitrary client-selected owner.

- `status(taskId, assigneeId, principalId?)` returns `{ state, canGenerate, advice, ...history }`. For the default recipe, `advice` is `{ report, diagnostics }` or `null`; `versions` contains authorized `{ id, report }` snapshots. It only reads state and never schedules generation. Production assignee and reader identities must come from authenticated authorization; example personas are not real-reader credentials.
- `generate(taskId, authenticatedUserId)` is the explicit manual action. It rechecks eligibility and prerequisites, reuses existing pending/successful work, and allows an explicit retry of failed work. It returns the current state.
- `read(taskId, assigneeId, principalId?)` returns `Record<string, unknown> | null`: the built-in recipe stores `{ report: SuggestionReport, diagnostics: SuggestionDiagnostics }`, not `{ advice: string }`. It returns `null` for pending, failed, unavailable, stale or inaccessible work. Custom recipes own their result schema.

Use `state` and the server's capabilities to control generation; `generated` displays the validated structured report and `failed` permits an explicit retry. Hide generation for `not_found` and `not_actionable`. Missing model/services hide the example's suggestion area for ordinary users; configuration managers see a localized setup hint. Refresh status after configuration, task actions and reassignment without scheduling generation. The example uses host Realtime invalidation and reconnect reconciliation rather than polling; read failures must reject so Realtime can retry, and a read-only refresh action remains available. Preserve the generation operation identity across uncertain mutation responses. Readiness is never authorization: the server rechecks everything when the button is clicked. Render report strings as untrusted text and use server-validated references; never render raw provider HTML or infer policy compliance from a field reference. Applications own their authenticated detail routes and UI.

Install the standard UI Library `@nocobase/approval-review` block as described in [Registry integration](review-ui.md). The Registry maintains the component; the installed source belongs to the application. Approval Example is an optional integration reference and does not export a review component for consumers.

The default migration creates activation intents and dedicated `approvalDefaultSuggestionJobs` / `approvalDefaultSuggestionResults` storage. It never consumes or modifies the legacy custom `assistantSuggestionJobs` / `assistantSuggestionResults` tables. It is irreversible to retain history. Existing hosts that already configured `assistantMigrationSource` keep it so their historical migrations and conversation storage remain tracked. New default integrations do not add that legacy source.

## Custom recipes

The `@nocobase/app-plugin-approval/server/assistant` factories remain available for advanced composition. Use both a separate queue name and separate jobs/results collections for each custom recipe; queue names alone do not isolate persisted reconciliation records. The application owns their authorization, materials, prompts, evidence/output validation, business/version references, UI, audit and cost policy. Never enqueue inside an approval transaction: persist a business event/outbox and enqueue after commit.

## Verified capability mapping

This mapping was checked against this workspace's public exports, implementations and tests, including `@nocobase/jobs`, `@nocobase/queue`, `@nocobase/app-server/jobs`, `@nocobase/app-server/queue`, Agents and both Pro Redis backends. All consumer imports use exported package paths.

| Previous responsibility                                                                                                                                          | Current owner and reason                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dispatch callback, worker registration, concurrency, rate limits, delayed retries, attempt budget, cancellation polling, preparation/result leases, expiry sweep | Host QueueService: producer/consumer/manager, backend scheduling and shutdown signal. No plugin QueueService, Redis, BullMQ or generic executor is constructed.                      |
| Periodic scan for expired executions and due retries                                                                                                             | Queue owns retries and redelivery. Opted-in bounded execution expiry only marks an orphan interrupted; ScheduleExecutor also recovers unpublished intents and never discovers tasks. |
| Request identity, owner subscriptions, shared authorized fingerprint, manual versions                                                                            | Approval assistant database: Queue job ID retention does not provide permanent business identity.                                                                                    |
| Last-subscriber cancellation and late publication                                                                                                                | Result row lock plus publication token. Cancelling a subscription is different from cancelling a Queue job.                                                                          |
| Model resolution                                                                                                                                                 | Agents public `models.gateway.languageModel`, with explicit application validation and usage recording. No duplicate gateway or tool runtime.                                        |
| Agents `jobs.register()`                                                                                                                                         | Not used: it registers deterministic remote Runner executors, not arbitrary model-generation workers.                                                                                |
| Generic JobExecutor                                                                                                                                              | Available for class-based host work, but wrapping the old processor would retain its duplicate queue implementation. Queue is used directly instead.                                 |

Queue is the sole execution retry owner. Defaults are three starts with exponential backoff starting at 60 seconds (then 120 seconds), configurable through `execution`. Only model `timeout`, `network`, and `rate_limited` errors are thrown for retry; other model failures are terminal. For one-attempt recipes, infrastructure failures across request attachment and result execution are persisted as terminal failures. If failure finalization itself cannot reach the database, the consumer retries only that write until it succeeds or shutdown returns the delivery to Queue; it does not call the model again. With multiple attempts, infrastructure failures propagate to Queue. `failed` records the latest execution outcome, including during backend backoff; there is no second retry timer or retry counter. Fresh manual generation requires a new stable request ID and request key; transport retries reuse both. Failed cached results are not automatically resurrected by new subscribers; deliberate regeneration creates another version.

## Business invariants and storage

`assistantCollections` exports the shared collection names. Default Approval migrations provide jobs/results; the legacy `assistantMigrationSource` provides standalone/custom storage including conversations. Preserve already registered legacy sources during upgrades; do not add them over freshly installed default tables. Equivalent application-owned storage can be supplied to the factories.

| Retained mechanism                          | Business invariant                                                                                                                                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request primary key                         | Duplicate enqueue never resets request identity, history or cancellation.                                                                                                                                                                   |
| Unique full-input fingerprint               | Only identical authorized input, model/options and prompt/schema/recipe versions share a result. Manual request identity salts the fingerprint.                                                                                             |
| Result row lock                             | Subscriber attachment, cancellation and final publication serialize around the same shared result. Cancellation cannot retire a result while another subscriber attaches.                                                                   |
| Random `publicationToken`                   | Only the current execution may publish; a duplicate delivery, restarted execution or retired result cannot overwrite a newer publication. Opted-in deadline expiry clears this token, fencing late publication without rerunning the model. |
| `dispatchPending` and cursor reconciliation | A committed request/result intent still needs broker acknowledgement. Scans publish only these intents, advance past failures and never requeue acknowledged executions.                                                                    |

Generation reassembles every linked owner's authorized inputs before each execution and again before publication. Invalid subscriptions are detached; if the last leaves, the result is retired before any abort. Retiring frees the fingerprint cache key while retaining the old result ID and output history. A new subscriber obtains a new result, even while an old provider is still exiting. The host must also recheck access, current task state and revision when reading/using a stored suggestion. Job IDs, raw result IDs and fingerprints are not authorization credentials.

`cancel(id)` requires host authorization. It detaches only that request. On last-subscriber cancellation, a durable retirement prevents all instances from publishing and the Queue manager best-effort aborts this instance's running job. There is no cross-instance cancellation guarantee and no polling loop. A remote model may continue running and incur cost until completion/timeout, but its output cannot publish. Delayed messages eventually observe retirement and do no work.

The original storage migration is unchanged. A second opt-in migration adds publication/outbox fields and converts unfinished legacy preparation and result intents while preserving IDs, metadata, result versions, subscribers and conversation bindings. Legacy retry columns remain inert compatibility data. Recipes that opt into bounded execution expiry use the existing result leaseExpiresAt column as a recovery deadline; no heartbeat or second retry counter is introduced. They may be removed by a later application storage migration after its readers have migrated. New request intents use `pending`, which legacy workers that only claim `queued` cannot consume. Migration clears the old execution lease and retry timestamps, fencing pre-cutover legacy completion writes. The new implementation has no `dispatch`, `process` or `sweep` API.

## Custom recipe host registration

Use the application's existing QueueServiceProvider and JobExecutorServiceProvider, registered before business providers. Register any Redis backend plugins through the normal server composition. Their registration occurs before Queue setup; do not instantiate another service in this provider. The following is a custom recipe execution registration; `prepareSuggestion` is the application-owned, authorized material/prompt adapter implementing `SuggestionQueueOptions['prepare']`.

```ts
import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { queueServiceToken } from '@nocobase/app-server/queue';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ScheduleExecutor } from '@nocobase/jobs';
import {
  createSuggestionQueue,
  type SuggestionQueue,
  type SuggestionQueueOptions,
} from '@nocobase/app-plugin-approval/server/assistant';

export function assistantProvider(
  customCollections: SuggestionQueueOptions['collections'],
  prepareSuggestion: SuggestionQueueOptions['prepare'],
  warn: (message: string) => void,
) {
  return class AssistantProvider extends ServiceProvider<AppPluginApplication> {
    readonly name = 'application/approval-assistant';
    private assistant?: SuggestionQueue;
    private schedule?: ScheduleExecutor;

    override boot(): void {
      const c = this.app.container;
      this.assistant = createSuggestionQueue({
        db: c.resolve(databaseManagerToken),
        collections: customCollections,
        queueName: 'application-approval-assistant',
        queue: c.resolve(queueServiceToken),
        prepare: prepareSuggestion,
        classifyError: (error) => {
          const code = (error as { code?: string })?.code;
          return code === 'rateLimit'
            ? 'rate_limited'
            : code === 'network'
              ? 'network'
              : 'generation_failed';
        },
        warn,
      });
      // All providers boot before QueueServiceProvider starts consumption.
      this.assistant.start();
    }

    override async ready(): Promise<void> {
      this.schedule = this.app.container
        .resolve(jobExecutorServiceToken)
        .getScheduleExecutor('application-approval-assistant-intents');
      await this.schedule.addJob({
        name: 'reconcile-intents',
        options: { every: 120_000 },
        payload: {},
        execute: async () => {
          await this.assistant!.reconcile();
        },
      });
      await this.schedule.setup();
      await this.assistant!.reconcile();
    }

    override async shutdown(): Promise<void> {
      await this.schedule?.shutdown();
      // Unregisters consumption and waits for in-flight model calls (bounded by prepare's timeout).
      await this.assistant?.shutdown();
      // The host subsequently shuts down its shared Queue service, persisting waiting messages.
    }

    async enqueueAfterCommit(
      id: string,
      metadata: Record<string, unknown>,
    ): Promise<void> {
      await this.assistant!.enqueue(id, { metadata });
    }
  };
}
```

Supply separately migrated custom jobs/results collections; never point this worker at the default recipe storage. Register the returned provider class explicitly in the application's plugin/provider composition only when AI is enabled. Migrate storage before starting it. For producer-only processes do not call `start()`; an explicitly enabled worker process registers consumption. Stop scheduled reconciliation and unregister consumption on shutdown; the host owns Queue setup/shutdown and backend connections. In-flight handlers must honor their combined Queue shutdown/cancellation and model timeout signal. Queue concurrency/rate limits come from its selected host configuration; use a dedicated logical queue name and identical configuration on every instance.

## Optional Agents adapter

Import `createAgentsSuggestionGenerator` from `@nocobase/app-plugin-approval/server/assistant/agents` only in an Agents-enabled application. This leaf entry requires the optional Agents and `ai` peers; the ordinary assistant/core entry does not import them. It resolves the model through the existing public gateway, makes one SDK call with `maxRetries: 0`, validates output and awaits the host's usage recorder. Queue owns the complete retry budget. The gateway's `generate()` currently embeds SDK retries, so nesting it beneath Queue retries would multiply attempts. This adapter does not implement a gateway, tools or session storage.

```ts
import { createAgentsSuggestionGenerator } from '@nocobase/app-plugin-approval/server/assistant/agents';
// Inside the host's prepare callback, after authorization and material collection:
const generate = createAgentsSuggestionGenerator({
  agents, // container.resolve(agentsToken), using the public server/tokens entry
  request: { model, prompt, source: 'application.approvalSuggestion' },
  validate: (text) =>
    validateAuthorizedEvidence(JSON.parse(text), authorizedInput),
  recordUsage: (usage) => applicationUsageRecorder(usage),
});
```

No suggestion-generation tools are registered. Approval does not expose a conversation helper API. Existing opt-in assistant storage migrations remain unchanged for upgrade compatibility.

## Cutover and guarantees

Deploy in this order: stop every old JobExecutor worker and its sweeper on every instance; drain/retire old broker messages under the application's deployment procedure; back up business storage; apply the new migration (or an equivalent new OA migration mapping its custom collections); replace the consumer's dispatch/JobExecutor wrapper with the Queue registration above; retain IDs, history and unknown conversation creation intents; start only the new workers and reconcile unpublished intents. Use a fresh Queue name for this cutover. Rolling mixed old/new consumers is unsupported. Rollback requires stopping new consumers first and explicit operator handling of pending intent states; migration down removes new fields and is not a live worker rollback procedure.

Memory Queue writes pending state at graceful shutdown and is process-local. It does not promise recovery after abrupt process loss or coordinate multiple instances. Redis Queue uses BullMQ lock/stalled recovery and shared storage, but cancellation through QueueManager remains local. Configure Redis for production recovery; an acknowledged Queue delivery is never recreated by the business reconciler to compensate for losing Memory state. There is no transactional database/broker dispatch, permanent Queue ID deduplication or exactly-once external model call. Reconciliation bridges the publish/acknowledgement gap; after Queue history eviction a repeated uncertain publication can execute again, but conditional business publication still produces at most one usable result. Queue's retry budget applies to a retained broker job, not to all possible republished messages forever. Guaranteeing permanent broker-level attempt budgets requires an upstream public delivery/receipt capability; no private backend API is used here.

The default suggestion status includes ordered `attempts` with request identity, outcome, creation/completion timestamps and a stable error classification. `generationCount` counts persisted requests, including failed and cancelled ones; internal gateway retries do not create report versions. `versions` contains only currently authorized successful structured reports. Completed results that cannot be read (including revoked material access) are marked `unavailable` in attempt history and expose no report content. Consumers should distinguish the latest attempt status from the selected report, retain usable reports on a later failure, and present transport failures separately.

The default structured report includes a model-generated `nextStep`: one concise sentence recommending the next handling action with the main reason. It is generated with the findings, validated as nonempty text of at most 1000 characters, persisted with the report and returned in authorized history. The prompt requests at most 400 characters and allows reasoned recommendations such as approval, non-approval, correction, collecting materials or transfer even when some information is missing. It must identify material assumptions or decisive uncertainty without inventing facts, policies or recipients. This overall recommendation is distinct from evidence-backed policy conformity labels; it does not execute a decision or change the findings validator. Legacy reports may omit `nextStep`; consumers must not manufacture a replacement or regenerate on read. Prompt and recipe revision 7 separates new generation fingerprints from older results.

The built-in prompt supplies server-owned `materials[].excerpts` with short stable IDs and exact text chunks. The model returns evidence as `{ id }`; validation resolves these to the supplied material’s real kind, reference and exact quotation. Unknown IDs or attempts to override an excerpt’s content fail validation. Source, stage and subject remain task context and are explicitly excluded from evidence references. This avoids failures caused by models citing context fields as application fields or rewriting quotations. The parser retains the strictly verified legacy evidence form for compatible callers and existing fixtures.

The default automatic flow supports frozen approval fields only in this version; there is no public reader-mapping hook for it. Knowledge materials are loaded only by manual generation with an authenticated `principalId`. Use a custom recipe for automatic knowledge retrieval. For source-scoped material composition and the public committed notification bridge, follow the [integration contract](assistant.md#material-composition-and-invalidation). Partial documents carry truncation and range metadata and cannot establish definitive policy conformity.

Generated recommendations and finding titles/summaries use the assignee’s saved `locale` user preference, falling back to the application default language (or `en-US` without an i18n runtime). The locale is part of the generation fingerprint, so changing it requires a new generation rather than reusing a report in the previous language. Evidence quotes retain their original text.
