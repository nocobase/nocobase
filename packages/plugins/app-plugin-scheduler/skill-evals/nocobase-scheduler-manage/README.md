# Scheduler Skill Behavioral Evaluations

This development-only suite evaluates whether an agent using `nocobase-app-plugin-scheduler` makes correct implementation and operational decisions. Each case uses the `version`, `skill`, `cases`, `risk`, `skillMode`, `preconditions`, `prompt`, `expected`, and `forbidden` format. The package's `files` allowlist excludes `skill-evals` from npm output. Keep evaluation rubrics outside the published Skill and outside the tested agent's workspace.

## Current execution support

The 18 cases in [prompts.yaml](prompts.yaml) are ready for manual agent evaluation. They are not connected to an automated runner, and their presence does not mean an agent has passed them.

A future runner should provide isolated per-case workspaces, private expected/forbidden rubrics, explicit versus implicit Skill loading, bounded agent turns, and response/error reports, with Scheduler-specific application fixtures and authenticated HTTP access. It must preserve source-only versus runtime execution scopes. Runner completion means a response was collected, not that the response passed its rubric.

## Coverage and required evidence

| Cases                                           | What is evaluated                                                                                                | Evidence                                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `implicit-*` (3)                                | Discovery, administrator visibility, internal maintenance, one-time delay                                        | Selection trace and final recommendation                                               |
| `define-short-target`, `implement-async-report` | Public exports, Provider wiring, validated definitions, JobExecutor completion and recovery                      | Source diff, actual validation output, behavioral tests                                |
| `review-*` (6)                                  | Definition contract, secrets, asynchronous outcomes, deduplication, API and permission boundaries                | Reasoned review matching installed contracts                                           |
| `diagnose-*` (4)                                | Missing registration, memory jobs adapter on several instances, historical target ownership, sync-only lifecycle | Evidence-based diagnosis without mutation                                              |
| `partial-manifest-finalize`                     | Complete-manifest reconciliation boundary                                                                        | Correct explanation and no production action                                           |
| `runtime-*` (2)                                 | Actual trigger visibility, terminal outcome, disable preservation, removal and history                           | Sync output, authorized API/UI observations, local business result and process cleanup |

## Manual evaluation procedure

1. Select a case and create a fresh disposable application workspace. Use the current application template and installed package versions; do not use the actively edited source worktree as the evaluation workspace. Record the source commit, dirty diff snapshot or hash, Skill snapshot, agent/model, case id, and start time so evaluations of this evolving branch remain comparable.
2. Prepare every listed precondition before starting the tested agent. Source-only cases need a complete application that can lint, typecheck, test and build without startup. Runtime cases need an independent migrated local database, a local `jobs` configuration (the memory adapter, or a disposable Redis for multi-instance cases), controlled business output, test users and permissions, and the complete manifest. Do not share databases, workers, ports or credentials across cases. If a precondition cannot be provided, mark the case blocked; do not replace runtime evidence with invented output.
3. Provide neutral fixture context describing paths, commands, test credentials and allowed resources. Keep `expected`, `forbidden`, this coverage table and other cases inaccessible to the agent. For explicit cases, provide the Skill entrypoint and its referenced files plus the prompt. For `skillMode: implicit`, install the Skill under the application's `.agents/skills/` directory and send only the natural-language prompt and neutral context; do not name or inject the Skill. Keep relevant neighboring skills available to measure routing rather than forced selection.
4. Execute one fresh agent session per case. Read-only cases must not mutate application or runtime state. `isolated-source-mutation` permits only local source and validation artifacts, not startup or synchronization. `side-effecting` permits only the explicitly described disposable runtime operations. Configure a finite turn timeout (for example ten minutes for source implementation); the short runtime observation case additionally limits trigger waiting to 60 seconds. Stop local processes and retain evidence before removing the workspace.
5. Capture the final response, tool/command trace, exit codes, source diff, test output and runtime observations as applicable. For implicit cases record whether the Skill was selected/read where the agent platform exposes that trace; a correct answer alone cannot prove discovery. Grade privately against every expected and forbidden item. Do not provide corrective hints during a scored run.
6. Record each expected item as pass, fail or not observable, and each forbidden item as observed or absent. A case passes only when all expected items have evidence and no forbidden behavior occurs. Missing fixture/tool prerequisites are blocked; a timeout is an execution error; unsupported claims or incorrect behavior are failures. Report these counts separately rather than removing blocked cases from the denominator without explanation.
7. After a demonstrated Skill defect, make a focused documentation correction and rerun the failing case plus adjacent cases. For broader evaluation, compare the same model and fixture snapshots with and without Skill availability in separate fresh sessions, and repeat nondeterministic cases. Do not call a single successful response a reliable pass rate.

A result record should include `caseId`, `skillMode`, `model`, `sourceSnapshot`, `skillSnapshot`, `fixtureDescription`, `startedAt`, `durationMs`, `response`, `tracePath`, `diffPath`, `checks`, `expectedResults`, `forbiddenResults`, `verdict`, and `limitations`. Keep test credentials out of saved reports. For runtime cases, record actual occurrence status and business outcome separately from synchronization and dispatch receipts.

## Product tests versus Skill evaluations

The existing Scheduler tests verify runtime contracts; they do not measure whether an agent discovers the Skill or follows it. Use them as an implementation oracle when grading generated source, without exposing their intended answers as prompt hints. `tests/schedules.test.ts` covers definition and target contracts; `tests/scheduler-service.test.ts` covers imperative registration; `tests/store.test.ts` covers reconciliation, counters and scheduling; `tests/jobs.test.ts` covers occurrence ownership, completion races and recovery; `tests/routes.test.ts` and `tests/client-page.test.tsx` cover access and presentation.

When generated application code changes, run that application's relevant lint, typecheck, test and build commands and report their actual results. When changing the plugin implementation itself, run from the repository root:

```bash
pnpm --filter @nocobase/app-plugin-scheduler check
```

Run affected consumer checks when public contracts change. Product test success cannot substitute for real worker execution and administrator UI evidence in runtime cases. A browser-unavailable run can report API evidence, but must leave UI observability unverified.
