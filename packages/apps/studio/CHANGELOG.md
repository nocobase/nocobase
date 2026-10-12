# @nocobase/studio

## 1.0.0-beta.54

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.
- Updated dependencies [cf23bfe]
  - @nocobase/agent-protocol@0.1.0-beta.5
  - @nocobase/app-cli@1.0.0-beta.19
  - @nocobase/app-host-docker@0.1.0-beta.1
  - @nocobase/app-plugin-agents@0.1.0-beta.7
  - @nocobase/app-plugin-api-keys@1.0.0-beta.15
  - @nocobase/app-plugin-authentication@2.0.0-beta.6
  - @nocobase/app-plugin-authorization@1.0.0-beta.27
  - @nocobase/app-plugin-authz-default-access@1.0.0-beta.12
  - @nocobase/app-plugin-authz-restriction-rules@1.0.0-beta.11
  - @nocobase/app-plugin-authz-sharing-rules@1.0.0-beta.12
  - @nocobase/app-plugin-database-explorer@1.0.0-beta.13
  - @nocobase/app-plugin-file@1.0.0-beta.23
  - @nocobase/app-plugin-i18n@1.0.0-beta.15
  - @nocobase/app-plugin-knowledge@0.1.0-beta.2
  - @nocobase/app-plugin-notification@1.0.0-beta.27
  - @nocobase/app-plugin-notification-in-app@1.0.0-beta.24
  - @nocobase/app-plugin-notification-providers@0.2.0-beta.11
  - @nocobase/app-plugin-projects@0.1.0-beta.6
  - @nocobase/app-plugin-releases@0.1.0-beta.3
  - @nocobase/app-plugin-scheduler@1.0.0-beta.17
  - @nocobase/app-plugin-users@2.0.0-beta.4
  - @nocobase/app-server@2.0.0-beta.4
  - @nocobase/authorization@1.0.0-beta.13
  - @nocobase/caching@0.1.0-beta.3
  - @nocobase/config@0.1.0-beta.3
  - @nocobase/db@1.0.0-beta.19
  - @nocobase/db-postgres@0.1.0-beta.4
  - @nocobase/db-sqlite@0.1.0-beta.5
  - @nocobase/i18n@1.0.0-beta.7
  - @nocobase/jobs@0.1.0-beta.3
  - @nocobase/markdown-mermaid@0.1.0-beta.2
  - @nocobase/queue@0.1.0-beta.9
  - @nocobase/repository-input@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.2
  - @nocobase/snowflake@1.0.0-beta.4

## 1.0.0-beta.53

### Minor Changes

- 4044a42: Allow workflow Run agent rules to start a fresh session on every stage entry while preserving working directories and other agents' sessions. Preserve the choice across queued run merges, confirmation requests and retries, and expose it in run responses.

  New software development workflows enable fresh sessions for proposal review and code review. Existing workflows are unchanged: workflow owners can enable “Start a new session every time” in the rule editor. The agents database migration adds `freshSession` columns to runs and run requests with a default of false; no existing workflow configuration is migrated.

- 69309da: Expand the chat panel to full width in place, showing the conversation history beside the current conversation while keeping drafts, attachments and page context.
- a50b4f6: Replace the header chat button with an Agent input that sends from any page, and keep chat drafts, attachments and submission state across panel and breakpoint changes.
- 324d566: Add an issue-level "Preview not required" setting that keeps a pull request's `no-preview` label in sync: the label is applied only when every linked active issue opts out, existing manual labels are kept, and failed label updates are retried and reported.
- e4098a4: Filter run transcripts by event type: the issue's run transcript shows agent replies and input by default with switches for the other event groups, and `nb-studio run events` accepts repeated `--type` flags. Expanding hidden history preserves the reading position during live updates, and filtering or collapsing history resumes following when the reader is back at the bottom. The generated CLI reference no longer double-escapes enum values in its tables.

### Patch Changes

