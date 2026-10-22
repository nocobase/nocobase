# @nocobase/app-cli-client

## 0.1.0-beta.14

### Patch Changes

- Updated dependencies [ffe5494]
  - @nocobase/agent-protocol@0.1.0-beta.13

## 0.1.0-beta.13

### Minor Changes

- ab68344: Make `skills install`, `skills status` and the Skill synchronization in `update` handle every Skill a branded CLI package ships, discovered from `skills/*/SKILL.md` at run time, instead of only `nb-studio-cli`. The installation record `skills.json` becomes `{ version: 2, targets }` with a `skill` on each target; the original single-Skill file is still read and migrated on the next write. The result gains a `skills` list and a `skill` on each target; its `skill` and `hash` keep naming `nb-studio-cli`. When an update no longer ships a Skill, its registered copy is removed only if it still matches what was installed; an edited copy is kept with a warning.

### Patch Changes

- Updated dependencies [f2712b9]
  - @nocobase/agent-protocol@0.1.0-beta.12

## 0.1.0-beta.12

### Patch Changes

- Updated dependencies [301d309]
- Updated dependencies [4f0d96e]
  - @nocobase/agent-protocol@0.1.0-beta.11

## 0.1.0-beta.11

### Patch Changes

- c63a6e8: Reuse current registered session Skills without filesystem writes and wait for concurrent Skill installation instead of failing immediately. Record each lock owner and safely recover locks belonging to exited local processes, while preserving locks whose owners cannot be verified.

## 0.1.0-beta.10

### Patch Changes

- Updated dependencies [32ed5e2]
  - @nocobase/agent-protocol@0.1.0-beta.10

## 0.1.0-beta.9

### Patch Changes

- b322dcf: Allow owners to withdraw individual queued agent messages through server execution claims and computer removal acknowledgements. Bridge protocol 4 requires upgrading and restarting the computer connection; messages already delivered to older bridges cannot be safely withdrawn. Each new message carries its complete instructions and work context. Offline withdrawals remain pending until confirmed, and editing a withdrawn message preserves images and the current draft.

  Unsequenced pre-upgrade commands still on the server cannot be authorized by the new bridge and display a warning asking the owner to send a new message. They are never silently executed without a claim.

  Avoid returning unused command payloads during enqueueing so large prompts also work on Oracle.

  Confirm each turn’s reports before claiming its successor so errors, usage and completion details keep their transcript boundary. Settle cancelled pending claims even when an approval response is delayed or lost, preventing archived sessions from remaining active or replaying closed messages.

- Updated dependencies [b322dcf]
- Updated dependencies [baa743e]
  - @nocobase/acp-bridge@1.0.0-beta.3

## 0.1.0-beta.8

### Minor Changes

- 55fcee1: Replace the built-in agent session MCP endpoint and tool registration API with the Studio CLI and shared Skill. Bridge protocol 3 requires a matching CLI upgrade. Session agents use the bridge-selected login profile, validate session ownership before creating linked tasks, default to the session project and Backlog, and read linked work and issue progress through CLI routes. Prepare the shared Skill before starting or restoring sessions and explain unsupported agents or installation failures. Teach both bundled Skill copies to discuss and search before recording work and combine related requirements into as few tasks as practical.

### Patch Changes

- 846e75f: Allow all compatible ACP agents to open My Agent sessions by supplying the shared CLI Skill as prompt instructions when native installation is unavailable. Preserve Claude Code and Codex installation, session identity and permission behavior.
- d34b6eb: Reject explicit issue start requests that would save into Backlog before allocating an issue number or writing the issue. Keep the validation message client-neutral and explain the required In progress flags in command help and recovery suggestions. Preserve validated application suggestions from API error metadata in CLI errors without changing the JSON envelope shape.
- 5fe8773: Reject empty or whitespace-only Git credential files before sending a request, and preserve saved credentials when validation fails. Support explicit credential removal through a JSON update file with null values, returning the incomplete connection state when required credentials are cleared.
- 49f61b9: Show optional settings permissions separately from business actions in CLI identity output, and explain run-token-only permissions. Add available-command typo suggestions, a hint for truncated text, and clean shutdown when a pipe closes early. Describe route schema inputs so generated CLI help and reference tables explain their parameters. The manifest identity and whoami JSON result gain an optional settings list; command admission and authorization are unchanged.
- Updated dependencies [f584e87]
- Updated dependencies [846e75f]
- Updated dependencies [c272997]
- Updated dependencies [00c5970]
- Updated dependencies [616561b]
- Updated dependencies [83e3609]
- Updated dependencies [55fcee1]
  - @nocobase/acp-bridge@1.0.0-beta.2
  - @nocobase/agent-protocol@0.1.0-beta.9

## 0.1.0-beta.7

### Minor Changes

- 1cd749c: Expose issue handoff viewing, acceptance, and rejection through generated CLI commands. Add a single declarative GET binding that supplies a request body field before a command executes, preserving handoff permissions and stale notification checks.

### Patch Changes

