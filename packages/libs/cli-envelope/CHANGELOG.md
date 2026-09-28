# @nocobase/cli-envelope

## 0.1.0-beta.0

### Minor Changes

- 9f75a27: A new package holding the JSON document every NocoBase command-line tool prints under `--json` — `{ schemaVersion: 1, ok, command, status, result | error, warnings }` — with `commandSuccessJson` and `commandFailureJson` to build it, `isCommandEnvelope` to recognise it, and `formatCommandLine` and `renderSuggestion` to write a suggestion's `{ command, args }` as one line a person can paste. `@nocobase/cli-envelope/node-guard` is the Node.js version check a tool's `bin/run.js` runs before loading anything else, as plain JavaScript with no imports: `isSupportedNodeVersion`, `unsupportedNodeVersionOutput`, which answers `--json` with the same document under `NODE_UNSUPPORTED` and names the command from the arguments before the first flag unless the tool names one, and `exitWhenFlushed`, which exits only once stdout and stderr have drained. `@nocobase/app-cli`, `@nocobase/app-installer`, `@nocobase/create-app` and `@nocobase/create-plugin` build their documents with it instead of each keeping a copy.

## 0.0.1

Initial version.
