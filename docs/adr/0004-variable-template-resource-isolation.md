# Variable templates use a strict expression subset for resource isolation

- Status: accepted
- Decision date: 2026-08-02
- Decision owner: Flow Engine maintainers
- Implementation owner: the maintainer assigned to the follow-up `plugin-flow-engine` server PR

## Context

Server variable templates are evaluated by `POST /api/variables:resolve` in both single-item and batch form. The action is available only to logged-in users. The same evaluator is also exported for trusted server callers as `resolveVariablesTemplate` and `resolveVariablesBatch`; those calls have no HTTP login boundary. ACL checks, record prefetching, and static `ctx` path authorization happen before evaluation.

SES `Compartment` isolates object capabilities: it removes ambient Node capabilities and, together with the guarded `ctx` proxy, prevents template code from calling context functions or reaching blocked prototype keys. It does not isolate CPU or memory. Evaluation currently runs on the Node main thread and the analyzer permits user functions, IIFEs, loops, and calls not derived from `ctx`, so a synchronous loop can stop the process:

```js
{{ (() => { while (true) {} })() }}
```

`Promise.race`, an `AbortSignal`, or an HTTP/request timeout cannot interrupt JavaScript that never yields. They can reject a waiting caller only after the event loop runs again, so none is resource isolation and none is an acceptable fix.

In a single-process deployment, one such expression can stop the whole application. In a clustered or multi-process deployment it stops one process at a time, but repeated logged-in requests can consume every process; per-process concurrency budgets also multiply by the process count. Login is a useful abuse threshold, not a resource boundary. Configure-capable roles and trusted internal callers therefore receive the same syntax and size limits as ordinary logged-in callers.

## Decision

Use **Option A: a strict AST expression allowlist**, enforced before record prefetch or `Compartment.evaluate`. Keep SES as defense-in-depth for capability isolation. Do not add a partial worker executor in this PR.

This is the smallest enforceable design for variable templates: their intended job is interpolation and small value transformations, not general JavaScript. Removing statements, user-defined functions, and arbitrary calls eliminates the constructs needed for loops and recursion while retaining common templates. Length and AST limits bound parsing and allocation amplification, but they do **not** independently solve synchronous CPU exhaustion; the syntax restriction is the resource-isolation control.

### Allowed grammar

The follow-up implementation must fail closed. Source AST nodes are limited to:

- `Literal` for string, finite number, boolean, and `null`; RegExp and BigInt literals are forbidden.
- `Identifier` only as the `ctx` root, `undefined`, or the `Math` object in an allowed member/call position. Bare `ctx` remains forbidden.
- `MemberExpression`, `ChainExpression`, and `ParenthesizedExpression` with static identifier, string-literal, or non-negative integer-literal keys. They may read an authorized `ctx` path, a listed `Math` constant, or an own data property of an array/object literal constructed by the expression. `__proto__`, `prototype`, and `constructor` are forbidden everywhere. Existing optional and dashed-key `ctx` path compatibility remains supported.
- `ArrayExpression` without holes or spreads, and `ObjectExpression` containing only non-computed `Property` entries with `init` values. Methods, getters, setters, computed keys, spreads, and duplicate blocked keys are forbidden.
- `UnaryExpression` with `!`, `+`, `-`, `~`, or `typeof`.
- `BinaryExpression` with `+`, `-`, `*`, `/`, `%`, `**`, `<`, `<=`, `>`, `>=`, `==`, `!=`, `===`, `!==`, `|`, `&`, `^`, `<<`, `>>`, or `>>>`. `in` and `instanceof` are forbidden.
- `LogicalExpression` with `&&`, `||`, or `??`; `ConditionalExpression`; and `TemplateLiteral`/`TemplateElement`.
- `CallExpression` only for a direct, non-computed call to one of these exact `Math` functions, without optional calls or spread arguments: `abs`, `acos`, `acosh`, `asin`, `asinh`, `atan`, `atanh`, `atan2`, `cbrt`, `ceil`, `clz32`, `cos`, `cosh`, `exp`, `expm1`, `floor`, `fround`, `hypot`, `imul`, `log`, `log10`, `log1p`, `log2`, `max`, `min`, `pow`, `random`, `round`, `sign`, `sin`, `sinh`, `sqrt`, `tan`, `tanh`, and `trunc`. Read-only `Math` constants are limited to `E`, `LN10`, `LN2`, `LOG10E`, `LOG2E`, `PI`, `SQRT1_2`, and `SQRT2`.

All other nodes and operators are forbidden, including `ArrowFunctionExpression`, `FunctionExpression`, declarations, blocks/statements, all loop nodes, `SequenceExpression`, assignment/update/delete, `AwaitExpression` in user source, `YieldExpression`, classes, `NewExpression`, `TaggedTemplateExpression`, imports, and meta properties. All user-defined functions, IIFEs, recursion constructions, `eval`, `Function`, constructors, and non-allowlisted calls are rejected before execution. Compiler-generated `await __resolveVariablePath(...)` is internal output and is not accepted in user source.

