# @nocobase/app-cli-client

## 0.1.0-beta.0

### Minor Changes

- 37c8d20: Add `@nocobase/app-cli-client`, a command line for a NocoBase application branded by the application: it signs in to a server (browser device login, an API key, or a run's credential), stores credentials in the operating system's keychain, and runs the business commands the server's command manifest (`GET /api/cli/manifest`) publishes for the caller, each a request to one API route, with `--json` output in the shared envelope. An application declares its brand under `nocobase.cli` in its `package.json`, and `nocobase cli build` and `nocobase cli link` of `@nocobase/app-cli` package it; `runAppCli` serves a CLI that adds static commands of its own. `./request` (`fillRequest`), `./parse` and `./install` expose the request builder, the command-line parser and the install layout to servers and installers.

### Patch Changes

- Updated dependencies [37c8d20]
  - @nocobase/agent-protocol@0.1.0-beta.0

## 0.0.1

Initial version.
