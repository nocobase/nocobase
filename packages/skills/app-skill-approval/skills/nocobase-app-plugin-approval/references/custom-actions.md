# Define and register a business action

When configuring built-in actions cannot express the requested business operation, implement a new action in the application's own server module (or the business plugin), using public exports from `@nocobase/app-plugin-approval/server`. Agents may author and register these extensions as part of the business feature; no approval-kernel modification or Workflow Instruction is needed.

## Definition contract

1. Define the operation's input and configuration types, a name unique within the approval, and `scope: 'task'` or `'run'`. Declare permitted `actors` and applicable `guards`; for example, task decisions normally require an open run, current stay, actionable task and active actor. Choose guards for the operation rather than copying them blindly: a run-level reminder is not a task decision.
2. Use `defaults` and `checkConfig` for configuration, `available` returning `offered`/`unavailable` for whether the operation is offered now, and `validate` for input rules. Availability and execution use the same checks; return useful offered data for the host UI, such as removable signer IDs or the current deadline. Use `reason` when a comment is mandatory.
3. Implement `plan(input, context)` returning supported `Effect` values. The kernel validates and applies them, records the action and settles affected work in one transaction. Do not write approval tables, bypass the service with run transitions, or call network services in the plan. Fetch required external data before execution and validate the input; task `notify` effects deliver notices after commit.
4. List persisted input fields in `record` and use `summary` when the timeline needs a business-specific summary. Declare all directly requested conclusions in `outcomes(config)` (for example, `[{ exit: 'terminated' }]`); definition checks validate their exits independently of the action name. Actions conclude through the state's configured standard outcome transition; custom policy outcomes require their own declared transition. Cross-state circulation uses the application graph. Declare `batch` only when the user operation supports batch execution. Declare `presentation: { tone, primary }` when the action should be a main control or read as dangerous: pages draw offered actions from it, so an undeclared action is an ordinary entry under "More". Actions accept user roles, including administrators; automatic rules do not declare actions or system triggers.
5. Export the definition from the business module and register it in each applicable stage's `actions`, bare or via `configureAction(action, config)`. This stage entry is the registration: exporting a definition alone does not enable it, and no global action registry is required. `afterEnd` is for operations permitted after the run ends; it supplies nothing during a stage. Use the same name with `perform`, not a named convenience method that the plugin does not provide.

## API reference

All names below are exported from `@nocobase/app-plugin-approval/server`; the installed declarations are authoritative.

`ApprovalAction<Input, Config>` fields:

