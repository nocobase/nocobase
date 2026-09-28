---
name: nocobase-app-plugin-workflow
description: 'Choose Workflow, typed code, or both for NocoBase 3 business rules and processes, then design, validate, operate, or diagnose source-managed workflows. Use for durable staged or branching lifecycles, persisted execution state, asynchronous or human handoffs, cross-system coordination, Workflow DSL or Artifacts, and workflow runs; not merely for atomic CRUD, calculations, or single-transaction logic.'
argument-hint: '[action: explain|define|validate|invoke|manage|inspect|diagnose] [workflow-key-or-path]'
allowed-tools: Bash, Read, Write, Grep, Glob
owner: workflow
version: 1.3.0
last-reviewed: 2026-09-07
risk-level: medium
metadata:
  domain-owner: '@nocobase/app-plugin-workflow'
  current-scope: 'applications that install the workflow package and register its ServiceProvider'
---

# Purpose

Use NocoBase 3's source-managed Workflow implementation where business behavior needs a durable, inspectable process lifecycle. Keep atomic operations, calculations, data access, and integrations in typed code, whether called directly or from a workflow `run` node. Do not invent DSL fields, node types, service methods, or runtime behavior.

The application owns workflow source packages, business services, trigger timing, authentication and authorization, business idempotency, and compensation policy. The plugin owns the DSL and core Instructions, Artifact and execution lifecycle, persisted history, management API, and diagnostic views. Use public package exports and APIs; do not bypass them through plugin internals or materialized tables.

For an initialized application, edit application-root `config.yml`; consult `config.example.yml` for supported settings.

The management pages report results through `useToaster()` from `@nocobase/app-client`, so the App needs the `@nocobase/app-client` that exports it and registers a toaster service, as the templates do: `client/lib/toaster.ts` from the template, and `this.app.container.instance(toasterToken, createToaster())` in the `register()` of `client/service-provider.ts`, with the `Toaster` component mounted in `client/react-providers.ts`. Without the registration nothing throws, but their toasts are only logged to the browser console. Update `@nocobase/app-client` together with this plugin; the `nocobase-app-upgrade` Skill's `references/edge-cases.md` ("Notifications and the application toaster") has the full steps.

# Choose the Task Path

- Before designing a new business feature, creating a workflow, or moving existing behavior into Workflow, read [Workflow Architecture Decisions](references/workflow-concepts.md) and decide whether the behavior belongs in Workflow, ordinary typed code, or a combination of both. Apply this decision even when the user did not explicitly ask about Workflow, but do not expand the requested implementation scope without a concrete architectural reason.
- For creating, editing, reviewing, or validating a workflow package, read the relevant sections of [DSL Authoring](references/dsl-authoring.md). Read the complete example only when authoring a package or when several DSL contracts interact.
- For extending node types, read [Custom Instructions](references/custom-instructions.md) for the decision criteria, public API, complete application example, async Provider registration, and shared checker/build contracts.
- For business invocation, enablement, administrator parameters, or an authorized manual run, read [Invocation and Service API](references/invocation-and-service-api.md).
- For inspecting definitions or diagnosing a run, read [Execution Diagnostics](references/execution-diagnostics.md).

Use only the path relevant to the request. Ask a question only when the target, input, business behavior, or side-effect impact cannot be determined safely from the request and available source or runtime evidence.

# Contract Discovery

- Resolve the target application's configured workflow source root instead of assuming a path. The default is `server/workflows`.
- Before using an Instruction, confirm that an installed plugin publicly exports it or the application defines it, and that the target application supplies the same contract to the source checker, Artifact builder, and runtime registry. The workflow plugin itself currently exports `ConditionInstruction`, `RunInstruction`, and `TerminateInstruction`.
- Inspect installed public exports and declarations when working outside this monorepo. Do not import plugin-internal paths from application code.
- The workflow package directory name is its stable business trigger key. A persisted definition id identifies one materialized revision for management operations; never substitute one identifier for the other.