- 251d19e: Report password reset availability from the authentication server, hide unavailable self-service recovery, and let authorized Studio members reset another member's password.
- a50b4f6: Expose the chat query cache for application submission coordinators and keep conversation details and history current after sends. Explain unavailable header targets and query recovery conversations only when creation results are unknown. Keep upload tasks attached to their draft when an editor switches conversations, preserving pending sends across remounts.
- e9301ed: Check a subject’s admission policy in the claim transaction and cancel outdated issue runs without failing or retrying them. The same policy, with the subject's new optional `selectInputs`, also decides whether input may join a working run and whether pending input is delivered to it: input the subject rejects waits in a queued run for the claim to admit or cancel, and pending input it no longer admits or selects is marked handled instead of being delivered, or of holding the run's completion open. The runner completes again, rather than starting a turn with an empty prompt, when input it was told is pending never arrives. Studio permits its executor only in execution statuses and workflow agents only in their current stage; an agent mentioned by name, or answered under its own comment, runs in any stage, except the executor. Earlier stage instructions are left out of the turn rather than cancelling the run, which is cancelled only when nothing else remains. Approving a proposal now requires an eligible executor (`DESIGN_EXECUTOR_REQUIRED` otherwise). Requeue live workspace contention without consuming execution attempts, bounded by a six-hour wait, with a compatible failure fallback for older applications.

  Filter obsolete stage instructions consistently from the assembled task, turn and delivered inputs. Record permission-rejected executor claims atomically and notify the owner once with the required pull request permission and reassignment options. Preserve restart after an acknowledged project move.

- ee41a40: Show the executing agent's active work on issue tables and boards using scoped batch summaries, with pending approvals taking precedence and visible-page refreshes.
- 97fa897: Stop pointing Studio's agent guidance at the discontinued workflow plugin, and record that the Hub CLI and DSL Workflow plugin are no longer part of Studio.
- b3ed51f: Stop exposing the vector store target in the knowledge search status API and settings page; only the vector store type is shown.
- a76c859: Let issue details add "Related" links as well as prerequisites, and let editors change an existing relationship's type, so linking related work no longer holds the issue.

  Group relationship conversion and removal in one row menu, and translate stale relationship conflicts in English and Chinese.

  Convert relationship types atomically on the server, preserving the link ID and rejecting stale changes or an existing target relationship without deleting either link.

  Protect dependency graph additions with a shared database revision so concurrent conversions, new dependencies, hierarchy changes and restores cannot commit a cycle, including transactions with an older MySQL snapshot.

  Protect symmetric related links against concurrent additions and conversions, and acquire the graph guard before plan rows so mixed edits cannot reverse the issue-row lock order during rehearsal, execution or undo.

  Keep relationship removal under the same graph protection as conversion, so both removal endpoints use consistent relationship types and endpoints for activity and release notifications.

  Wake waiting work only when a relationship conversion or removal actually clears its blockers. Editing a completed prerequisite, or deleting an already completed issue, no longer starts an agent that was intentionally left idle.

  Serialize blocker status changes and deletion with relationship edits before writing issue rows, including approvals, workflow events and automatic parent completion, so concurrent releases cannot leave unblocked work idle.

- 107edd5: Refresh an open issue page after agent wakeups: the page now discovers new runs and picks up their result comments and status changes without a reload, including work another person or a rule started.

  Refresh loaded older comment threads when realtime updates are unavailable, while letting slow requests finish.

- 87b8394: Install published applications with `--app @nocobase/studio` or the official shorthand `--app studio`, preserving package identity while building and deploying on the server. Support npm application upgrades, explicit version selection and rebuilding with the existing backup and rollback workflow. Include Studio's shared sources and CLI skills in its published package so it builds outside the repository, and document the deployment route.
- 324d566: Refresh the lifecycle of pull requests with Studio-managed preview labels after their last issue is unlinked. Closed or merged pull requests stop being polled and their labels remain untouched, while failed label removals on open pull requests continue to retry.
- 324d566: Keep preview label ownership durable across concurrent Studio instances and validate label observations independently of pull request merge checks. Refresh issue previews when an external agent links the first pull request, and stop polling label states for closed pull requests. Once Studio attempts to add a PR's no-preview label, that label remains managed by the issue preferences while the PR is open; labels already present before Studio takes ownership remain manual.
- 90d5fab: Remove a working directory once its subject's work is over, on the subject's status alone. Studio counts an issue as over when it is done or cancelled, whatever its pull requests are, and resolves directories without a known run by their issue key. The agents plugin no longer checks which runner worked on a subject, so legacy directories on any runner are decided too, and no longer asks bindings for commit evidence. The runner removes an ended directory with anything never pushed in it, and logs that it did; it still keeps one a run holds or used since the report, and one the second report no longer confirms as ended. Directories whose work goes on keep their unpushed-work protection. Runners released earlier still keep ended directories with unpushed work, since decisions now carry no commit evidence.

  New runners connected to older applications that only return legacy remove lists continue protecting unpushed commits and changes. Only a settled directory decision permits discarding unpushed work; automatic collection confirms that decision in a second report before deletion.

