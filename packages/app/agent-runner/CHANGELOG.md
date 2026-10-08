# @nocobase/agent-runner

## 0.1.0-beta.0

### Minor Changes

- 37c8d20: Add `@nocobase/agent-runner` (`nocobase-runner`): it makes a machine, such as a server, a VM or someone's own device, a runtime of one or more NocoBase applications. It registers with them, claims the agent runs they queue, prepares each run's working directories and skills, and drives Claude Code, Codex, OpenCode or Pi on them, with the application's CLI installed for the run and the run's credential written for it. It also executes build jobs, installs as a user service (launchd or systemd), and updates itself between runs when an application serves a newer build. Its state lives in `~/.nocobase-runner` and its environment variables are `NOCOBASE_RUNNER_*`.

### Patch Changes

- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
  - @nocobase/agent-protocol@0.1.0-beta.0
  - @nocobase/app-cli-client@0.1.0-beta.0

## 0.0.1

Initial version.