# Author and Validate

- Keep one workflow package directly below the configured source root. Define invocation `inputSchema` separately from administrator `parameters`, and use stable, globally unique node keys.
- When updating an existing workflow's DSL (nodes, flow, configuration, or other definition fields), consider briefly noting what changed from the previous version and why in the workflow-level `description`. Preserve the workflow's purpose and replace any previous change note so only the latest update is described; see [top-level description guidance](references/dsl-authoring.md#top-level-definition).
- Bind the `defineWorkflow()` result to a `WorkflowSourceAst`-annotated const and default-export that const. A bare default-exported call does not pass the application's `isolatedDeclarations` build.
- Every node must have a non-empty `description`, including nodes in nested branches and custom Instructions. When creating or editing workflow orchestration, fill missing descriptions and keep them aligned with the node logic; follow the [node description guidance](references/dsl-authoring.md#topology-and-keys).
- Express sequencing with arrays and supported branches. Put executable work in typed `run` modules, use a named `run` export, and declare accurate result schemas for values referenced by later nodes.
- Run `pnpm nocobase workflow check <package>` before loading or publishing. It performs `typecheck`, `evaluate`, `schema`, `semantic`, and `compile` checks on `workflow.ts`; it does not validate run-script compilation or package resources. Add `--ir` to print the compiled flat IR, which is the definition an Artifact carries.
- A running development server compiles the workflow source root on demand and produces the same digest a build would, so an edited `workflow.ts` is already loadable there. Do not run a build merely to look at or exercise a definition in development; run one to produce a deployable Artifact.
- Validate run scripts and business behavior with target-application typecheck, tests, and build, then build the Workflow Artifact through the application's normal workflow build. Preserve package-relative resource paths. Artifact build, synchronization, enablement, and invocation are separate stages.
- Never author a source-managed workflow by directly editing materialized workflow tables.

# Invoke and Manage

- Business code resolves `workflowServiceToken` and calls `trigger(workflowKey, input, options?)`. The public service contract does not expose a management `run()` method or a generic public HTTP trigger endpoint.
- Use the authenticated management API for listing and inspecting definitions, enablement, parameter overrides, and authorized manual execution of a selected definition revision. A manual run may target a historical or disabled revision without changing its enablement.
- When source is available, use its directory key and `inputSchema` as the contract for new business-trigger code. In a deployed environment where only the management API is available, use runtime records for inspection and manual management; do not infer a new business trigger contract from a title or database id.
- `trigger()` returns either `skipped` with no event key or `accepted` with an event key after synchronous validation and scheduling succeed. Execution is asynchronous. Resolve the run by event key, and account for a concurrent duplicate call that can return the shared accepted identity before the first call finishes creating the run.
- An `eventKey` is optional and generated when omitted. Reuse the same stable key only when resubmitting the same business event whose acceptance is unknown; an existing run is deduplicated rather than re-executed. The public contract does not rerun a confirmed failed run by event key.

# Safety

- Treat invocation as side-effecting. Do not invoke, enable or disable, or change administrator parameters unless the request authorizes that operation.
- Confirm the exact target and input before invocation. Request additional confirmation when the operation is bulk, targets production unexpectedly, or is known to cause irreversible external effects.
- Do not place secrets in workflow definitions, parameters, input, node arguments, results, or logs. Redaction and truncation are defense in depth, not permission to include secrets.
- Do not delete or rewrite run history to recover from side effects. After inspecting the fixed run and its business effects, use only an available and authorized recovery path such as a deliberately new invocation, manual execution of a selected revision, or explicit compensation.

# Report Evidence

Report only fields relevant to the task:

- For source work: changed package/key, checks and builds run, and any unchecked runtime boundary.
- For invocation or management: operation, identifier type, receipt or resulting state, event key when present, and whether execution is still pending.
- For diagnosis: definition version/hash, run status, failing node attempt and cause, and any redaction, truncation, permission, or observability limit.