| Field                      | Contract                                                                                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                     | Unique within the approval; stored on the action record and used to find the timeline renderer and with `perform({ action })`                                                                                                            |
| `scope`                    | `'task'` (target `{ taskId }`) or `'run'` (target `{ runId }`)                                                                                                                                                                           |
| `actors`                   | Any of `assignee`, `delegate`, `admin`, `supervisor`, `applicant`; tried in that order, so an assignee who is also an administrator acts as the assignee. `admin`/`supervisor` need the approval's `adminRole`/`supervisorRole`          |
| `guards`                   | Any of `runOpen`, `stayCurrent` (the task belongs to the current stay), `taskOpen`, `actionable` (pending or claimed), `contentCurrent` (the frozen content and the page's `contentHash` match), `activeActor`; checked in a fixed order |
| `available(context)`       | Return `offered(options?)` or `unavailable(code, message)`; `options` reach the page through `actionsFor`, such as removable signers or the current deadline                                                                             |
| `validate(input, context)` | Return `null`, a message (refused as `INVALID_INPUT`) or `{ code, message }` such as `REASON_REQUIRED`                                                                                                                                   |
| `reason`                   | `true`/`false`, a prompt string (required, with that prompt), or `(input, context) => boolean \| string`                                                                                                                                 |
| `plan(input, context)`     | Return `Effect[]`; must not write or call out                                                                                                                                                                                            |
| `outcomes(config)`         | Every `StageResult` the plan may `conclude` with: `'approved'`, `'rejected'`, `{ returnTo }`, `{ exit }`; each needs a matching `approvalOutcome` transition                                                                             |
| `defaults`, `checkConfig`  | Configuration when listed bare, merged under `configureAction(action, config)`; `checkConfig` throws on invalid configuration at definition time                                                                                         |
| `people(context, query)`   | Candidates for the action's own people picker, returning `{ people, nextOffset }`; served through `candidatesFor`. Built-in transfer/addSigner take a `PeopleScope` instead                                                              |
| `record`, `summary`        | Input fields kept on the action record; a business summary for the timeline                                                                                                                                                              |
| `batch`                    | `{ requireContentHash? }` to allow `performBatch`                                                                                                                                                                                        |
| `presentation`             | `{ tone: 'default' \| 'primary' \| 'danger', primary: boolean }`                                                                                                                                                                         |

`ActionContext` is read-only: `config`, `actor`, `role` (what the actor acts as), `onBehalfOf`, `comment`, `run`, `stage`, `definition`, `approval`, `task` (null for a run action), `stay` (every task of the stay, closed ones included), `unassigned` places, `record` (as stored), `applicantId`, `directory`, `services`, `parameters`, `now`/`at`, and the helpers `deadline(hours)` (the instant `hours` after `now` on the approval's calendar, natural hours without one; use it for any `remindAt`/`dueAt` a `retime` or `open` sets), `allowedAnswers(task)`, `await eligible(person, { replacing, ...task })` (would a task given to this person land with them, without giving it out), `concluded(stage)`, `actions()` and `events()` (the run's history, oldest first).

`Effect` values the plan may return, applied in order in one transaction:

| Effect                                                        | Use                                                                                                                                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ type: 'answer', task, answer, comment?, data? }`           | Answer a task with a fixed answer the task allows (`approve`, `reject`, a policy answer such as `abstain`, or an auxiliary task's own such as `acknowledged`)                                                             |
| `{ type: 'open', ref?, task: NewTaskSpec }`                   | Give out a new task in the stay: `assigneeId`, `kind`, `role` (`member` votes, `gate` holds a member, `info` never blocks), `via`, optional `status`, `mode`, `gates`, `answers`, `dueAt`… It passes the assignment rules |
| `{ type: 'transfer' \| 'replace', task, assigneeId, via, … }` | Hand a task to someone else, keeping its responsibility and clocks; `transfer` marks the old task transferred, `replace` voids it                                                                                         |
| `{ type: 'close', task, reason }`                             | Void an open task, such as a removed signer                                                                                                                                                                               |
| `{ type: 'status', task, status }`                            | Move a task between `pending`, `waiting`, `blocked`, `candidate`, `claimed`, `suspended` along the allowed moves (`STATUS_MOVES`)                                                                                         |
| `{ type: 'retime', task, remindAt?, dueAt? }`                 | Change a task's clocks                                                                                                                                                                                                    |
| `{ type: 'conclude', result, input? }`                        | End the stay with a declared result; at most one per plan, and only `notify` may follow it                                                                                                                                |
| `{ type: 'settle', event? }`                                  | Ask the policy to decide again when no member task changed; answering or changing a member task already does                                                                                                              |
| `{ type: 'notify', task, reason }`                            | Notify a task's assignee after commit through the approval's `notify`                                                                                                                                                     |

A `task` reference is an existing task ID or `{ ref }` naming a task an earlier `open` of the same plan created. `checkPlan` refuses unknown effects, forward references and anything after `conclude` as `INVALID_EFFECT`. Error codes for `unavailable` and refusals are the `ApprovalErrorCode` union, such as `NOT_ALLOWED`, `REASON_REQUIRED`, `INVALID_INPUT`, `INVALID_TARGET`, `NOT_QUALIFIED`.

## Example: the applicant urges reviewers

This small run-level extension uses action history for a cooldown and emits only notifications. It is based on `packages/examples/app-plugin-approval-example/server/action-examples/urge.ts`; the example includes additional waiting-task checks.

```ts
import {
  ACTIONABLE,
  configureAction,
  defineApprovalAction,
  offered,
  unavailable,
  type ApprovalAction,
} from '@nocobase/app-plugin-approval/server';

export interface UrgeConfig {
  readonly cooldownHours: number;
}

export const urgeAction: ApprovalAction<
  Record<string, never>,
  UrgeConfig
> = defineApprovalAction<Record<string, never>, UrgeConfig>({
  name: 'urge',
  scope: 'run',
  actors: ['applicant'],
  guards: ['runOpen', 'activeActor'],
  defaults: { cooldownHours: 4 },
  checkConfig: ({ cooldownHours }) => {
    if (!Number.isFinite(cooldownHours) || cooldownHours <= 0)
      throw new Error('A positive reminder cooldown is required.');
  },
  available: async ({ stay, actions, config, now }) => {
    const waiting = stay.filter(
      (task) => ACTIONABLE.includes(task.status) && task.role !== 'info',
    );
    if (!waiting.length)
      return unavailable('NOT_ALLOWED', 'Nobody is waiting for a reminder.');
    const last = (await actions())
      .filter((action) => action.name === 'urge')
      .at(-1);
    return last &&
      Date.parse(last.at) + config.cooldownHours * 3_600_000 > now.getTime()
      ? unavailable('NOT_ALLOWED', 'Wait before reminding again.')
      : offered();
  },
  plan: (_input, { stay }) =>
    stay
      .filter(
        (task) => ACTIONABLE.includes(task.status) && task.role !== 'info',
      )
      .map((task) => ({ type: 'notify', task: task.id, reason: 'urged' })),
});

