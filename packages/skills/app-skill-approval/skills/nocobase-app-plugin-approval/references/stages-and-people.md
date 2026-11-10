# Stages and people

## Pick the decision policy

Use `const stage = stagesFor<BusinessTypes>()`. The standard application lifecycle orders and routes approval states; a policy coordinates people within one state. Parallel reviewers who jointly decide one result usually belong in one `all` stage, not independent business states.

A stage holds **places**: decisions that each come to one conclusion. A policy adds the places up. Every helper except `single` takes its places from exactly one of three sources — the type is a union and the definition is checked again at runtime:

| Places come from        | One place per            | Who decides it                                                      |
| ----------------------- | ------------------------ | ------------------------------------------------------------------- |
| `assignees(context)`    | person chosen            | That person                                                         |
| `subjects(context)`     | line, `{ subject, ... }` | The line's `assignee`                                               |
| `pools: [{ key, ... }]` | pool, in declared order  | Whichever of the pool's `candidates` holds it (see [Pools](#pools)) |

| Business requirement                | Helper                                      | Configuration and result                                                                                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One designated reviewer             | `stage.single`                              | `assignee(context)`; approve passes, reject ends                                                                                                                                                                                                            |
| Everyone must agree                 | `stage.all`                                 | `onReject: 'immediate'` by default, or `'collect'` to gather every place's answer before rejecting                                                                                                                                                          |
| Any approval is sufficient          | `stage.any`                                 | One approval passes; rejection only once every place has answered without approval                                                                                                                                                                          |
| First answer decides                | `stage.first`                               | The first approve **or reject** decides; differs from `any`. One pool with `stage.first` is a team queue                                                                                                                                                    |
| Committee vote                      | `stage.threshold`                           | Positive integer `min`, optional `abstain`; abstention is cast but never an approval. A pool with `veto: true` is a veto seat. `waitForAll: true` waits for every place's answer even once the result is settled; by default the vote ends as soon as it is |
| Reviewers act in order in one stage | `stage.sequential`                          | Places in plan order (people in `assignees` order, or pools in declared order); the first starts, the others wait; one rejection rejects                                                                                                                    |
| Business-specific aggregation       | `stage.custom(policy, options, definition)` | Pure `StagePolicy` with `plan`, `decide` and `outcomes`, optional `answers`, `check`, `rule`; the policy returns decisions, never writes. See the custom policy notes below                                                                                 |

For per-line expenses, use `stage.custom(itemizedPolicy, { partialSetting: 'allowPartial', returnTarget: 'revision' }, { subjects, actions, ... })`. `subjects(context)` returns `{ subject, assignee, data }` per line; include `amountCents` for monetary limits. Declare standard outcome exits for the policy’s partial result and its configured `returnTarget`; store per-line results from `input.result`. An approver approving less than a line claims answers with `data: { approvedCents }`, which the stage declares as `outputs: { fields: { approvedCents: z.number().int().positive() } }`. Register separately named custom actions for nonstandard answers, such as `abstain` or `returnItem`; each produces its fixed answer effect.

## Pools

A pool is one place several candidates may take: a seat on a committee, a team's queue, "someone from legal". Declare each pool on the stage:

```ts
stage.all({
  pools: [
    {
      key: 'legal',
      title: 'Legal',
      candidates: ({ services }) => services.org.holders('legal'),
      claimable: true,
    },
    {
      key: 'finance',
      title: 'Finance',
      candidates: ({ services }) => services.org.holders('finance'),
      claimable: true,
    },
  ],
  actions: [
    claimAction,
    releaseAction,
    assignAction,
    approve(),
    reject() /* ... */,
  ],
});
```

