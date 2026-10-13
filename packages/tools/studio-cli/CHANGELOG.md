# @nocobase/studio-cli

## 1.0.0-beta.57

### Minor Changes

- ddfe1b1: Replace workflows with a project manager and agents discovered from runners. Issues have six fixed statuses (Backlog, In progress, Blocked, In review, Done, Cancelled); a new issue is started now or later, and "Start" on a backlog issue wakes the project manager. One project manager (`studio-project-manager`) executes every issue given to agents: each turn it hands one step to an agent by what the agent's description says it is good at, from a roster of the enabled agents with whether a runner can take their work and how busy they are, asks a person (Blocked) or hands the issue over for acceptance (In review), and starts each comment with a "Next" line. It works in a directory of its own without a checkout; a step that changes no code is handed over as read-only and runs in a read-only checkout alongside the step that writes. Its settings (Agents › Project manager, `GET`/`PATCH /api/projectManager`, `project-manager get|update`) choose the agent it runs with and a fallback, its allocation principles (built in, editable, restorable) and how many runs agents' comments may start per issue (20 a day by default). Besides failing checks and conflicts, a linked pull request whose checks all passed wakes it once per head commit (`prChecksPassed`, switch `wakeOnChecksPassed` per repository). The issue page's "Now" line says what the issue waits for (`GET /api/issueProgress/{issueId}`), and the pull request toggle reads "Complete the issue when merged" or "Merging does not change the issue". The Agents page lists the agents discovered from runners to enable; online agents, the project assistant, chat model choice, agent presets, workflows, stage rules, design proposals, approvals, checklists, executor admission rules, retrospective rules and putting small knowledge bases into prompts are removed; conversations and AI intake pick an enabled agent. A finished run reads "Turn ended".

  Upgrading: let running agent runs finish (or stop them) first. The migrations map issue statuses to the fixed ones, hand every issue an agent executed to the project manager, remove all existing agents (their names stay in history) and cancel their queued runs, delete workflows, stage guards, approvals and checklists, and withdraw the inbox decisions about them; nothing is woken, and an open issue shows "Hand over to the project manager" until someone does. Working directories, `agent/<KEY>` branches and pull requests are kept. Afterwards, enable the agents your runners report (Agents) and choose the project manager's agent (Agents › Project manager).

### Patch Changes

- 6758f9f: Add offline `skills install` and `skills status` commands for branded CLI packages that ship the nb-studio-cli Skill, with Claude Code and Codex detection, explicit tool selection, dry-run output and content comparison. Register installed locations and synchronize them from the new package after CLI self-update, preserving older copies on replacement failure and reporting synchronization warnings without failing the CLI upgrade. The update JSON payload gains an optional `skills` result and envelope warnings; local Skill commands return their payload under `result.data`. Preserve documented exit codes when static commands fail with JSON output.

  Document local installation, Codex's current user Skill directory and legacy-copy behavior, and reinstalling Skills after external CLI upgrades.

  Reject nested installation destinations before writing any target, including destinations registered by earlier installs. During self-update, preserve conflicting copies and their records, report warnings, and continue synchronizing unrelated destinations.

- Updated dependencies [157a914]
- Updated dependencies [8698e80]
- Updated dependencies [6758f9f]
  - @nocobase/app-cli-client@0.1.0-beta.6

## 1.0.0-beta.56

### Patch Changes

- Updated dependencies [65ec64a]
  - @nocobase/app-cli-client@0.1.0-beta.5

## 1.0.0-beta.55

## 1.0.0-beta.54

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.
- Updated dependencies [cf23bfe]
  - @nocobase/app-cli-client@0.1.0-beta.4

## 1.0.0-beta.53

### Patch Changes

- Updated dependencies [ca0bfe2]
  - @nocobase/app-cli-client@0.1.0-beta.3

## 1.0.0-beta.52

### Patch Changes

- 13620d9: The runner and an application's CLI can now be installed and updated from npm when the application serves no tarball of them and names the exact npm version instead (`agents.dist.npm`). The install script asks with `accept=npm`; for an npm answer it checks for Node.js 24 or newer and `npm` (or `NOCOBASE_NPM`), runs `npm install --prefix <prefix>/versions/<version> --no-save --no-audit --no-fund --omit=optional <package>@<version>` and writes a launcher at `versions/<version>/bin/<command>`, so `current`, the linked command and the runner's user service work as they do for a tarball, and links `<prefix>/node` to the Node.js it checked. The runner declares the `npm` feature and installs a heartbeat's `npmUpgrade` the same way between runs; `nocobase-runner update` and `<cli> update` follow either answer, and an installation moves between tarball and npm versions in both directions (`installNpmVersion`, `npmLauncherScript` and `UpdateTarget` in `@nocobase/app-cli-client/install`). An application that answers no npm form is handled exactly as before.

  `@nocobase/agent-runner` and `@nocobase/app-cli-client` now depend on exactly the `@nocobase/agent-protocol` they were built with, and `@nocobase/studio-cli` and `@nocobase/agent-runner` on exactly their `@nocobase/app-cli-client`, so a version installed from npm behaves as it was built.

  `nocobase skills sync` no longer reads Skills from a packaged application CLI (a dependency declaring `nocobase.cli`, such as `@nocobase/studio-cli`): its `skills/` is for that command's users. NocoBase Studio declares `@nocobase/studio-cli`, so its build pins `nb-studio` to the version it was built with, and its CLI documentation and home-page agent prompt say that `nb-studio` needs Node.js 24 or newer with npm. The application development Skill documents `nocobase cli build --universal`.

- 425ed30: New package: `nb-studio`, NocoBase Studio's command line, published on its own. It is `@nocobase/app-cli-client` with Studio's brand and its `nb-studio-cli` Skill, installable with `npm install -g @nocobase/studio-cli` on any machine with Node.js 24 or newer.
- Updated dependencies [13620d9]
- Updated dependencies [459c33f]
  - @nocobase/app-cli-client@0.1.0-beta.2

## 1.0.0-beta.51

The `nb-studio` command line of NocoBase Studio, published on its own.
