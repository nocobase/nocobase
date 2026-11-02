---
title: 'Extensions'
description: 'Integrate and extend approval policies, operations, interfaces, deadlines, and reliable execution.'
---

# Extensions

This page is for developers and Agents who need integration and extension boundaries. For business design, start with [Approval overview](./index.md). Use the installed approval plugin's Skill and version for detailed API contracts.

## Integrate existing records and processes

One request record identifies the complete process. `defineApproval` defines drafts, review, correction, execution, and final stages; `approvalState` adds group handling rules to a business state. Each entry creates tasks for a new round. Return and re-entry creates new tasks while preserving earlier records.

The application provides its lifecycle runtime, business tables, lifecycle storage, organization services, authentication/authorization APIs, and interface. Plugin migrations supply approval task and evidence storage. Restrict forms, imports, and APIs that directly change states or submitted fields. Contract changes and similar proposals should store requests separately from official data.

## Custom aggregation policies

Standard policies cover single, all, any, first-response, sequential, and threshold decisions. Special itemized or partial results use `StagePolicy`: declare task planning, possible outcomes, and exits. The policy calculates conclusions; the business lifecycle performs data writes.

## Custom operations and assignment rules

Use `defineApprovalAction` for abstention, returning individual items, reminders, or other business operations, explicitly registered on the relevant stages. Declare input, permissions, recipient scope, presentation, and history wording, with forms and tests. Recheck responsibility rules after transfers, added reviewers, appointment, and reassignment.

## Frozen content, outputs, and opinion reuse

`freeze` declares submitted fields. Confirmations carry the hash of the content displayed on the page. Stage outputs declare reviewer-entered amounts, dates, and similar values; write these with the business state when the conclusion is reached.

Re-entry requires fresh review by default. `reuse: 'unchanged'` reuses earlier opinions only when explicitly permitted and covered content, rule version, responsibility identities, and other conditions match. New tasks retain source evidence.

## Pages and approval centers

| Contract                            | Purpose                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `previewRoute`                      | Route preview before submission                                            |
| `runViewsFor` / `upcomingStagesFor` | Current and historical rounds, and future stages                           |
| `actionsFor` / `runActionsFor`      | Current user's task or round operations                                    |
| `candidatesFor`                     | Qualified candidates for transfer, added reviewers, and similar operations |
| `perform` / `performBatch`          | Individual actions and batch handling with per-item results                |
| `tasksOf`                           | Task aggregation; APIs still need business authorization                   |

The UI Library's `approval-ui` supplies progress, timeline, route preview, action bar, branch, and receipt components. The Agent maps server data into them; business forms and pages belong to the application. Approval centers can include other work sources, each independently authorizing reads and actions.

Administrative pages also belong to the application. Query requests, tasks, and execution records within the administrator's business scope and expose authorized appointment and reassignment. Redispatch or process reset requires business recovery exits and rules for earlier rounds; the Agent then implements administrative APIs and pages. Directly changing a state field is not a substitute for lifecycle operations.

## Notifications, deadlines, and reliable execution

The application periodically calls `ApprovalService.sweep()` for reminders, escalation, and claim expiry. `calendar` can provide working time. Connect sweeps to lifecycle background work; notifications and external calls execute after transaction commit. Partial opinions update approval tasks only. The final conclusion, business state, and next-stage tasks share a transaction.

Resource reservation/release and official data version checks belong in the business transaction. External payments, registrations, and synchronization use reliable lifecycle execution with retries, failure exits, and stable business identifiers.

## Rule versions, upgrades, and tests

Apply application migrations on upgrade, manage rule versions explicitly, and retain stages and exits used by ongoing requests. Test custom policies, operation permissions, conclusion rollback, reuse, repeated requests, concurrency, and deadlines. Test external success, explicit rejection, temporary failure, and unknown outcomes.

## Where to find extension examples