- Whether a place is a pool depends only on the declaration, never on how many candidates it has today: a pool with one candidate still offers `claim`, `release` and `assign`. `assignees: [a, b, c]` is three ordinary places; `assignees`, `subjects` and `pools` are mutually exclusive.
- `key` is required and unique within the stage; `title` is optional. Pool keys name the pools in results (`input.result.pools[key] = { outcome, by }`), in the read model (`StageView.pools`, `ApprovalStep.pools`) and in `appoint`'s offer.
- `claimable: true` (default false) means a candidate must claim the pool before answering, and requires `claim` among the stage's actions. Without it the first answer decides, and a candidate may still claim the pool to hold it.
- Inside a pool the rules are fixed: a claim suspends the pool's other candidates; a release or a claim timeout gives them their turn back; the first answer by a planned member closes everyone else's task in that pool. The pool's conclusion is its holder's answer merged with that holder's signers — a signer after still pending leaves it undecided, a signer's rejection is the pool's rejection. A transfer, a delegation or a reassignment keeps the place, so the new holder holds the pool and its veto. Releasing or closing the holder closes the signers the holder added. Other pools are never touched.
- There is no aggregation inside a pool. For a countersignature within a group, declare several places instead.
- `veto: true` marks a veto seat. `threshold` rejects at once when a veto place rejects, and once `min` approvals are in it still waits for every veto place to answer; an abstention waives the veto. It never waits for a veto place when `min` can no longer be reached. With `waitForAll: true` none of these end the vote early: it waits for every place to answer, then decides by the same rules. A member added `alongside` someone is an extra vote of their own, never a veto.
- Seat holders are configuration: read who sits in a seat from a table an administrator maintains (through `services`), with one fixed person per seat or several candidates who claim it. Never pick "one person at random from the pool" in `candidates`; the stage records each pool's screened candidates (`plannedFor`) in its `stage.planned` event, which is what makes a decision reproducible.
- A pool all of whose candidates are refused by the assignment rules is an unassigned place: `onEmpty` decides between refusing entry and holding it for `appoint`. With several unassigned places, `appoint` requires `place`, the `placeKey` its offer lists.

## Select people from the host

`assignee`/`assignees`/`candidates` receive the record under review, submitted parameters, rule `version`, `applicantId`, `directory`, host `services`, lifecycle time `at` and explanation `notes`. Return stable person IDs from the application's organization services. `holders()`/`holderOf()` are example host methods, not plugin APIs; implement or use the application's actual service. `ApprovalDirectory` provides `isActive`, `managerOf`, `hasRole`, optional `delegateOf` and optional paged `searchPeople`.

Use `await managerChain(directory, applicantId, levels, notes)` for hierarchy review; it skips inactive managers and detects loops. The default assignment rules are `skipInactive`, `delegation`, `excludeApplicant`, `qualification`, `dedupe`. They apply to new planned tasks and operation-created tasks. By default applicants cannot decide their own requests; when initial selection leaves only the applicant — of the stage, or of one pool — selection attempts their manager. A proxy delegate may answer the principal's task; forwarding delegates receive new tasks. Do not replace these rules merely to make a fixture pass; an explicit `assignment` replaces the whole chain.

Choose applicant recusal from the business requirements rather than treating it as an unconditional restriction. For an authorized budget owner confirming their own request before independent finance review, set `allowSelfApproval: true` on that stage, for example `stage.single({ assignee: ({ record }) => record.budgetOwnerId, allowSelfApproval: true, actions: [approveAction, rejectAction] })`. Keep the default for stages requiring independent review. The applicant is the identity returned by `applicant(record)`, which may differ from a proxy submitter. This setting permits a manual decision; it does not auto-approve or skip the stage, waive qualification or recipient scopes, or alter later stages. Use this field instead of removing `excludeApplicant` or replacing the assignment chain. Verify initial assignment (including pools and subjects), transfers/added signers, delegation and the remaining independent review stages. When synchronizing or backfilling personal tasks without the dependency coordinator, pass `allowSelfApproval: (stage) => approval.stage(stage).allowSelfApproval === true` in the contribution context so applicant delegates receive their pending tasks.

