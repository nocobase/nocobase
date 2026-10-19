# UI context, tool cards and AI form adapters

The public entry for all browser APIs below is `@nocobase/app-plugin-agents/client/chat`. The plugin supplies generic JSON context transport, SDK tool renderer registration and local form adapters. The Examples application supplies its `examples_form_proposal` tool, proposal schema, editable card and `/ai-form-fill` page; none is a plugin default. The complete runnable example is described in [Examples OnlineAgent](../../../templates/app-template-examples/online-agent.md#ai-form-fill-browser-drafts-only).

The Agents client SDK exports `AIFormRegistry`, `AIFormRegistryProvider`, `useAIFormRegistry`, and `useAIForm` from `@nocobase/app-plugin-agents/client/chat`. These are generic browser-draft capabilities, not a built-in form-filling tool, form engine, card renderer, persistence API, or SDK tool continuation. Applications own their fields, tool schemas, proposal cards, validation, and explicit user actions. `useAIForm` returns a ref callback; it does not return `{ ref, context }`.

## Open UI context, not business-resource authorization

`PageContext.ui` is optional and has the strict envelope `{ version: 1, items: PageUIItem[] }`. Each item requires nonempty `kind` and `id` strings and may contain any other accepted `AppUIJson` fields. Unknown kinds, nested custom objects, arrays, null, false, zero and empty strings survive admission, model conversion, persistence, public metadata and history/reconnect recovery. No kind resolver is needed. By contrast, `context.items` remains the existing server-resolved and authorized business-reference list; putting a record id, route or claimed permission into `ui.items` grants no access to that record or a tool.

A form is only one convention. This application-owned source uses an unknown UI kind and never reads form state:

```tsx
import { useRef, type ReactElement } from 'react';
import {
  useChatSources,
  useChatUIContextSource,
  uiItemKey,
} from '@nocobase/app-plugin-agents/client/chat';

export function ChartContext(): ReactElement {
  const sources = useChatSources();
  const chart = useRef({ series: [0, 12], annotation: null });
  const item = { kind: 'sales-chart', id: 'quarterly' };
  useChatUIContextSource({
    ...item,
    label: 'Quarterly chart',
    getSnapshot: async () => ({
      ...item,
      options: { showLegend: false, caption: '' },
      data: chart.current,
    }),
  });
  const selected = sources.selectedUIKeys.has(uiItemKey(item));
  return (
    <button type='button' onClick={() => sources.selectUI(item, !selected)}>
      {selected ? 'Exclude chart' : 'Include chart'}
    </button>
  );
}
```

`useChatUIContextSource(source | null)` makes a source available while mounted, without selecting it or reading it. `useChatSources().selectUI(source, true)` is a separate explicit action; `false` removes it. Duplicate live `(kind, id)` registrations and duplicate identities in one envelope throw rather than overwrite. Unregistering removes its selection; pathname navigation clears UI selection. Callback updates use the latest committed reader without implicitly reselecting the source.

The installed chat composer awaits `sources.snapshotUI()` at Send, then passes the detached result as `ui` to `buildPageContext`. A custom composer must do the same: `buildPageContext` is synchronous, its `uiSources` input builds chips only, and registration alone does not attach snapshots to messages. Snapshot readers can be asynchronous but must be side-effect free. Selection/source/provider-lifetime changes during the read reject it; the composer must show that error and not submit stale data. Form snapshots additionally detect draft-revision changes while reading. Accepted JSON is cloned, so later object mutation cannot rewrite the sent message. Native and Runner model inputs label UI snapshots as untrusted user data, never system instructions; a follow-up that needs current UI state must explicitly include a fresh snapshot. Earlier Native user-message snapshots may remain in model history as historical data, but do not authorize a new card's target when absent from its own source message.

`PAGE_UI_CONTEXT_LIMITS` centrally bounds an envelope to 10 items, 64 KiB of serialized UTF-8 JSON, depth 12 (the envelope is depth zero), 4,096 JSON values, kind length 64, id/key length 200 and string length 16,384 JavaScript string units. `clonePageUIContext` validates and detaches an envelope; `pageUIContextSchema` is the shared schema. Budgets reject, never truncate. Dangerous keys (`__proto__`, `prototype`, `constructor`), non-plain objects, getters, hidden/symbol properties, sparse/extended arrays, cycles and non-JSON values are rejected before serialization without invoking getters or `toJSON`. Keep snapshots minimal and deliberately exclude secrets; open transport is not a reason to upload an entire page.

## Register generic SDK tool renderers

`AIToolRendererProvider` takes an `AIToolRendererMap`: exact SDK tool names mapped to React components with `AIToolRendererProps`. The Registry chat uses the SDK's `isToolUIPart`/`getToolName` helpers, so both static `tool-*` and `dynamic-tool` parts dispatch by the actual tool name. Unregistered tools retain the normal JSON/approval fallback. Existing ordered parts, data/business/notice extensions and message-extra rendering stay in the same timeline; the provider creates neither a chat owner nor a transport. An inner renderer provider inherits other keys and overrides matching parent keys; a nested form registry provider, in contrast, is isolated.

| Prop                                             | Contract                                                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `toolName`                                       | Exact tool name, not a display label or part type.                                                                      |
| `part`                                           | Read-only public SDK `AIToolPart`; narrow `part.state` before reading output. It is not a private raw execution result. |
| `message`                                        | Read-only owning `AppUIMessage`, retaining durable conversation/message/tool identity.                                  |
| `context.readOnly`, `context.streaming`          | Interaction gates; do not enable local draft application while either is true.                                          |
| `context.sourceMessage`, `context.sourceContext` | Exact server-linked user message and its saved context, or null when unavailable; never a nearest-message heuristic.    |
| `context.approval`                               | Existing bound SDK approval control: `disabled`, `pending`, `error`, and `respond(approved, reason?)`.                  |

A registered renderer replaces the fallback for that tool in every state, so it must handle `input-streaming`, `input-available`, `approval-requested`, `approval-responded`, `output-available`, `output-error` and `output-denied`. Never parse partial streaming input as a completed proposal. For genuine SDK approval, show the requested decision and call `context.approval.respond` only from a user action while enabled, displaying pending/error feedback. Local **Apply draft** is not approval: the proposal tool has already finished. Neither path should run from mount/effect, history restoration or reconnect.

Public tool visibility still requires the server tool's explicit `public.input` and `public.output` projections. These are Agents safety APIs, not SDK-standard methods. SDK `toModelOutput` independently controls private model conversion; it does not expose output to browser cards. Validate and expose only safe proposal fields, never publish raw private tool evidence to make a renderer work.

## Three separate decisions

1. **Register a live adapter:** attach the callback from `useAIForm` to the form. Registration makes capabilities discoverable locally through `registry.list()` and `registry.locate(id)`; it does not read values, upload data, select context, or execute anything.
2. **Select UI context:** make an available source with `useChatUIContextSource`, then explicitly select it through `useChatSources().selectUI`. The existing chat owner reads `registry.snapshot(id)` at send time and fixes that selected JSON snapshot on the user message. Do not use the business-resource `context.items` resolver for form data.
3. **Apply an edited proposal:** after explicit confirmation, pass the final edited patch, a stable operation key, and the selected snapshot from the tool card's exact originating user message to `registry.apply`. The registry never derives authorization from model-provided ids or a currently selected form.

Mount the registry provider inside the same keyed authenticated-identity boundary as the existing `ChatProvider`, covering both the business page and shared chat panel. Do not create a second chat owner. A nested form registry provider is an isolated scope, not a merge with its parent. A new identity must get a fresh registry; do not share a module-global registry across users.

## Register a form and expose an optional context source

This minimal adapter intentionally exposes only two fields. A real application should use its own input components and translations. Passwords, tokens, hidden values, and other sensitive fields must be excluded explicitly from both `fields` and `getValues`; the registry rejects undeclared read values rather than silently uploading or dropping them.

```tsx
import { useRef, useState, type ReactElement } from 'react';
import {
  useAIForm,
  useAIFormRegistry,
  useChatSources,
  useChatUIContextSource,
  uiItemKey,
} from '@nocobase/app-plugin-agents/client/chat';

export function DraftForm({
  userId,
  recordId,
}: {
  userId: string;
  recordId: string;
}): ReactElement {
  const registry = useAIFormRegistry();
  const sources = useChatSources();
  const draftRef = useRef({ name: '', recordId });
  const revisionRef = useRef(0);
  const [name, setName] = useState('');
  const id = 'customer-draft';

  function changeName(next: string): void {
    // Advance synchronously, including for ordinary manual edits.
    draftRef.current = { ...draftRef.current, name: next };
    revisionRef.current += 1;
    setName(next);
  }

  const ref = useAIForm<HTMLFormElement>({
    id,
    title: 'Customer draft',
    identity: JSON.stringify([userId, recordId]),
    fields: [
      { name: 'name', title: 'Name', type: 'string', editable: true },
      { name: 'recordId', title: 'Record', type: 'string', editable: false },
    ],
    getRevision: () => String(revisionRef.current),
    getValues: () => ({ ...draftRef.current }),
    validate: (patch) =>
      typeof patch.name === 'string' && !patch.name.trim()
        ? 'Name must not be blank.'
        : undefined,
    setValues: (patch, context) => {
      if (!context.isCurrent()) throw new Error('The target draft changed.');
      if (typeof patch.name === 'string') changeName(patch.name);
      // Do not submit, call a save endpoint, or add a tool-output message here.
    },
  });

  const source = { kind: 'form', id };
  useChatUIContextSource({
    ...source,
    label: 'Customer draft',
    getSnapshot: () => registry.snapshot(id),
  });
  const selected = sources.selectedUIKeys.has(uiItemKey(source));

  return (
    <form ref={ref} onSubmit={(event) => event.preventDefault()}>
      <label>
        Name
        <input
          value={name}
          onChange={(event) => changeName(event.target.value)}
        />
      </label>
      <p>Only the browser draft changes; nothing is saved.</p>
      <button type='button' onClick={() => sources.selectUI(source, !selected)}>
        {selected
          ? 'Remove draft from chat context'
          : 'Include draft in chat context'}
      </button>
    </form>
  );
}
```

Mount this example with a React key containing the user and record identity so its example draft state resets when those change. The registry also supports an identity change without component unmount: `useAIForm` replaces the live instance token when `id`, `identity`, provider registry, or actual ref attachment changes. The application remains responsible for resetting its own form state to the new record.

Available sources are not selected automatically. The existing send path reads only selected UI sources and attaches `context.ui = { version: 1, items: [...] }`. The source reader must remain side-effect free. Snapshot failure, a draft change during reading, or a disappearing form should block sending the snapshot with a visible error, not silently send stale values. Other UI kinds are allowed; form data is one application convention within the open UI-item protocol.

## Snapshot and capability contract

`await registry.snapshot(id)` returns a detached `PageUIItem` with this form convention:

```ts
{
  kind: 'form',
  id: 'customer-draft',
  title: 'Customer draft',
  identity: '["user-1","record-7"]',
  instance: 'opaque-local-instance-token',
  revision: 'opaque-draft-revision',
  fields: [
    { name: 'name', type: 'string', editable: true },
    { name: 'recordId', type: 'string', editable: false },
  ],
  values: { name: '', recordId: 'record-7' },
}
```

Treat `instance` and `revision` as opaque strings. Instances are unique per registration: A→B→A cannot revive A's previous token. The snapshot's revision includes a registry write epoch as well as the adapter's `getRevision()` value; every attempted setter invalidates previous snapshots, even if it fails or partially applies. Neither token is a server authorization credential.

`fields` supports `string`, `number`, `boolean`, and `json`, an explicit `editable` capability, an optional display title, and an optional JSON `enum`. The registry enforces declared fields, edit capability, primitive type, finite JSON numbers, and enum membership before the setter. An application validator receives an isolated copy of the final edited patch and returns an error string or `undefined`, synchronously or asynchronously. Validator mutation cannot change the patch subsequently delivered to the setter. Cross-field or business rules remain the application's responsibility.

Field names are flat. Dots, brackets, slashes, backslashes, `__proto__`, `constructor`, and `prototype` are rejected; the registry never traverses property paths or merges nested objects. A nested value is supported only as a whole explicitly declared `json` field, with the adapter responsible for interpreting that value safely. Dangerous keys are rejected at every JSON depth. Cycles, accessors, functions, undefined, BigInt, non-finite numbers, sparse arrays, extended arrays, non-plain objects, and hidden properties are rejected without executing getters or `toJSON`.

The form boundary reuses `PAGE_UI_CONTEXT_LIMITS` for JSON depth, bytes, nodes, string length, and keys; it admits the complete form snapshot under the shared UI transport envelope as well. There are at most 100 declared fields. Data exceeding a budget is rejected, never silently truncated. A snapshot accepted alone may still exceed a message's combined UI budget when other selected sources are present.

## Apply only from the exact originating message

Use the renderer's `context.sourceContext` / `context.sourceMessage` established by the server's durable `message.metadata.sourceUserMessageId` association. Native execution sets this to the admitted user-message id for the response and preserves it through approval revisions and public projection. `getAIToolSourceMessage(message, messages)` returns a source only for an assistant message with both that id and a conversation id, and exactly one loaded user message matching both. The Registry supplies that result and its `metadata.context` to the renderer. It does not accept a model-provided source id or assume Runner/legacy messages have this Native linkage. If history pagination has not loaded that source, disable application until it is available. Never scan for the latest user message, use current composer context, trust the model's allowed ids, or authorize from a bare `registry.locate(id)` result. UI context is browser-supplied data and grants no server resource access.

The following handler belongs inside an application-owned renderer/card. `proposal` must already have passed the application's own strict output schema; `editedValues` must be the user's currently edited and validated values, not the original `part.output`. The caller must require an explicit click, disable the action in read-only/streaming states, and prevent overlapping button handlers. See the Examples application's `form-proposal-card.tsx` for a complete card with editable controls and localized outcomes.

```tsx
const registry = useAIFormRegistry();

async function applyEditedProposal(): Promise<void> {
  if (
    context.readOnly ||
    context.streaming ||
    part.state !== 'output-available'
  )
    return;
  const candidates =
    context.sourceContext?.ui?.items.filter(
      (item) => item.kind === 'form' && item.id === proposal.formId,
    ) ?? [];
  const source = candidates.length === 1 ? candidates[0] : undefined;
  if (
    !source ||
    source.instance !== proposal.instance ||
    source.identity !== proposal.identity ||
    source.revision !== proposal.revision
  ) {
    showError(
      'The proposal has no matching selected source. Generate a new proposal.',
    );
    return;
  }

  // Detach the source before crossing into the mutable JSON adapter API.
  const selected = clonePageUIContext({ version: 1, items: [source] }).items[0];
  const outcome = await registry.apply({
    source: selected,
    operationId: JSON.stringify([
      message.metadata?.conversationId,
      message.id,
      part.toolCallId,
    ]),
    values: editedValues,
    signal: abortController.signal,
  });
  showLocalDraftOutcome(outcome); // Only status 'applied' confirms the local draft update.
}
```

The sketch uses `clonePageUIContext` from the same client SDK export. `showError`, `showLocalDraftOutcome`, `proposal`, edited form controls, and the card's `AbortController` are application-owned. A dismiss/cancel button should simply close or mark the card dismissed; it must not call `registry.apply` or the setter. If aborting an in-progress operation, abort its signal instead of reporting success. Mounting a card, replaying history, or reconnecting must never invoke this handler.

`registry.apply({ source, operationId, values, signal? })` clones the request before asynchronous work, checks the selected source's form kind, instance, identity, revision, and declared capabilities against the live registration, rejects competing operations on the same form, validates the final patch, and awaits the setter. It does not read model target ids to discover a target. A manual edit after sending is a conservative revision conflict, even when it touched another field. Generate a fresh proposal instead of silently merging.

Operation keys are scoped to the registry lifetime. The same key and identical source/patch return the same pending promise or completed result; different content under an already-used key is rejected with `operation-conflict`. A cached success describes the previous local operation, not the form's current state. Keep the key stable across card remounts and repeated clicks. A deliberate corrected attempt after pre-setter validation rejection needs a new operation key; never silently retry a failed setter, because its outcome may be partial. A setter attempt invalidates the old source snapshot in all cases.

## Asynchronous adapter and failure responsibilities

`AIFormOperationContext` supplies `signal` and `isCurrent()`. Unmount, instance replacement, capability changes, and explicit cancellation abort tracked operations. The guard additionally compares the live draft revision, catching manual edits that occur without unmount. Adapters should pass `signal` to cancellable preparation work, then check `isCurrent()` **immediately before a synchronous browser-draft commit**. A guard checked before an `await` does not protect a later commit.

```ts
setValues: async (patch, context) => {
  const prepared = await prepareDraftPatch(patch, { signal: context.signal });
  if (!context.isCurrent()) throw new Error('The target changed before commit.');
  commitDraftSynchronously(prepared); // Also advance the adapter revision synchronously.
  return { status: 'applied' };
},
```

The registry cannot prevent an arbitrary third-party asynchronous setter from ignoring its signal, mutating a stale record after an await, partially writing, or lying about success. The adapter must preserve atomicity when its form library supports it, implement rollback if needed, and avoid asynchronous gaps between its final guard and commit. `getValues` must be side-effect free and should honor the same guard/signal contract for expensive reads. `getRevision` must be synchronous, side-effect free, change on every draft mutation, and never reuse a value within the same live instance; use a monotonic counter or unique revision token. Timestamp collisions, value-derived hashes that can revert, or asynchronous React state alone are not reliable revision counters.

A synchronous/async setter resolving `void` or `{ status: 'applied', message? }` confirms the adapter completed its draft operation. `{ status: 'partial', message? }` honestly reports partial application. A thrown/rejected setter returns `status: 'failed'`, never success; a detected target replacement/cancellation while an uncooperative setter runs returns `status: 'failed'`, `code: 'stale-after-write'` with an explicitly unconfirmed outcome. Explicit request-signal cancellation before the setter returns `cancelled` without calling it. Validation, stale-target, capability, and revision conflicts return `rejected`. No generic transaction or rollback is promised, and none of these outcomes claims business persistence.

## Integrated application wiring

The runnable Examples implementation covers the complete chain without inventing a plugin form tool. The relative Examples source links below are repository-checkout references, not files shipped inside the installed plugin; generated applications should adapt the public contract and own their schema/tool/card. Its application-owned [shared schema](../../../templates/app-template-examples/shared/ai-form-fill.ts), [boot provider](../../../templates/app-template-examples/server/providers/ai-form-fill.ts), [page](../../../templates/app-template-examples/client/pages/ai-form-fill/index.tsx), [card](../../../templates/app-template-examples/client/components/online-agent/form-proposal-card.tsx) and [identity provider](../../../templates/app-template-examples/client/components/online-agent/provider.tsx) are the maintained complete example. The following condensed wiring shows how the pieces fit; the constants, schema and renderer imports are **Examples application modules**, not plugin exports:

```ts
// server/providers/ai-form-fill.ts; register after Agents in the application composition.
import type { Application } from '@nocobase/app-server/application';
import { ServiceProvider } from '@nocobase/service-provider';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import {
  EXAMPLES_FORM_SCOPE,
  EXAMPLES_FORM_TOOL,
  formProposalSchema,
} from '../../shared/ai-form-fill.js';

export default class AIFormFillProvider extends ServiceProvider<Application> {
  public readonly name: string = 'app/examples-ai-form-fill';

  public override async boot(): Promise<void> {
    const online = this.app.container.resolve(agentsToken).onlineAgent;
    online.configurator.registerTool(EXAMPLES_FORM_TOOL, {
      version: '1',
      definition: {
        description:
          'Return a proposal for a selected browser form; never save it.',
        inputSchema: formProposalSchema,
        public: {
          input: (input) => formProposalSchema.parse(input),
          output: (output) => formProposalSchema.parse(output),
        },
        execute: async (input) => formProposalSchema.parse(input),
      },
    });
    online.configurator.registerOnlineAgentScope(EXAMPLES_FORM_SCOPE, {
      tool: [EXAMPLES_FORM_TOOL],
    });
  }
}
```

Keep this tool in an explicitly selected Native scope, not a global tool layer shared with Runner. The real Examples provider additionally supplies task instructions; those instructions are not a substitute for the card/registry's target and field checks. The strict application schema is `{ formId, instance, identity, revision, values }`; only `name`, `priority`, `budget` and `subscribe` can appear in its patch. The tool merely returns the validated proposal. It never invokes a browser adapter or claims a record was saved.

```tsx
// Inside the existing authenticated identity lifetime, covering page AND panel:
import {
  AIFormRegistryProvider,
  AIToolRendererProvider,
  ChatProvider,
  type AIToolRendererMap,
} from '@nocobase/app-plugin-agents/client/chat';
import { FormProposalRenderer } from './form-proposal-card.js';
import { EXAMPLES_FORM_TOOL } from '../../../shared/ai-form-fill.js';

const toolRenderers: AIToolRendererMap = {
  [EXAMPLES_FORM_TOOL]: FormProposalRenderer,
};

// Replace/wrap the existing owner's location; do not add a second ChatProvider.
<AIFormRegistryProvider>
  <AIToolRendererProvider renderers={toolRenderers}>
    <ChatProvider>{children}</ChatProvider>
  </AIToolRendererProvider>
</AIFormRegistryProvider>;
```

Keep the application's existing authenticated-lifetime key, cache/panel reset, readiness checks and cleanup around this composition. `children` is the existing page/panel tree. A registry instance shared outside that lifetime would let old local operations outlive the account that created them.

1. On the page, attach `useAIForm`'s returned callback to `<form ref={ref}>`, declare safe readable fields and editable capabilities, and expose `getSnapshot: () => registry.snapshot(id)` with `useChatUIContextSource` as shown above.
2. Let the user explicitly select the form. Examples combines this intent with opening chat through the AI icon in the draft Card header: after creating the scoped conversation, it calls `sources.selectUI({ kind: 'form', id }, true)` before opening the panel. Registration, visiting the page and the ordinary header chat remain separate from inclusion.
3. From the existing page's `useChatApi()` and `useChatPanel()` hooks, the Examples form icon calls `api.createConversation({ agentId: 'online', config: { scope: [EXAMPLES_FORM_SCOPE] }, selectedModel: { modelService: service.name, model: model.value } })`, selects the form, then calls `panel.openChat({ conversationId: conversation.id, draft: prompt })`. It does not send automatically. The shared panel's composer chip displays the included form and can remove it.
4. The installed composer awaits the selected sources at Send. The server admits and saves that user message and its UI snapshot, executes the application tool and returns the safe SDK tool output with the exact source-message linkage. The registered renderer parses only `output-available` through the application's strict schema; all other states remain non-applying UI.
5. The card obtains its target only from `context.sourceContext`, checks the proposal's id/instance/identity/revision against that selected source, lets the user edit fields, validates the current editor values and calls `registry.apply` on a click with a stable conversation/message/tool operation key. Its cancel button never invokes the setter. It awaits the result and reports applied/partial/failed/stale honestly, aborting tracked work on unmount.
6. Only the guarded synchronous adapter commit changes the browser draft. A manual edit after Send, record A→B→A, missing source history, unmounted form or changed account prevents an old proposal from acquiring a new target. Reload/history replay never reapplies a card. No save endpoint, business write, fabricated tool result, `addToolOutput`, continuation or second chat state is involved.

These steps are implemented together in Examples; the generic plugin is not restricted to this form kind, schema or tool name. See [Examples usage and verification](../../../templates/app-template-examples/online-agent.md#ai-form-fill-browser-drafts-only) before running the example.

## Public low-level helpers

- `new AIFormRegistry()` creates an isolated local registry. Normally let `AIFormRegistryProvider` own it; an explicit `registry` prop is useful for application composition or tests.
- `registry.register(registration)` returns `{ instance, update, unregister }`. `update` refreshes callbacks/capabilities for the same id and identity; changing identity requires a new registration. Duplicate live ids throw. Stale `unregister` calls cannot delete a later instance.
- `registry.list()` and `registry.locate(id)` expose detached read-only descriptors, never a setter handle. They do not subscribe React components to changes; use the form's application state for selection and reactive UI. Operation results remain the execution authority.
- `registry.snapshot(id)` reads declared safe values with asynchronous stale-read protection, returning a JSON item suitable for explicitly selected UI context.
- `registry.apply(request)` is the controlled execution boundary. Do not recreate an unchecked `registry.get(id).setValues(...)` route around it.

Related contracts: [UI messages](ui-messages.md), [UI message clients](ui-message-clients.md), and the Examples application's AI form-fill page and application-owned tool/card. The plugin supplies no default form tool or card and does not call `addToolOutput` for local draft application.