The approval example package's `server/action-examples/` contains the following extensions using public approval plugin exports. They do not appear automatically when the core plugin is installed. Register them explicitly in a business stage's `actions`, and implement forms and history wording.

| Example               | Purpose                                | Business constraints                                                   |
| --------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `urge.ts`             | Applicant reminder                     | Authorization and cooldown; notification does not change opinions      |
| `remove-signer.ts`    | Remove an added reviewer               | Only removes responsibilities the actor added, as configured           |
| `retract.ts`          | Retract an individual opinion          | Original task retains its opinion; a new task takes the fresh response |
| `terminate.ts`        | End a round                            | Explicit authorization and declared business ending exit               |
| `extend-due.ts`       | Extend deadlines                       | Changes deadlines only; declares batch support                         |
| `acknowledge.ts`      | Request and complete acknowledgement   | Paired completion operation for an auxiliary task                      |
| `abstain.ts`          | Committee abstention                   | Separate operation name; abstention is not approval                    |
| `return-item.ts`      | Return an expense line                 | Per-line outcomes and recovery rules                                   |
| `vacation-forward.ts` | Forward an absent manager's assignment | Assignment rule rather than a user operation                           |

### Integrate a custom operation

1. Define it with `defineApprovalAction()`, declaring actors, guards, availability, presentation, and effects returned by `plan()`. Do not write to the database inside planning.
2. Register it on relevant stages. Conclusion operations declare `outcomes`; the business lifecycle provides matching `approvalOutcome` exits.
3. For material or acknowledgement tasks, register a separate completion operation for recipients and define visibility and completion authority.
4. Integrate server authorization, input validation, and `perform()`. Pages use offered operations, candidates, and configuration from the server.
5. Add forms and wording in both languages. Use `registerTimelineRenderer()` for history rendering where needed. Test availability, refusal, tasks, and history changes.

### Assignment and responsibility seats

`assignees` creates one opinion per person, `subjects` one per line, and `pools` one per responsibility seat. Choose exactly one. If legal and finance teams each give one opinion, declare two pools and aggregate with `all`; do not treat every team candidate as a required voter. A pool with one candidate remains a team seat.

Default assignment rules check active status, delegation, applicant exclusion, qualifications, and duplicate responsibility. Transfers, added reviewers, and reassignment are also checked. Transfers and added reviewers require recipient scopes. Replacing the whole assignment chain assumes responsibility for all these constraints; usually compose business rules with the defaults.

### Consistency and retries

The final opinion, round closure, business transition, and next-stage tasks should share one transaction. External calls execute after commit; do not perform bank payments directly within the approval transaction. `perform()` uses a stable `requestId`, with retries retaining action, identity, and target. `performBatch()` returns success or failure per item rather than using one transaction for all requests.

Submit the hash of content displayed on the page with the opinion. Do not silently fetch the newest hash when the user approves, hiding content they have not reviewed. Attachment replacement, related data versions, and historical form reconstruction need additional business storage and validation contracts.

### Background time rules

In the Provider that creates the lifecycle runtime, connect `createLifecycleJobs()`: `onSweep` calls approval `sweep()` and lifecycle `prune()`, while effects also run through jobs. The plugin starts no timer itself. Multi-process production applications should use shared jobs storage so each process does not run an independent memory queue.

The current contract example provides working time in UTC+8, Monday–Friday 09:00–18:00, used for manager deadlines and procurement claim expiry, without a holiday table. The lab sweep processes tasks already due; it does not advance time. Use a controlled clock for precise timeout boundaries. Shared pause and handover deadline rules still need business decisions.

Applicant recusal is enabled by default. When business authorization explicitly permits self-approval, set `allowSelfApproval: true` on the relevant stage, for example a budget owner confirming their own purchase before independent finance review. This permits an eligible applicant to decide manually, including through delegation; it does not auto-approve or skip the stage, and other assignment rules and action permissions still apply. The applicant is the identity returned by `applicant(record)`, which may differ from a proxy submitter. Do not replace the entire assignment chain to enable this policy.