### Compatibility consequences

- Static `ctx` paths, optional/static bracket access, literals, arrays/objects, template literals, operators, and conditional expressions remain supported when every branch is in the allowlist.
- Existing `Math.max(ctx.record.score, 0)`-style expressions remain supported through the exact callable list above.
- IIFEs and user functions become hard errors. Templates using them must be rewritten as an allowed expression or moved to RunJS/workflow code.
- RegExp method calls such as `/x/.test(value)` and all other method calls become hard errors. There is no compatibility exception that silently restores arbitrary calls.
- Unsupported HTTP input returns `422 VARIABLE_EXPRESSION_NOT_ALLOWED` with batch index, template path, source span, and rejected node/operator/callee. Batch validation is atomic: one invalid item prevents every item from executing. Trusted server helpers throw the corresponding typed error. Authoring/model analysis reports the same diagnostic before runtime.

## Resource budgets

All byte counts are UTF-8 byte lengths. Template bytes are the UTF-8 length of the JSON serialization of template values, including keys but excluding `contextParams`. The limits apply at the shared analyzer entry point so HTTP and internal callers cannot bypass them. HTTP rate limiting is the only HTTP-only control.

| Resource | Limit and scope | Failure behavior |
| --- | --- | --- |
| Template total | 64 KiB (65,536 bytes) across all templates in one single or batch invocation | Reject before parsing/prefetch with `413 VARIABLE_TEMPLATE_LIMIT_EXCEEDED`, dimension `templateBytes` |
| Single expression | 4 KiB (4,096 bytes), excluding `{{` and `}}` | Reject that invocation with the same `413` code, dimension `expressionBytes` |
| Batch items | 100 per invocation | Reject the entire batch with the same `413` code, dimension `batchItems` |
| Placeholders | 64 per item and 256 per invocation | Reject the entire invocation with the same `413` code, dimension `placeholders` |
| AST nodes | 256 per expression and 4,096 per invocation | Reject before evaluation with the same `413` code, dimension `astNodes` |
| AST depth | 32 per expression, with the root at depth 1 | Reject before evaluation with the same `413` code, dimension `astDepth` |
| Serialized output | 64 KiB per item and 256 KiB (262,144 bytes) per invocation | Stop serialization and return `413 VARIABLE_TEMPLATE_OUTPUT_TOO_LARGE`; do not return a partial batch |
| In-flight resolution | 16 invocations per Node process; no queue | Return `429 VARIABLE_TEMPLATE_BUSY` with `Retry-After: 1` |
| HTTP rate | Token bucket per authenticated user and Node process: 60 invocations/minute, burst 20 | Return `429 VARIABLE_TEMPLATE_RATE_LIMITED` with `Retry-After` |

RunJS permits 64 KiB per source, 256 KiB total, and 100 sources because it is an explicit code-authoring surface. Variable resolution is called during ordinary UI interactions and can run repeatedly for many small templates, so its aggregate input is deliberately lower (64 KiB), while retaining the existing 100-item batch ceiling. These budgets are initial operational values, not claims that size limits can terminate code.

With multiple Node processes, the 16-in-flight and 60/minute limits are per process, so cluster capacity and worst-case load are multiplied by the number of processes. Operators must size process count accordingly and dashboards must display both per-process and summed rates. Moving HTTP rate state to a shared store is not required for the first strict-grammar implementation because the grammar removes unbounded execution; it becomes required if arbitrary executable syntax is ever restored.

## Rejected alternative: terminable process isolation

Option B remains the required design if future compatibility requires user functions or arbitrary calls. A Promise timeout or `worker.terminate()` call without awaiting worker exit is insufficient. The acceptable contract is a killable child-process pool:

- The parent performs ACL authorization and resolves every statically authorized `ctx` path first. The child receives only structured-clone/JSON-serializable expression source and a null-prototype map of those resolved values. It receives no request object, database handle, credentials, functions, promises, proxies, or live `ctx` reference.
- Each item has a 100 ms hard wall-clock deadline and a 50 ms CPU budget. The child reports `process.cpuUsage()` after each item and is recycled when the item or cumulative worker budget is exceeded. A non-yielding item is always stopped by the independent 100 ms parent timer.
- Each child has an OS-enforced 64 MiB RSS ceiling, plus Node limits of 32 MiB old generation, 8 MiB young generation, and a 1 MiB stack. An OOM or limit breach kills and replaces the child.
- Input, batch, placeholder, AST, depth, and output limits remain exactly those in the table above. The child protocol refuses messages or output frames larger than 256 KiB.
- Each Node process has at most four children and a queue of 32 invocations. Queue overflow returns `429`; the same 60/minute, burst-20 HTTP rate applies. A multi-process deployment creates four children per Node process and must include their RSS in capacity planning.
- Request cancellation removes queued work. If work is running, the parent sends `SIGKILL` (or the platform-equivalent forced termination), waits for the child `exit`/`close` event, discards the child, and only then completes cancellation. A wall timeout, CPU overrun, OOM, malformed protocol frame, uncaught error, or 100 completed items also retires the child.
- Runtime acceptance must execute a malicious synchronous infinite loop, observe the operating-system process exit rather than only a rejected Promise, and then resolve a healthy request successfully on a replacement child.

