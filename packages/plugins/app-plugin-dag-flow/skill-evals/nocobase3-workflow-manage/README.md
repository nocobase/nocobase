# Workflow Skill Prompt Tests

This directory contains behavioral prompt suites, deterministic workflow source
fixtures, isolated SQLite runtime fixtures, and a protocol-neutral runner whose
first adapter uses the official Codex App Server JSON-RPC protocol.

The runner does not send `expected` or `forbidden` fields to the tested agent.
They remain in the JSON report for human or later automated evaluation.
Cases use explicit Skill injection by default. A case with
`skillMode: implicit` instead installs the published Skill into the isolated
application's `.agents/skills/` directory and sends only the natural-language
prompt, so description-based automatic selection can be evaluated separately.

## Commands

Run these commands from `packages/plugins/app-plugin-dag-flow`.

List all cases:

```bash
pnpm eval:skill -- --list
```

Run one read-only case and save its response and rubric:

```bash
pnpm eval:skill -- \
  --id explain-crud-or-workflow \
  --output .tmp/workflow-skill-results.json
```

Run several read-only cases concurrently:

```bash
pnpm eval:skill -- \
  --suite business-prompts.yaml \
  --concurrency 3 \
  --output .tmp/workflow-business-results.json
```

Source mutation cases are skipped unless explicitly enabled. They run in
per-case temporary workspaces:

```bash
pnpm eval:skill -- \
  --id define-complete-package \
  --allow-mutation \
  --keep-workspaces
```

Invocation and high-risk cases require `--allow-invocation`. Their prompt safety
gates still apply, and fixtures must not point at a live application:

```bash
pnpm eval:skill -- \
  --id invoke-retry-event-key-ambiguity \
  --allow-invocation
```

Use `--model <model>`, `--timeout-ms <milliseconds>`, and repeated `--id` flags
as needed. The default adapter starts `codex app-server --stdio`, creates one
ephemeral thread per case, and uses `approvalPolicy: never`.

The TypeScript entrypoints use Node 24 with `--import tsx` rather than the
`tsx` CLI. This avoids the CLI's shared IPC socket when cases run concurrently.

## Isolation

Each case gets its own directory below the operating system temporary root. It
contains disposable workflow source copies and, when requested by the case, an
independent SQLite database. Runtime fixture IDs are deterministic inside that
private database, so prompts can refer to Run `781`, `9001`, or `9002` without
colliding with another parallel case. Cleanup removes the entire case root in a
`finally` block unless `--keep-workspaces` is supplied.

The runtime fixture CLI uses the real workflow repositories for read-only
inspection. Static DSL fixtures are checked with the real `dag-flow check`
binary and do not need a database.

Run the deterministic runner/fixture tests with:

```bash
pnpm eval:skill:test
```

The evaluated skill lives in
`packages/plugins/app-plugin-dag-flow/skills/nocobase-app-plugin-dag-flow`.
The runner resolves it from the package root. This `skill-evals` directory is
development-only and is excluded from the workflow package's npm tarball by
the package `files` allowlist.

## Adding another agent

Keep case loading, workspace preparation, and reports unchanged. Add an adapter
implementing the `AgentRunOptions` and `AgentRunResult` contract in
`runner/types.ts`, then expose it through a runner option. Codex currently uses
its official App Server Protocol; a future ACP-compatible agent belongs in a
separate adapter rather than being presented as a Codex ACP implementation.
