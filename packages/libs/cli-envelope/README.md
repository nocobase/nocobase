# @nocobase/cli-envelope

The JSON document every NocoBase command-line tool prints under `--json`, and the Node.js version guard their entry points run before anything else loads.

`pnpm nocobase … --json` prints it through `AppCommand` in `@nocobase/app-cli`. The tools that run before an application exists cannot use `AppCommand`, so `pnpm create @nocobase/app`, `pnpm plugin:create` and `@nocobase/app-installer` build the document with this package's functions instead. A caller reads all of them the same way: check `ok`, then read `result` or `error`.

```json
{ "schemaVersion": 1, "ok": true, "command": "create-app", "status": "success", "result": {}, "warnings": [] }
{ "schemaVersion": 1, "ok": false, "command": "create-app", "status": "failure", "error": { "code": "INSTALL_FAILED", "message": "…", "suggestions": [{ "message": "…", "run": { "command": "pnpm", "args": ["install"] } }], "details": {} }, "warnings": [] }
```

## Building a document

`commandSuccessJson(command, status, result, warnings)` and `commandFailureJson(command, error, warnings)` return the two shapes, with the members in the order shown above. A `result` of `undefined` is printed as `null`, and `error.details` is left out when it is `undefined`, so a reader can test for its presence. Both mark what they return, and `isCommandEnvelope` recognises the mark from any copy of this package, which is how `AppCommand.logJson` refuses to print anything else.

A suggestion's `run` is an executable and its arguments, never a shell line, so a caller runs it without quoting. For a person, `formatCommandLine` writes it as one pasteable line with only the arguments that need it quoted, and `renderSuggestion` puts the message in front of it.

## The Node.js guard

`@nocobase/cli-envelope/node-guard` is plain JavaScript with no imports, so that a tool's `bin/run.js` can run it on the Node.js it is there to refuse, before loading the TypeScript sources a development checkout runs from:

```js
import {
  exitWhenFlushed,
  isSupportedNodeVersion,
  unsupportedNodeVersionOutput,
} from '@nocobase/cli-envelope/node-guard';

if (!isSupportedNodeVersion()) {
  const { stream, text } = unsupportedNodeVersionOutput({
    name: 'create-app',
    command: 'create-app',
    argv: process.argv.slice(2),
  });
  process[stream].write(`${text}\n`);
  await exitWhenFlushed(1);
}
```

Under `--json` that prints the failure document with the code `NODE_UNSUPPORTED` on stdout; otherwise it prints a two-line message on stderr. `command` is what the document names; left out, it is `commandFromArgv(argv)`, the arguments before the first flag joined, such as `db apply` from `nocobase db apply --json`. The guard cannot parse what it refuses to load, so a positional argument typed before the first flag is part of that; a tool with one command names it instead, as above. `exitWhenFlushed` waits for stdout and stderr to drain before `process.exit`, which alone can drop output still queued for a pipe and cut the document short; a tool's final exit goes through it too.

The guard's declarations are hand-written in `node-guard.d.ts`. `tsconfig.node-guard.json` checks `node-guard.js` against them, and the tests with them, so `pnpm typecheck` fails here when the two disagree rather than in a consumer.

## Dependency contract

This package holds no state that needs one copy per process: the envelope mark is a registered symbol, so two copies agree on it, and everything else is a pure function or a type. Declare it as an ordinary `dependency`, not a peer. It is published to `https://npm.nocobase.ai`.