- 8e4cf26: Recover runners and agent-session bridges after a protocol upgrade. Heartbeat answers now carry the server's runner protocol (`protocolVersion`), and a runner that speaks an older protocol while no newer version is offered logs what it speaks, what the application needs and how to update, instead of looking up to date. A bridge refused for its protocol now receives the protocols the application speaks in the error's `metadata`; `acp start` then updates the CLI as `update` does and exits non-zero so its launchd, systemd or Startup service starts it again on the new version, and when no update helps it still exits non-zero after a pause rather than stopping with success. A computer whose bridge was refused as too old is shown on My agents with the commands to update it.
- e23633e: Discover installed agents' real model and configuration choices before a new session's first message. Show loading, fixed, unsupported, offline and retry states, isolate settings by computer, agent and directory, and validate selected values before sending a prompt. Persist acknowledged dependent settings when existing sessions change models so reopening keeps their configuration. Bridge protocol version 2 requires upgrading the application CLI.
- Updated dependencies [8e4cf26]
- Updated dependencies [e23633e]
- Updated dependencies [923a8e5]
- Updated dependencies [f36da62]
  - @nocobase/agent-protocol@0.1.0-beta.8
  - @nocobase/acp-bridge@0.1.0-beta.1

## 0.1.0-beta.6

### Minor Changes

- 157a914: Add `<bin> acp start`, which connects the computer to the signed-in person's agent sessions (`@nocobase/app-plugin-agent-sessions`) and keeps it connected until stopped, running their sessions with the coding agents installed there, and `<bin> acp service install`, `status` and `uninstall`, which keep it connected in the background from every login as a launchd agent on macOS, a systemd user unit on Linux or a Startup script on Windows. One bridge runs per profile on a computer. The person chooses the folders sessions work in from the application; `--root` limits them on the computer itself (the home directory by default).
- 6758f9f: Add offline `skills install` and `skills status` commands for branded CLI packages that ship the nb-studio-cli Skill, with Claude Code and Codex detection, explicit tool selection, dry-run output and content comparison. Register installed locations and synchronize them from the new package after CLI self-update, preserving older copies on replacement failure and reporting synchronization warnings without failing the CLI upgrade. The update JSON payload gains an optional `skills` result and envelope warnings; local Skill commands return their payload under `result.data`. Preserve documented exit codes when static commands fail with JSON output.

  Document local installation, Codex's current user Skill directory and legacy-copy behavior, and reinstalling Skills after external CLI upgrades.

  Reject nested installation destinations before writing any target, including destinations registered by earlier installs. During self-update, preserve conflicting copies and their records, report warnings, and continue synchronizing unrelated destinations.

### Patch Changes

- 8698e80: Keep oclif from registering tsx when a packaged CLI runs from sources under `NODE_ENV=development` or `test`, which made every cold start about half again as slow.
- Updated dependencies [157a914]
- Updated dependencies [10e261b]
- Updated dependencies [ddfe1b1]
- Updated dependencies [ee24e95]
- Updated dependencies [4748117]
- Updated dependencies [a2cf036]
  - @nocobase/acp-bridge@0.1.0-beta.0
  - @nocobase/agent-protocol@0.1.0-beta.7

## 0.1.0-beta.5

### Patch Changes

- 65ec64a: Prevent concurrent and repeated retries of the same run, retain retry attribution, and link retried runs to their replacements. Automatically settle obsolete failed-run decisions after retries, new work, reassignment, or issue completion, including outstanding cards from earlier releases.
- Updated dependencies [65ec64a]
  - @nocobase/agent-protocol@0.1.0-beta.6

## 0.1.0-beta.4

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.
- Updated dependencies [cf23bfe]
  - @nocobase/agent-protocol@0.1.0-beta.5
  - @nocobase/cli-envelope@0.1.0-beta.1

## 0.1.0-beta.3

### Patch Changes

- ca0bfe2: Return invitation links after successful email delivery and let authorized original inviters generate a fresh link without sending email. Show copy controls for newly created and resent invitations, confirm rotation, and explain when a concurrent change makes the link unavailable. Keep scalar URLs complete in CLI text output; structured fields retain their compact display.

  Preserve registration through invitation links without requiring an email channel or configured public origin. Links use app.publicOrigin when configured and otherwise the invitation request origin. Acceptance leaves the new account's email unverified. Existing accounts must sign in with the invited identity, and each token accepts only its own invitation. Only token hashes are stored; rotation invalidates the previous link.

  When no authentication base URL is configured, derive the trusted origin for cookie writes from each request URL using Better Auth's proxy-header policy. This allows same-origin invitation acceptance with unrelated or session cookies while rejecting cross-origin writes and preserving configured origins.

  Retrieve plugin invitations through their domain-authorized endpoint. Recheck the original inviter's current role and project permissions. Other managers may resend email but do not receive credentials; scoped credentials remain email-only. Renewal ignores deleted projects if at least one remains, checking access to each remaining project, and rejects renewal if all selected projects are gone.

  Send invitation credentials through a transient notification attempt without durable message snapshots, automatic retries or raw provider diagnostics. Preserve safe failure categories and submission status. Batches use at most five concurrent sends and a shared 30-second mail-delivery budget. Recheck each link after sending or exhausting the budget so concurrent closure or rotation does not expose invalid links or discard other recipients and existing-account project updates.