This option was rejected as the primary design because process startup/pooling, cross-platform hard memory enforcement, serialization, and pre-resolution add latency and operations work to a high-frequency interpolation path. It also preserves a general JavaScript compatibility promise that variable templates do not need. It must be implemented in its own ADR and PR if the strict subset proves insufficient.

## Rollout, monitoring, and rollback

1. Before enforcement, scan persisted Flow Models and emit authoring diagnostics for expressions outside the allowlist. For one release, count rejected node types/callees and affected model UIDs without logging expression text, resolved values, credentials, or record data. Notify administrators through the upgrade report and server warning that IIFEs, user functions, RegExp methods, and arbitrary calls must be migrated.
2. Ship budgets and the strict preflight together in the follow-up PR. There is no phase in which only a timeout is claimed as protection. Keep current SES guards and existing path/ACL authorization tests.
3. Monitor rejection counts by reason, input/output limit hits, per-process in-flight count, rate-limit hits, p50/p95/p99 analysis and evaluation duration, event-loop delay, and process RSS. Alert on sustained `VARIABLE_EXPRESSION_NOT_ALLOWED`, any event-loop delay over 200 ms for five minutes, or RSS growth after resolution traffic.
4. Roll back a bad compatibility release to a safe **path-only mode** that resolves only a single static authorized `ctx` path and otherwise leaves the placeholder unchanged. Do not roll back to legacy general evaluation. Trigger rollback if more than 1% of resolution invocations are rejected for 15 minutes after migration, p99 latency regresses by more than 50%, or healthy allowed templates fail. Re-enable strict mode after fixing the analyzer/migration; remove the temporary path-only switch after one minor release with no rollback.

## PR and ownership boundaries

- This ADR is the only resource-isolation output in the current documentation task. It changes no runtime behavior and is not an implicit merge gate for the two existing P1 fixes or Tasks 01 through 03.
- A separate `plugin-flow-engine` server PR, owned by an explicitly assigned Flow Engine maintainer, implements the allowlist, all shared budgets, typed errors, HTTP concurrency/rate enforcement, telemetry, migration diagnostics, and tests. It must not be mixed into Tasks 01 through 03 hotspot files before this decision is accepted.
- The Flow Engine maintainer owns syntax/compatibility and runtime tests; the Security reviewer owns threat-model and fail-closed review; the Release owner owns upgrade warnings, dashboards, rollout, and rollback execution. The implementation PR cannot merge without all three approvals recorded.
- If this ADR is formally deferred from a parent PR, that PR must link a follow-up issue or PR, name a GitHub assignee as implementation owner, set a decision deadline no later than 14 calendar days after merge and before the next minor release, and copy the runtime acceptance list below. The parent PR must state that resource exhaustion remains unresolved. Task 06 may verify that handoff evidence only; it must not claim the risk is fixed.

## Follow-up runtime acceptance

The documentation task does not claim these tests have run. The implementation PR is complete only when automated tests prove all of the following:

- `while`, `for`, and `do` loops; arrow/function expressions and IIFEs; direct and indirect recursion constructions; `Function`; direct/indirect `eval`; constructors/`NewExpression`; and every non-allowlisted call are rejected by AST preflight before `Compartment.evaluate` is invoked.
- Allowed static/optional/dashed `ctx` paths, object/array literals, conditional expressions, template literals, and every allowlisted `Math` constant/function resolve correctly under both configure and non-configure ACL policies.
- Every numeric budget has an at-limit success and over-limit failure test, including aggregate batch limits; no rejected request performs record prefetch or partial batch evaluation.
- Output, concurrency, and rate failures return the specified status/code without leaking source, context values, or records.
- Single-process and at least two-process tests confirm limits are per process as documented and a healthy request succeeds after rejected malicious input.
- Existing record-source selection and ACL tests remain unchanged and pass. This ADR does not alter which record is loaded or which `ctx` paths a caller may access.

If a future ADR selects process isolation instead, its implementation must additionally pass the malicious synchronous infinite-loop termination-and-recovery test specified under Option B.