// Spread into each stage that permits the applicant to urge its reviewers.
export const urgeOperation = configureAction(urgeAction, { cooldownHours: 8 });
```

Add `urgeOperation` beside the stage's decision actions, for example `actions: [...DECIDE, urgeOperation]`; defining `urgeOperation` without that entry has no effect. The host must supply the approval's `notify` callback. Offer the run operation using `runActionsFor(lifecycle, recordId, actor)` and invoke `perform({ action: 'urge', target: { runId }, actor, input: {}, requestId })` through an authenticated route. Preserve the same request ID on retries. The host implements any input form, and the action's plugin may register a timeline renderer with `registerTimelineRenderer` from `@nocobase/app-plugin-approval/client`, as described in [Frontend integration](frontend.md).

Test the definition through `ApprovalService`, not only its plan function: listed versus omitted, permitted versus refused actors, offered versus unavailable state, invalid input/configuration, effects and action history, cooldown and repeated request IDs. If it concludes a run, also verify business exit and rollback; if it opens work, verify assignment rules and how that work is completed.

When a custom action creates an auxiliary task, register a separately named completion action for its recipient. The acknowledgement example pairs `acknowledge` with `confirmAcknowledgement`; the completion produces the fixed `acknowledged` answer effect and is offered only for that task kind. Do not expose a generic answer selector.

## Other extension points

Extend at the narrowest point that expresses the business:

| Need                                                 | Extension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A rule turning several answers into one stage result | A pure `StagePolicy<Options>` used through `stage.custom(policy, options, definition)`: `kind`, `outcomes(options)`, `plan({ places, options })` returning `{ placeKey, status }`, `decide({ tasks, options, event, settings })` over one task per place (with `placeKey`, `pool`, `veto`) returning `{ kind: 'open', activate? }` (placeKeys) or `{ kind: 'closed', result, data? }`, optional `answers`, `check`, `rule`. Never approve an empty task list. `itemizedPolicy` and `thresholdPolicy` are the references |
| Who receives new work (vacations, distinct signers)  | An `AssignmentRule` `{ name, apply(context) }` returning `{ kind: 'keep' }`, `{ kind: 'redirect', to, via, note }` or `{ kind: 'refuse', code, message }`; set `assignment: [...defaultAssignmentRules, rule]` on the approval, since `assignment` replaces the whole chain. `packages/examples/app-plugin-approval-example/server/action-examples/vacation-forward.ts`                                                                                                                                                 |
| Whom transfer or addSigner may choose                | `definePeopleScope({ search(context, query), contains(context, person) })`; `contains` is rechecked when the action is submitted                                                                                                                                                                                                                                                                                                                                                                                        |
| How a custom action reads in the history             | `registerTimelineRenderer(name, { title(entry, text), details?, collapsed? })` from `@nocobase/app-plugin-approval/client`                                                                                                                                                                                                                                                                                                                                                                                              |
| What the business data does at a step                | Not an action: a transition, hook or effect, as [Side effects at each step](side-effects.md) describes                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Approval example sources

The repository's example package is `@nocobase/app-plugin-approval-example` under `packages/examples/app-plugin-approval-example` (singular `approval-example`). Inspect these files when the checkout is available; the Skill's own contract and example above remain sufficient without installing the example plugin. An installed example package ships compiled server/client modules under `dist`, so use the repository for its source and tests.

| Need                                                                   | Repository source                                                                       |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Extension overview and recipe                                          | `packages/examples/app-plugin-approval-example/README.md`, “Adding an approval action”  |
| Applicant reminder with per-approval configuration                     | `packages/examples/app-plugin-approval-example/server/action-examples/urge.ts`          |
| Deadline extension with validated input, reasons and batch support     | `packages/examples/app-plugin-approval-example/server/action-examples/extend-due.ts`    |
| Remove a signer using actor/action history and validated close effects | `packages/examples/app-plugin-approval-example/server/action-examples/remove-signer.ts` |
| End a run through a business-specific exit                             | `packages/examples/app-plugin-approval-example/server/action-examples/terminate.ts`     |
| Stage registration and terminal-exit wiring                            | `packages/examples/app-plugin-approval-example/server/scenarios/collaboration.ts`       |
| Full operation tests                                                   | `packages/examples/app-plugin-approval-example/tests/action-examples/`                  |

Custom effects use `{ type: "custom", name, data }`, with a JSON object payload and an explicit `effects[name]` handler on `defineApproval`. Handlers may validate payloads with `validate(data)` and implement `execute(data, context)` using `context.transaction` and transaction-bound services. Both callbacks may be asynchronous. Unknown names and invalid payloads are refused, and custom effects cannot follow a conclusion. Execution participates in action rollback and preview rollback; use transactional outbox writes for durable external events, never send external requests directly. The handler must not write approval-owned task/run tables or bypass lifecycle transitions. Handler semantics are code: bump the approval rule version when they change.