- Updated dependencies [0f7ed64]
- Updated dependencies [e9301ed]
- Updated dependencies [ee217d5]
- Updated dependencies [b4c2116]
  - @nocobase/agent-protocol@0.1.0-beta.4

## 0.1.0-beta.2

### Minor Changes

- 13620d9: The runner and an application's CLI can now be installed and updated from npm when the application serves no tarball of them and names the exact npm version instead (`agents.dist.npm`). The install script asks with `accept=npm`; for an npm answer it checks for Node.js 24 or newer and `npm` (or `NOCOBASE_NPM`), runs `npm install --prefix <prefix>/versions/<version> --no-save --no-audit --no-fund --omit=optional <package>@<version>` and writes a launcher at `versions/<version>/bin/<command>`, so `current`, the linked command and the runner's user service work as they do for a tarball, and links `<prefix>/node` to the Node.js it checked. The runner declares the `npm` feature and installs a heartbeat's `npmUpgrade` the same way between runs; `nocobase-runner update` and `<cli> update` follow either answer, and an installation moves between tarball and npm versions in both directions (`installNpmVersion`, `npmLauncherScript` and `UpdateTarget` in `@nocobase/app-cli-client/install`). An application that answers no npm form is handled exactly as before.

  `@nocobase/agent-runner` and `@nocobase/app-cli-client` now depend on exactly the `@nocobase/agent-protocol` they were built with, and `@nocobase/studio-cli` and `@nocobase/agent-runner` on exactly their `@nocobase/app-cli-client`, so a version installed from npm behaves as it was built.

  `nocobase skills sync` no longer reads Skills from a packaged application CLI (a dependency declaring `nocobase.cli`, such as `@nocobase/studio-cli`): its `skills/` is for that command's users. NocoBase Studio declares `@nocobase/studio-cli`, so its build pins `nb-studio` to the version it was built with, and its CLI documentation and home-page agent prompt say that `nb-studio` needs Node.js 24 or newer with npm. The application development Skill documents `nocobase cli build --universal`.

### Patch Changes

- 459c33f: `nocobase cli build --universal` packs the application's CLI, or with `--runner` the runner, into one platform-independent tarball, `<product>-v<version>-universal.tar.gz`, that carries no Node.js and runs on the machine's own Node.js 24 or newer; without `--targets` it is the only tarball packed. Its launcher runs on `NOCOBASE_NODE`, the installation's `<prefix>/node`, `node` on PATH, or the Node a previous standalone version of the installation still carries, so a runner's user service, whose PATH usually has no `node`, keeps starting.

  The agents plugin serves that tarball to every platform without a tarball of its own (one built for the platform still wins) and marks the answer with `universal: true` (`universal=true` with `format=env`); answers for platform tarballs are unchanged. For a universal tarball the install script checks that `node` is Node.js 24 or newer before downloading, stops with how to install it otherwise, and links `<prefix>/node` to it; with `--runner` it prints a `corepack enable` hint when `pnpm` is missing. The "Add runtime" dialog says the host needs Node.js 24 or newer.

  An update of an installed CLI or runner to a version without a bundled Node (`applyUpdate` of `@nocobase/app-cli-client/install`) first leaves the Node it runs on in `<prefix>/node` (`pinNode`), copied when it is a Node an older version bundles, so a runner that updates itself from a standalone version keeps a Node after the old versions are removed.

- Updated dependencies [40a5679]
- Updated dependencies [91f5344]
- Updated dependencies [97bd30b]
- Updated dependencies [459c33f]
  - @nocobase/agent-protocol@0.1.0-beta.3

## 0.1.0-beta.1

### Patch Changes

- a6758ec: Point published package repository metadata to nocobase/nocobase while preserving each package's monorepo directory.

## 0.1.0-beta.0

### Minor Changes

- 37c8d20: Add `@nocobase/app-cli-client`, a command line for a NocoBase application branded by the application: it signs in to a server (browser device login, an API key, or a run's credential), stores credentials in the operating system's keychain, and runs the business commands the server's command manifest (`GET /api/cli/manifest`) publishes for the caller, each a request to one API route, with `--json` output in the shared envelope. An application declares its brand under `nocobase.cli` in its `package.json`, and `nocobase cli build` and `nocobase cli link` of `@nocobase/app-cli` package it; `runAppCli` serves a CLI that adds static commands of its own. `./request` (`fillRequest`), `./parse` and `./install` expose the request builder, the command-line parser and the install layout to servers and installers.

### Patch Changes

- Updated dependencies [37c8d20]
  - @nocobase/agent-protocol@0.1.0-beta.0

## 0.0.1

Initial version.
