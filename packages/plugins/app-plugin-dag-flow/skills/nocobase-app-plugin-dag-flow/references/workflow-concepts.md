# Workflow Architecture Decisions

Use this guide while designing new application behavior, even when the request does not explicitly mention Workflow. Its purpose is to choose the right boundary between process orchestration and ordinary typed code, not to force every multi-step implementation into a workflow.

## Start with the business lifecycle

A NocoBase Workflow gives one business process instance a persisted identity and an exact versioned definition. It makes the ordered path, status, timing, node results, failures, and logs inspectable across background execution and worker restarts.

Ask whether the business needs to answer questions such as:

- Where is this process instance now, which path did it take, and what happens next?
- Must ordered steps or decisions remain explicit and reviewable outside the implementation of one function?
- Must operators inspect, diagnose, retry, or compensate a process using persisted execution evidence?
- Do process-level idempotency, timeouts, version history, or durable background execution materially affect correctness?

If those are not requirements, Workflow usually adds lifecycle and operational complexity without providing a useful business capability.

Do not choose Workflow merely because implementation code calls several functions, uses a queue, writes logs, or performs more than one database query. Those are implementation details, not evidence that the business process needs its own lifecycle.

## Choose the ownership boundary

| Put in Workflow                                                      | Put in ordinary typed code or a service                         |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| Process stages, durable order, supported branches, and termination   | Atomic validation, calculations, queries, and mutations         |
| Stable node identity and process-level execution evidence            | Algorithms and data transformations                             |
| Process-level timeout, event-key idempotency, and recovery decisions | Authentication, authorization, and transaction-local invariants |
| Coordination of separately meaningful business actions               | Protocol clients and concrete external-system integrations      |

A common design uses both: Workflow owns the process path, while a typed `run` script calls an application service for each business action. Keep reusable domain logic in services rather than embedding it in the DSL or duplicating it across run scripts.

Prefer ordinary code alone when the behavior is atomic, request-bound, algorithm-heavy, or requires one transaction with no independently useful process state. Prefer Workflow plus typed code when the sequence, branch history, background durability, or operational visibility is itself part of the business requirement.

## Check that required process semantics exist

Architecture suitability is not enough; the target application must have Instruction contracts for the required control flow. The workflow plugin provides `condition`, `run`, `terminate`, and externally resumable `wait`. Other instructions are available only when an installed plugin exports them and the application supplies the same contracts to the source checker, Artifact builder, and runtime registry.

Do not simulate missing process semantics inside a long-running `run` script. Human approval, externally resumable waiting, loops, and subflows require their corresponding registered Instructions. Sending a notification can remain an ordinary Run service call; a dedicated notification Instruction is useful when workflows need a shared configuration and result contract. A `run` script can call a service or external system, but it cannot manufacture a durable pause/resume point or a new control-flow construct.

If the required Instruction does not exist:

- Keep ordinary business work in a typed service or `run` script.
- Add and register an Instruction when the missing behavior is reusable process-control semantics or a reusable operation that needs its own configuration and result contract. Follow [Custom Instructions](custom-instructions.md); ordinary one-off business actions stay in Run modules.
- Redesign or defer the workflow when the required lifecycle cannot be represented safely.

## Produce a decomposition before authoring

For a new feature or a migration from code, identify enough of the following to make the boundary explicit:

1. The business event that creates one process instance and the identity used for retries.
2. The per-invocation input versus administrator-tunable parameters.
3. The durable stages and supported branch decisions that belong in Workflow.
4. The atomic business actions that remain in typed services or `run` scripts.
5. Side effects and their idempotency, transaction, retry, and compensation boundaries.
6. Results that later nodes need and the operational evidence required for diagnosis.

Do not require every detail before beginning when it can be derived safely from the existing application. Surface the chosen Workflow/code boundary and any unsupported process semantic that materially changes the design.

## Examples

| Requirement                                                                  | Decision                                                                                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Validate input and create one record in a transaction                        | Ordinary typed service                                                                                             |
| Calculate a score, persist it, and return it within one HTTP request         | Ordinary typed code unless the business needs a durable process record                                             |
| Run durable fulfillment stages, branch on risk, and retain execution history | Workflow for orchestration; typed services or `run` scripts for fulfillment actions and risk scoring               |
| Wait for a person to approve and resume days later                           | Workflow `wait` can hold the process; application code owns approval decisions, authorization, and the resume call |
