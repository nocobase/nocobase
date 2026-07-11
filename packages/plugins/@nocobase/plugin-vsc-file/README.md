# @nocobase/plugin-vsc-file

Stores versioned source workspaces and provides the RunJS Studio repository API.

RunJS workspaces accept JavaScript and TypeScript syntax, including local module imports. TypeScript is parsed and
transpiled for runtime execution; this plugin does not currently perform project-wide semantic type checking.

## Version model

- Each repository has one current ref: `head`.
- Every successful push or RunJS save creates an immutable commit and atomically advances `head`.
- There is no persisted draft state and no separate published ref. Unsaved editor changes exist only in browser memory.
- RunJS save locks the repository at its current `head`, compiles the submitted workspace snapshot, creates the commit,
  writes the runtime artifact to its owning surface, and updates commit metadata in one database transaction.
- RunJS Studio does not expose stale-editor conflicts. A later save creates the next linear version from the current
  server head. A save without file changes returns `RUNJS_SAVE_NO_CHANGES`.
- After `runJSSources:save` or `runJSSources:importZip` succeeds, the server transaction is the only persistence path.
  The editor may refresh local host state through `onPersistedChange`, but must not issue a second full host-model save.
- Head advancement also requires the repository to remain `active`. If an archive wins after a writer read an older
  active snapshot, the write transaction rolls back with `REPO_ARCHIVED`; repository Head and its `head` ref stay put.

## Uninitialized FlowModel RunJS sources

New JS blocks, fields, items, and actions can open RunJS Studio before their `runJs` step params have been persisted.
The client calls `runJSSources:open` with the normal `locator` plus the current editor value:

```ts
{
  locator: RunJSSourceLocator;
  initialSource?: { code: string; version: string };
}
```

The FlowModel adapter marks only recognized `runJs.code` surfaces as `uninitialized`. In that state, `open` uses
`initialSource` to initialize the workspace while keeping the server-generated owner fingerprint. A later
`runJSSources:save` writes the compiled artifact and creates the previously missing step path in the same transaction.

- Good: a new `JSBlockModel` at `jsSettings.runJs.code` opens with its current default code and can be saved.
- Base: an existing persisted source ignores `initialSource` and remains server-authoritative.
- Bad: unknown flow, step, or parameter paths still return `RUNJS_SOURCE_NOT_FOUND`; malformed `initialSource` returns
  `RUNJS_SOURCE_LOCATOR_INVALID`.

Regression coverage lives in `plugin-vsc-file`'s `RunJSStudioProvider.test.tsx` and `plugin-flow-engine`'s
`runjs-sources.adapters.test.ts`.

## Current module boundary

- Supported source files: `.ts`, `.tsx`, `.js`, `.jsx`, and `.json`.
- Imports must be static, relative, and stay inside the workspace. Default imports, named imports, and type-only imports are supported.
- Package imports, dynamic imports, namespace imports, CommonJS export assignments, export lists/re-exports, and circular module graphs are rejected.
- Compilation validates syntax and the RunJS authoring contract, then emits the runtime artifact. It does not create a TypeScript `Program`, resolve external declaration packages, or provide full semantic type checking.
- The generated line map composes the module transform with TypeScript's transpile source map at line granularity. Synthetic wrapper/import/export lines and column-level locations remain best-effort.