- Updated dependencies [69309da]
- Updated dependencies [251d19e]
- Updated dependencies [a50b4f6]
- Updated dependencies [ca0bfe2]
- Updated dependencies [ca0bfe2]
- Updated dependencies [4044a42]
- Updated dependencies [0f7ed64]
- Updated dependencies [e9301ed]
- Updated dependencies [be823bd]
- Updated dependencies [ee41a40]
- Updated dependencies [ee217d5]
- Updated dependencies [b4c2116]
- Updated dependencies [a76c859]
- Updated dependencies [107edd5]
- Updated dependencies [c1b397d]
- Updated dependencies [90d5fab]
  - @nocobase/app-plugin-agents@0.1.0-beta.6
  - @nocobase/app-plugin-authentication@2.0.0-beta.5
  - @nocobase/app-plugin-users@2.0.0-beta.3
  - @nocobase/app-plugin-projects@0.1.0-beta.5
  - @nocobase/app-plugin-notification@1.0.0-beta.26
  - @nocobase/agent-protocol@0.1.0-beta.4

## 1.0.0-beta.52

### Minor Changes

- 40a5679: An application can name the runner and its CLI on npm when it has no tarball of them. `agents.dist.npm` maps a product to its npm package and an exact version, such as `{ nocobase-runner: { package: '@nocobase/agent-runner', version: '1.0.0' } }`; a product `agents.dist.dir` has a current version of is still served from there exactly as before. Only callers that say they understand the answer receive it: the resolve route (`/api/agents/dist/products/<product>/targets/<target>`) answers `{ kind: 'npm', product, version, package, channel }` (or `kind=npm` lines with `format=env`) to a request with `accept=npm`, and a heartbeat answer carries `npmUpgrade` instead of `upgrade` only to a runner that declares the new `npm` feature. Every other caller gets what it got before: the artifact when there is a tarball, otherwise a 404 and no update.

  `@nocobase/agent-protocol` adds `DistNpmPackage`, `DistResolution`, `DIST_ACCEPT_NPM`, `NpmUpgradeNotice`, `HeartbeatResponse.npmUpgrade` and the `npm` runner feature (`NPM_UPGRADE_FEATURE`), and moves `PROTOCOL_VERSION` to 8 so that a runner announcing `npm` is refused cleanly by a server that does not know it. Nothing of protocol 7 changed: a server speaking 8 still serves runners speaking 3 to 7. A runner speaking 8 is shown as needing an upgrade by an application that serves only up to 7, so upgrade the application before its runners.

  NocoBase Studio pins the runner it serves to the exact `@nocobase/agent-runner` version it was built with, recorded by `pnpm build` in `dist/server/agents/served-versions.json` (the runner stays out of the deployment's dependencies), and names it on npm when its image carries no runner tarballs. Redeploying Studio moves runners that understand npm updates to that version.

- d3763a2: Studio's `pnpm build` now packs the universal `nocobase-runner` and `nb-studio` packages into `dist/runners/`, at the exact versions it records in `dist/server/agents/served-versions.json` (`nb-studio` at `@nocobase/studio-cli`'s version, the runner at `@nocobase/agent-runner`'s), and fails when they differ. Studio serves them from there by default, so every build, deployment archive and image serves the runner and CLI it was built with, including to runners installed from a package, which can only update from one. `agents.dist.dir` in `config.yml` and `NB_STUDIO_RUNNERS_DIST` still take precedence, and npm stays the fallback for a Studio without packages, such as `pnpm dev`. The build installs the packages' dependencies with npm, so it needs access to the npm registry. The Dockerfile no longer takes a `runners-dist/` directory, and it rejects a prebuilt `dist/` without `dist/runners`. The published package now includes `ai/`, the Skills `nb-studio` ships, which an installed Studio needs to pack it.

  `nb-studio` packages are now versioned as `@nocobase/studio-cli` rather than as Studio. An installation that served `nb-studio` packed with `pnpm nocobase cli build` and no `--version` handed out Studio's version, which sorts higher, so `nb-studio update` does not offer the new package there: install `nb-studio` again with the install script.

  The agents plugin's documentation describes building the runner and CLI into an application's own build output as an alternative to separate CI artifacts.

  `@nocobase/studio-cli` now shares Studio's version line (a `fixed` changesets group), so the `nb-studio` Studio serves keeps the versions earlier Studio builds handed out and `nb-studio update` offers it to existing installations.

### Patch Changes

- 91f5344: Allow applications to opt coding runs into verified empty-repository initialization. Prepare the default branch without a seed commit, report the first-delivery instructions, and guard its push against updating an existing remote branch. Keep missing branches in populated repositories as checkout failures.
- 13620d9: The runner and an application's CLI can now be installed and updated from npm when the application serves no tarball of them and names the exact npm version instead (`agents.dist.npm`). The install script asks with `accept=npm`; for an npm answer it checks for Node.js 24 or newer and `npm` (or `NOCOBASE_NPM`), runs `npm install --prefix <prefix>/versions/<version> --no-save --no-audit --no-fund --omit=optional <package>@<version>` and writes a launcher at `versions/<version>/bin/<command>`, so `current`, the linked command and the runner's user service work as they do for a tarball, and links `<prefix>/node` to the Node.js it checked. The runner declares the `npm` feature and installs a heartbeat's `npmUpgrade` the same way between runs; `nocobase-runner update` and `<cli> update` follow either answer, and an installation moves between tarball and npm versions in both directions (`installNpmVersion`, `npmLauncherScript` and `UpdateTarget` in `@nocobase/app-cli-client/install`). An application that answers no npm form is handled exactly as before.

  `@nocobase/agent-runner` and `@nocobase/app-cli-client` now depend on exactly the `@nocobase/agent-protocol` they were built with, and `@nocobase/studio-cli` and `@nocobase/agent-runner` on exactly their `@nocobase/app-cli-client`, so a version installed from npm behaves as it was built.

  `nocobase skills sync` no longer reads Skills from a packaged application CLI (a dependency declaring `nocobase.cli`, such as `@nocobase/studio-cli`): its `skills/` is for that command's users. NocoBase Studio declares `@nocobase/studio-cli`, so its build pins `nb-studio` to the version it was built with, and its CLI documentation and home-page agent prompt say that `nb-studio` needs Node.js 24 or newer with npm. The application development Skill documents `nocobase cli build --universal`.

- d3f6672: A new migration, `202610220020_studio_rename_activity_namespace`, moves the i18n namespace of the owner notices workflows already recorded (`owner_notified` activities) from `studio` to `@nocobase/studio`, so the inbox and an issue's recent activity keep showing them translated.
- d54bae6: Route recognized issue and project links in chat Markdown through the application router, preserving deployment prefixes, queries and fragments while retaining external-link behavior and URL sanitization.
- 0cc0327: NocoBase Studio moves into this repository at `packages/apps/studio` and is published as `@nocobase/studio`. A new migration, `202610220010_studio_rename_package`, moves the migration and seed history Studio recorded under its former package name `studio` to `@nocobase/studio`, and rewrites the i18n namespace of workflow definitions copied from its software template; installations upgrade with `nocobase db apply` as usual.
- 4a11ee5: Clarify the local Coding Agent setup entry and instructions, including the nb-studio command, browser sign-in confirmation, identity and permission checks, and the separate Runner setup flow.
- af938d0: Show a setup hint when the selected home-page Runner Agent has no eligible runtime. Refresh availability while preserving the selected Agent, message draft and ability to queue messages.
- Updated dependencies [40a5679]
- Updated dependencies [91f5344]
- Updated dependencies [17a183c]
- Updated dependencies [9d28d61]
- Updated dependencies [13620d9]
- Updated dependencies [97bd30b]
- Updated dependencies [d3763a2]
- Updated dependencies [459c33f]
  - @nocobase/agent-protocol@0.1.0-beta.3
  - @nocobase/app-plugin-agents@0.1.0-beta.5
  - @nocobase/app-cli@1.0.0-beta.18
  - @nocobase/app-plugin-authentication@2.0.0-beta.4

## 1.0.0-beta.51

Imported from nocobase/studio at e4a18fd.