| Stage field                                  | Meaning                                                                                                                                                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allowSelfApproval: true`                    | Explicitly allow the applicant to decide in this stage, including as a proxy or forwarding delegate; default false. Other eligibility checks and action permissions still apply.                                                          |
| `onEmpty: 'hold'` / `'refuse'`               | Hold for administrator appointment (default with `adminRole`), or refuse entry (default without it); explicit hold requires `adminRole`                                                                                                   |
| `qualification`                              | Required role for the stage's original members and replacements; does not constrain invited signers by itself, so also scope signer recipients                                                                                            |
| `mergeDelegated: true`                       | Keep one task when several candidates of one pool forward to the same person, and note the merge; places are never merged, so a person refused a second place leaves it to `onEmpty`                                                      |
| `reuse: 'unchanged'` or a business predicate | Explicitly reuse unchanged covered approvals on fresh tasks, with source run/task evidence; default re-entry requires new decisions                                                                                                       |
| `covers`                                     | Frozen fields the stage's approval covers; defaults to all `freeze` fields                                                                                                                                                                |
| `remindAfterHours` / `dueAfterHours`         | Set task clocks, in working hours on the approval's `calendar` or natural hours without one; the sweep reminds and runs `onDue: 'escalate'`                                                                                               |
| `outputs`                                    | Fields the stage's deciders fill in with an answer, merged into the exit transition's `input.outputs` and written to the record by `writes`; without it answers take no `data`. See [Side effects](side-effects.md#what-deciders-fill-in) |

The default `dedupe` rule lets a person hold one whole-record decision per stay; per-subject decisions are each their own. Pools are filled in declared order, so a person who is a candidate of two pools is kept by the first and refused by the later one — the order of `pools` decides which pool keeps a shared candidate, and a later pool whose only candidate was taken waits for `onEmpty`. Each refusal is logged as a `stage.note` with the pool, the candidate and the rule. Declare seats with `pools`, not with `subjects`. If the business also requires distinct signers after transfer, assignment or forwarding delegation, add a business `AssignmentRule` alongside the defaults that refuses already-held or completed responsibilities, and test those handover paths.

For native approvals, express a deliberate no-review path as a guarded standard transition/route to the next business state. Resolve people on each state entry. A stage with no eligible people remains blocked or refuses entry; it is not the same as a deliberately excluded stage.

## Custom policies

A `StagePolicy` sees places, not people. `plan({ places, options })` receives each place's `placeKey`, `order`, `subject`, `pool` and `veto`, and returns `{ placeKey, status: 'pending' | 'waiting' }` for the places it wants to start differently (a place left out starts `pending`; a pool's candidates start `candidate` when it is claimable). `decide({ tasks, options, event, settings })` receives one `PolicyTask` per place — a pool as its holder, or as the place itself while nobody holds it — plus one per member added `alongside` (with `placeKey: null`, `pool: null`, `veto: false`), and an `unassigned` task per place nobody holds. It returns `{ kind: 'open', activate?: placeKey[] }` or `{ kind: 'closed', result, data? }`. Claims and releases are the kernel's: a policy receives `changed` for them. `check` sees the same view. `decide` must never approve an empty list.

Use a concrete state union in `BusinessTypes['state']`. With several named stages, define a dictionary typed as `Partial<Record<BusinessTypes['state'], StageDefinition<BusinessTypes>>>`, and spread `...approvalStates<BusinessTypes>(stages)` into `states`; names are checked and appear once. Custom policies must declare `outcomes(options)` for definition-time route validation. `itemizedPolicy` requires an explicit application `returnTarget`.

Directory point lookups (`isActive`, `managerOf`, `hasRole`, `delegateOf`) accept synchronous or asynchronous adapters. Always await them in host rules. `AssignmentRule.apply` may be asynchronous; `runAssignment`, `managerChain` and `ActionContext.eligible` now return promises. Kernel queries are memoized within a transaction or coordinated dependency snapshot; the next transaction reads fresh values. Create a lazy adapter over the transaction connection instead of preloading the organization. Task Center projections still require local, versioned dependency data behind their source fence.
