# @nocobase/studio

## 1.0.0-beta.58

### Minor Changes

- 862a542: Support global default skills and transactional defaults for newly created Studio projects. Resolve skills from global through application scopes to working directories in one query, with more specific targets winning. Stop reading and exposing legacy agent skill attachments while preserving agent variables.
- ff9d41b: Show an authorized project and shared system knowledge directory with lazy trees, accurate document counts, global search, explicit creation targets, and complete permission-filtered pending reviews. Preserve single-space views, existing links and archive workflows, with consistent creation parents/permissions and per-space search diagnostic targets.

### Patch Changes

- 42aaf81: Append authorized project manager follow-ups to compatible active runs, deduplicate source comments, preserve comment authorization when dispatching multiple agents, and guard run completion with Collection optimistic revisions.
- 8e4cf26: Recover runners and agent-session bridges after a protocol upgrade. Heartbeat answers now carry the server's runner protocol (`protocolVersion`), and a runner that speaks an older protocol while no newer version is offered logs what it speaks, what the application needs and how to update, instead of looking up to date. A bridge refused for its protocol now receives the protocols the application speaks in the error's `metadata`; `acp start` then updates the CLI as `update` does and exits non-zero so its launchd, systemd or Startup service starts it again on the new version, and when no update helps it still exits non-zero after a pause rather than stopping with success. A computer whose bridge was refused as too old is shown on My agents with the commands to update it.
- a2e3dd0: Install Node.js before the nb-studio CLI in generated CI workflows and document how to update existing workflows.
- facfe5c: Clear failures when a retried agent run is dispatched or succeeds, and show queued retry explanations separately from current failures while preserving historical errors.
- c1d2601: Require owner consent before another person's comment can run on the owner's personal runner. Team runners can take the queued work directly. Keep consent within the comment's run chain, show decisions in Studio's existing Needs you card and inbox, and let the original commenter run pending or rejected work as themselves.
- 92afa27: Make My follow-ups fast for someone who owns many open issues. `GET /api/followUps` reads what every row's progress needs in a fixed number of queries instead of a few per issue, and a row no longer works out why queued work has not been claimed (`waiting`, `managerWait`): the issue's own progress (`GET /api/issueProgress/{issueId}`), shown beside the list, still does. A new `GET /api/followUps/issues?issueIds=…` answers the rows of the named issues, and the page uses it to refresh only the rows an announced change names, a burst at a time, reading the whole overview again only when the list itself changed, on reconnect, for a change that names no issue, and on its fallback poll. The follow star on an issue reads only what the viewer follows from a new `GET /api/followUps/following` (`follow-up following` on the command line) instead of the whole overview, and an agent session's issue progress reads its issues in the same fixed number of queries. The projects plugin's comment queries gain `newestByEach`, the agents plugin's runs gain `openOnEach`, and its run request list takes `subjectIds` and `statuses`.
- e23633e: Discover installed agents' real model and configuration choices before a new session's first message. Show loading, fixed, unsupported, offline and retry states, isolate settings by computer, agent and directory, and validate selected values before sending a prompt. Persist acknowledged dependent settings when existing sessions change models so reopening keeps their configuration. Bridge protocol version 2 requires upgrading the application CLI.
- 9478dc0: Use the current Studio interface language for task titles and descriptions created in My Agent sessions, respecting explicit user language requests and refreshing instructions after a language switch or session restoration.
- 1cd749c: Expose issue handoff viewing, acceptance, and rejection through generated CLI commands. Add a single declarative GET binding that supplies a request body field before a command executes, preserving handoff permissions and stale notification checks.
- 4626949: Start issue runs from the earliest linked open pull request in the same repository, allow agents to manage branches and pull request associations without rewriting pushed history, and preserve shared local branches and stashes when removing run worktrees. Only published runner-created temporary branches are cleaned up. A run that ends on another branch is preserved by that branch, without a saved head or push failure on the starting target.
- c1d2601: Preserve owner-initiated comment delegation without extra personal runner consent and retain every unfinished target and input when the commenter chooses Run as me.
- 3e562f3: Wake project managers once when delegated worker runs end, combine automatic reports with durable terminal notifications, and recover inactive manager work with a configurable structured periodic check using existing run and activity facts. Track exact PR check conclusions and actual delivery per issue so later results at the same head wake the manager again. Ignore check responses for heads that moved or pull requests that closed while the checks were being read. Avoid write transactions for ineligible or unchanged idle scans and settled CI signal retries; revalidate actual candidates under their existing locks. Preserve issue run push refreshes and personal runner consent when consuming terminal manager continuations.

  Include the committed pull request id in checks-only refresh notifications so Git updates reach only the affected issue pages.

  Check idle issues for newer inputs through their runs and the existing run/time index instead of scanning unrelated run inputs.

- bdb0581: Reduce the server load of open issue and My follow-ups pages. Issue change announcements are gathered for a moment and name the issues that changed, so a page refreshes only what it shows of them; Studio announces new runs on an issue, so issue pages, What it waits for, owner handoffs and My follow-ups fall back to a slow poll instead of polling every few seconds; a preview label the server failed to set no longer makes the issue page poll every three seconds. Polled reads check issue visibility without loading the whole issue page (`IssueQueries.visible`), What it waits for reads only the project manager's newest comments (`CommentQueries.newestBy`), My follow-ups shares lookups across its issues, and pull request marks check visibility in one read. A runner heartbeat no longer announces a runner change, waking every waiting claim and refreshing every runtimes page, unless its disk sample moved by a gigabyte, crossed the free-space threshold or changed size.
- 25be3ee: Restore the My follow-ups page and remove the unified personal workspace for now.
- 7534a32: Restore the previous task tables and remove grouped task tables for now.
- aae3508: Clear finished runs' events and prompt snapshots hourly after a configurable retention period, defaulting to 14 days. Keep run history and delivery records, and show a retention notice when an expired run has no process data.
- 6c4634b: Scope Studio's pull request announcements (`studio:git`) to the issues they affect. Stores of a moment are gathered into one announcement naming the issues the changed pull requests are linked to, and pages read again only those issues' pull requests, marks, previews and progress, through one subscription per page; an announcement it cannot tie to pull requests, and a reconnect, still refresh everything. The topic now reaches signed-in connections only, and a hidden tab no longer polls an issue's previews. Also removes a duplicated type import in the projects plugin's issue queries.
- bdb0581: A public realtime topic can be defined with `authenticated: true` (`defineTopic` and `registerTopic` of `@nocobase/app-server/realtime`): subscribing without a signed-in principal is then refused with `AUTHENTICATION_REQUIRED`, as for a user topic, and publishing skips connections without one. The projects plugin's `pm:changes`, the agents plugin's `agents:runners` and Studio's `studio:issues:runs`, whose announcements name records by id, now reach signed-in connections only. The authentication plugin opens the realtime connection again when the signed-in person changes, so a page signed in without a reload receives these topics and user topics.
- f43817d: Persist the owner's required decision and the next step as structured issue fields. Require needsYou only for authenticated Studio project-manager direct status updates to Blocked or In review, keep generic and human progress input optional, clear it when work resumes, and clear next when work ends. Studio displays these fields without extracting progress or delivery notes from comments and links to the project manager's latest explanation.
- 6dae113: Fix chat submission on HTTP origins by generating UUID v4 message correlation IDs with crypto.getRandomValues instead of the secure-context-only crypto.randomUUID.
- 0afcdb7: Show one current decision card on issue pages, share its text with follow-up lists, and refresh issue details, comments and progress on live changes.
- 760235c: Stop bare Markdown URLs before adjacent CJK text and full-width punctuation.
- Updated dependencies [42aaf81]
- Updated dependencies [8e4cf26]
- Updated dependencies [8558f9f]
- Updated dependencies [facfe5c]
- Updated dependencies [c1d2601]
- Updated dependencies [c1d2601]
- Updated dependencies [69e212c]
- Updated dependencies [92afa27]
- Updated dependencies [943a9a8]
- Updated dependencies [943a9a8]
- Updated dependencies [facfe5c]
- Updated dependencies [e23633e]
- Updated dependencies [1ccefb5]
- Updated dependencies [9478dc0]
- Updated dependencies [862a542]
- Updated dependencies [1cd749c]
- Updated dependencies [4626949]
- Updated dependencies [c1d2601]
- Updated dependencies [bdb0581]
- Updated dependencies [7534a32]
- Updated dependencies [aae3508]
- Updated dependencies [f36da62]
- Updated dependencies [6c4634b]
- Updated dependencies [99be3d0]
- Updated dependencies [bdb0581]
- Updated dependencies [f43817d]
- Updated dependencies [9b946f4]
- Updated dependencies [ff9d41b]
  - @nocobase/app-plugin-agents@0.1.0-beta.11
  - @nocobase/agent-protocol@0.1.0-beta.8
  - @nocobase/app-plugin-agent-sessions@0.1.0-beta.1
  - @nocobase/app-server@2.0.0-beta.7
  - @nocobase/app-cli@1.0.0-beta.22
  - @nocobase/db@1.0.0-beta.20
  - @nocobase/app-plugin-projects@0.1.0-beta.9
  - @nocobase/app-plugin-releases@0.1.0-beta.5
  - @nocobase/app-plugin-authentication@2.0.0-beta.9
  - @nocobase/app-plugin-database-explorer@1.0.0-beta.15
  - @nocobase/app-plugin-knowledge@0.1.0-beta.4

## 1.0.0-beta.57

### Minor Changes

- 6fc0af2: Require the issue owner to start or continue Studio project manager work, and ignore agent wakeups from comments on unstarted issues. Run the manager and its delegated steps as the current owner while preserving trigger audit information. Withdraw all queued agent work and request cancellation of held runs on owner transfers, without automatically restarting them. Correct legacy queued identities before claim and expose waiting reasons.

  Expose the existing transactional `Projects.activity` recorder for application issue events and deliver owner transfers to all work kinds before ordinary triggers, including executor clearing. Restore Studio wording for models, efforts, the start dialog and historical sub-issue activity.

  Preserve delegated execution identity throughout repeated retries, including handled inputs, and show the initiator of the current retry instead of copied retry history.

- 157a914: Add My agents: talk in Studio with the coding agent on your own computer (Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, OpenCode and more, on macOS, Linux or Windows), connected once with `nb-studio acp service install` and online whenever the computer is on. A page with no computer connected yet walks you through connecting it, and suggests using the strongest model you can. The agent analyzes and plans with you, and records the development you agree on as issues for the project manager, who assigns agents and moves them along once you start them; very small changes, such as a typo, it makes itself. It works with full access in the folder you choose by browsing your computer, for the project you choose, and creates and finds Studio issues through Studio's tools, in that project unless you name another; mention an issue in a message with `#`. The agent treats the session's issues as the tasks you mean, learns what changed on them since your last message, and can tell how each is going: who works on it, what it waits for, its pull request. The issues a session creates wait in backlog and show in the conversation, where you start the ones you keep in one step, and in the session list with their project and status. When your agent waits for your permission, replies or stops with an error while you are not looking at the session, your inbox tells you, one item per session that opens it, and the item settles once you have seen the session.
- 3af6c30: Add "My follow-ups" (`/follow-ups`), right above My issues in the sidebar and behind the same page grant. The left column keeps up to five issues the person follows, each with what it waits for now (or what it needs from them) and how many comments and changes others made since they last looked; until they choose, it shows their blocked and in-review issues. The middle column shows one issue live: its status, pull request with checks and conflicts, the "Now" and "Next" lines, what it needs from the person, and its activity told as hand-overs, replies, reviews, pull request and status events rather than raw comments, long comments shortened to their first line with the rest on request. The right column lists the issues the person owns, filtered by several statuses at once (In review when the page opens) and by title or key, each saying what it needs from them; a star follows or stops following an issue. `GET /api/followUps` (`follow-up list`) answers the overview, `PUT /api/followUps/following` replaces the followed issues and `POST /api/followUps/issues/{issueId}/markSeen` records a look; both are kept as the person's own preferences, so nothing needs migrating.
- 0e28a3c: Redesign the issue page around a live summary and feed shared with "My follow-ups". A summary pinned at the top of the issue page carries the title on a line of its own (the page's heading, renamed in place with its pencil), then the key, status and actions, the pull request with its checks and conflicts, the "Now" line with Start and the hand-over, what the issue needs from the viewer, and, in review, the delivery: the agent comment that tells what was delivered (cut short, with Show more) with Merge, View changes and Send back (to In progress). While the page is scrolled down, and from the start on a phone, it folds to a one-line bar with the status, the title and what waits for the viewer (Merge, Answer, or Take over and Reject on an owner handoff); one click opens it again, and "Collapse summary" folds it by hand. The body card below no longer repeats the title and status: it starts with the parent, the project, the marks, Ask agent and Delete. A star follows the issue in "My follow-ups" ("Following · n/5"; held with the reason once five are followed). The activity now runs newest first, a thread placed where its latest reply is, with "Conversation only" (the default) folding each stretch of system records (runs and changes other than status moves, pull requests and owner handoffs) into one "N system records" row that unfolds in place, and "All" showing every record; long comments are cut to a few lines with Show more and Show less, the comment shown above as the delivery notes reads as one line that unfolds in place, and the project manager's hand-overs and agents' review verdicts are tagged. Comments keep replying, editing, deleting, resolving, reactions, files and comment links, and the composer stays pinned under the activity. The side column's subscribers card is now titled "Notifications". "My follow-ups" shows the selected issue with the same summary, feed and composer, so a reply needs no trip to the issue page and comments show their screenshots as thumbnails that open the preview, and their other files as chips; its side columns stay in place while the middle scrolls, and on a phone the lists come first and choosing an issue shows it alone with a way back. Following one issue is now a request of its own, `POST /api/followUps/issues/{issueId}/follow` and `/unfollow` (`nb-studio follow-up follow <issue>` and `follow-up unfollow <issue>`, by id or identifier): following an issue already followed or unfollowing one not followed changes nothing, and a sixth is refused with `FOLLOWING_LIMIT_REACHED`; the star on both pages uses them, so two tabs no longer overwrite each other's list. `PUT /api/followUps/following` still replaces the whole list.
- f3a3f18: Make the issue pages and My follow-ups work on a phone, and tighten the issue summary.

  - **Phone:** these views go edge to edge with a single 16px inset: lists are full-width rows with hairline dividers (title 15px, one-line status), the issue view has a 20px title, icon actions, a plain Now row, a full-width Needs-you band and muted bands between sections. My follow-ups and an issue's page hide the app header and draw their own row with Back (or the page heading), the agent chat button and the navigation. My follow-ups shows one list at a time under two bottom tabs, "Following" and "Issues I own", each with a count of what needs a look; choosing an issue shows it alone. The comment composer starts as a slim "Write a comment…" bar that opens on tap (and from Reply or Answer) and folds again once sent or left empty.
  - **Summary:** the summary scrolls with the page, and a one-line bar (status, title, what waits for you: Merge, Answer, Take over) stays at the top once it has scrolled away. On a phone the summary starts as that bar. Key, status and actions sit on their own rows on narrow screens.
  - **Now and Next:** "Now" is one short line from the progress (agent, state, time, runner) that opens the live run's record, "Nothing is running" when idle. "Next" is the manager's line rendered as inline Markdown. Both are cut to two lines with Show more.
  - **Needs you:** what waits for you is one card: accepting the work ("Accept PR #N — title", checks, the manager's delivery report, then Merge, Mark as merged, View changes and Send back), taking over a handoff, or answering a question. Without one, the summary shows the pull request on one line with its checks and preview.
  - **Delivery report:** the delivery shown is the project manager's report (a comment with "What was asked", "Key changes" or "Open issues" headings, or their Chinese forms) around the latest move to In review. Otherwise it is the latest agent comment, labelled as such.
  - **Issue body:** "Waiting for you" leaves out what the card already shows, and the body no longer repeats the agent-working pill.
  - **My follow-ups cards:** asks read as a short first sentence and status as one short line, never the manager's prose.
  - **Header:** the header shows the agent chat as an icon button again, in place of the "Ask Agent…" input. The account menu gains "Use Studio in your agent", which opens the `nb-studio` setup dialog.

- ddfe1b1: Replace workflows with a project manager and agents discovered from runners. Issues have six fixed statuses (Backlog, In progress, Blocked, In review, Done, Cancelled); a new issue is started now or later, and "Start" on a backlog issue wakes the project manager. One project manager (`studio-project-manager`) executes every issue given to agents: each turn it hands one step to an agent by what the agent's description says it is good at, from a roster of the enabled agents with whether a runner can take their work and how busy they are, asks a person (Blocked) or hands the issue over for acceptance (In review), and starts each comment with a "Next" line. It works in a directory of its own without a checkout; a step that changes no code is handed over as read-only and runs in a read-only checkout alongside the step that writes. Its settings (Agents › Project manager, `GET`/`PATCH /api/projectManager`, `project-manager get|update`) choose the agent it runs with and a fallback, its allocation principles (built in, editable, restorable) and how many runs agents' comments may start per issue (20 a day by default). Besides failing checks and conflicts, a linked pull request whose checks all passed wakes it once per head commit (`prChecksPassed`, switch `wakeOnChecksPassed` per repository). The issue page's "Now" line says what the issue waits for (`GET /api/issueProgress/{issueId}`), and the pull request toggle reads "Complete the issue when merged" or "Merging does not change the issue". The Agents page lists the agents discovered from runners to enable; online agents, the project assistant, chat model choice, agent presets, workflows, stage rules, design proposals, approvals, checklists, executor admission rules, retrospective rules and putting small knowledge bases into prompts are removed; conversations and AI intake pick an enabled agent. A finished run reads "Turn ended".

  Upgrading: let running agent runs finish (or stop them) first. The migrations map issue statuses to the fixed ones, hand every issue an agent executed to the project manager, remove all existing agents (their names stay in history) and cancel their queued runs, delete workflows, stage guards, approvals and checklists, and withdraw the inbox decisions about them; nothing is woken, and an open issue shows "Hand over to the project manager" until someone does. Working directories, `agent/<KEY>` branches and pull requests are kept. Afterwards, enable the agents your runners report (Agents) and choose the project manager's agent (Agents › Project manager).

- 7271a1d: Separate required and reference checks on pull requests. A repository's settings name its reference checks: their failures are shown but neither wake the agent nor block merging from Studio. Failed required checks wake the agent once every required check of the head has finished, and the input carries each failed check's annotations and log excerpt, or the external CI's link when GitHub has no log. `nb-studio pr checks <issue> <pr>` reads the same explanation on demand, also from a run. A project manager can merge past failed required checks with a reason (`pr merge --force --reason`): Studio comments the reason and the failed checks on the pull request first and records the outcome in the issue's activity, while GitHub's branch protection still applies. Adds the migration `202610240010_studio_repo_reference_checks`.

  Required checks that are still queued or running block both ordinary and forced merges even when another required check failed. Passing-check signals use the required-check summary, so reference failures do not suppress them.

  Both the issue page and inbox open the latest merge preflight when their stored checks have failed, allowing authorized users to reach force confirmation while ordinary merging remains blocked.

### Patch Changes

- e9d24e3: Clarify that project manager status candidates describe the current issue state and can change when work resumes.
- aefa4ac: Fix the issue page's title being squeezed down to a few characters at 1280px when the AI assistant panel is docked beside it. `IssueDetailLayout`'s side column and `IssueHeader`'s actions now respond to the page's own width through a container query instead of the viewport, so a docked panel narrowing the page is detected the same way a narrow window is. Below that width, "Ask agent" and "Delete" collapse to icon-only buttons with a tooltip, leaving the title the room it needs.
- 10e261b: Use a private linked Git worktree per run and save local continuation after stopping its tools. Fast-forward the resume reference, retain divergent heads as separately listed saved references, and preserve the directory on cleanup failure. Keep Codex state outside disposable worktrees. Other tools start fresh when their code directory changes; legacy sessions and clones are not migrated. Distinguish private local branches from task push targets and retain older runner compatibility.
- 9e99702: Add a lightweight SMTP/Resend mailer and host email service using the existing notification channel configuration. Built-in notification email Providers delegate to the shared transport implementation while retaining their registration and submission-result contracts. Email diagnostics now use fixed messages that cannot expose provider bodies or credentials.

  Add explicitly enabled automatic password recovery through the host mailer, with bounded background submission, account-independent rate limiting, account-state checks. Existing custom senders remain available when no password reset switch is declared; explicit disablement or disabling password sign-in closes all reset endpoints. Only automatic recovery defaults to revoking existing sessions, and explicit session configuration wins.

  Register the host mailer in both templates and Studio, add bilingual reset success and retry feedback, and show opt-in recovery in Studio's example configuration. Operators must explicitly enable recovery and configure an enabled SMTP/Resend channel in their deployment; existing deployments are not modified.

  Automatic credential links require an explicitly configured public origin (`app.publicOrigin` / `APP_PUBLIC_ORIGIN`), or a direct Better Auth consumer's restricted host configuration, so a client-controlled Host cannot choose the reset-link destination. Custom sender configuration remains compatible.

  Reject malformed SMTP authentication settings when validating email channel availability.

  Keep default SMTP password and Resend API key environment mappings optional and secret in deployment manifests. Applications may explicitly require selected credentials, while enabled email channels still validate their configuration.

  Space recovery links on reset error pages in both templates and Studio, allowing them to wrap on narrow screens.

  Request-logging middleware remains unchanged. Default email links first reach a token-bearing API path, which request path/message logs may record. Default output sanitizes token query values in Referer strings, while raw/custom outputs may still retain them; deployment and request-log protection need separate follow-up before exposing this flow.

- 1897123: Truncate long sidebar versions and show the full version in a tooltip.
- ee24e95: Clean idle build artifacts before pushed workspaces when disk space is low, pause new work until heartbeats detect recovery, and report disk-full failures for reassignment without counting a project-manager step failure. Show current disk capacity and workspace size, type and push diagnostics.

  Retry interrupted removal of verified pushed attempt directories from GC or the next run, stop their remaining processes before deleting remnants, and retain cleanup failure reasons without blocking later tasks. Preserve unpublished or uncommitted work for recovery.

  Verify the actual checkout branch and HEAD before retrying removal, report disk exhaustion even when local preservation metadata or events cannot be written, and continue safe pressure cleanup when diagnostic cache writes fail.

- 4748117: Allow the project manager to use an idle fallback after a configurable queue delay, exclude runners that cannot honor its workspace, and show selection and waiting reasons. Persist queue episodes through retries and restarts, withdraw unclaimed manager delegations after a configurable timeout, reliably report their cause in the dispatch thread, and publish identity-aware immediate capacity in each manager roster.
- cb009d7: Pause agent work after an owner transfer until the new owner accepts. Add owner acceptance and rejection in issue pages and inbox decisions, with transfer activities and localized waiting reasons.
- fad531f: Initialize the project manager's name and description once in the installation's default language and allow administrators to edit them, including clearing the description. Restarts and unrelated settings saves preserve the identity. Later changes to the installation language do not rename an initialized manager.

  An upgrade seed preserves valid explicit settings, custom legacy agent values, empty descriptions, and unknown settings. Legacy agent values identical to the former built-in English defaults cannot be distinguished from manual writes and are initialized in the upgrade language when no valid explicit setting exists. A damaged `studioSettings.projectManager.value` stops initialization with a repair instruction instead of overwriting it.

  Resolve historical run inputs, notifications, delegation cards, plans, and consultation identity labels from stable agent IDs without rewriting historical text or execution snapshots. Legacy limit notices and plans whose identity cannot be recovered use neutral labels, and unresolved consultations mark the originally requested subject. Refresh identity caches when the manager is renamed.

  Mount application query effects inside the projects plugin's cache using its optional `queryEffects` composition point. Keep completed consultation labels current after renames and distinguish loading, inaccessible agents, and historical request snapshots.

- a2cf036: Interrupt agent runs for runner updates after stopping tools and preserving local continuation references. Requeue upgrade interruptions without consuming failure attempts or notifying project managers, retain task inputs, and report draining capacity and reasons in runner and queue views.
- 7a806c1: Fix My follow-ups on a wide screen cutting off the ends of its side columns: the three columns now fill the visible area below the page heading, measured from the area the page scrolls in rather than the window, and each scrolls on its own, so the last of many owned issues and the last followed issue can be reached.
- 6758f9f: Align follow-up progress dependencies with issue context and agent availability so Studio builds with queued-work waiting reasons.
- 960d3d5: Fix My follow-ups' "Issues I own" column on a wide screen being cut off with no way to scroll: the page now fits the shell's scroll area through its layout rather than a measured height, the owned list scrolls under its filters with the mouse wheel, and each column shows a thin scrollbar.
- 3326368: A failed personal GitHub authorization now explains why on the account page and is logged on the server, and a GitHub App without Device Flow is reported as such instead of "GitHub could not be reached".
- ae40a7e: Issue Git push credentials to runners on demand. A runner that announces the `gitCredentials` feature now asks Studio for a GitHub App installation token whenever git needs one, instead of keeping the single token handed out with the claim, so runs that outlast one token (about an hour) can still push. The token keeps the same scope: the run's repositories of that connection with `contents: write`. A cached token is reused only while it has at least 30 minutes left, and a refresh after GitHub refused the last one always mints a new token. Older runners keep getting one token with the claim, and personal token connections are unchanged.
- de18bb5: Make the inbox the default landing page: `/` redirects signed-in users to `/inbox`, preserving query and fragment. Order the sidebar as My tasks, Inbox and Dashboard, remove the Home entry and the header inbox button, and retain the live inbox count in the sidebar. Move the chat composer to `/chat` and redirect legacy `/home` links there.
- 6758f9f: Add offline `skills install` and `skills status` commands for branded CLI packages that ship the nb-studio-cli Skill, with Claude Code and Codex detection, explicit tool selection, dry-run output and content comparison. Register installed locations and synchronize them from the new package after CLI self-update, preserving older copies on replacement failure and reporting synchronization warnings without failing the CLI upgrade. The update JSON payload gains an optional `skills` result and envelope warnings; local Skill commands return their payload under `result.data`. Preserve documented exit codes when static commands fail with JSON output.

  Document local installation, Codex's current user Skill directory and legacy-copy behavior, and reinstalling Skills after external CLI upgrades.

  Reject nested installation destinations before writing any target, including destinations registered by earlier installs. During self-update, preserve conflicting copies and their records, report warnings, and continue synchronizing unrelated destinations.

- abc3fcb: Keep enabled agents prominent, group new discoveries by tool and catalog model, and persist shared ignore and restore preferences with revision protection. Choose a provider without changing existing execution identities and show personal runner names. Discover only authenticated Pi providers and prevent model overrides from bypassing that filter. In Studio, authorize runs through their running identity and existing command scope instead of intersecting with legacy agent action lists, including reports, while retaining object permissions, credential scopes, read-only modes and human approval requirements.

  Show recognizable provider and runner labels when selecting a model and cap atomic bulk discovery operations at 256 selected groups with explicit counts and limits.

- 15d5b99: Remove the Agent chat button from desktop and mobile headers while keeping the keyboard shortcut and other chat entry points available.
- Updated dependencies [157a914]
- Updated dependencies [ddfe1b1]
- Updated dependencies [933694f]
- Updated dependencies [10e261b]
- Updated dependencies [9e99702]
- Updated dependencies [6fc0af2]
- Updated dependencies [ddfe1b1]
- Updated dependencies [0e28a3c]
- Updated dependencies [ddfe1b1]
- Updated dependencies [ee24e95]
- Updated dependencies [4748117]
- Updated dependencies [cb009d7]
- Updated dependencies [fad531f]
- Updated dependencies [a2cf036]
- Updated dependencies [a1d02ff]
- Updated dependencies [abc3fcb]
  - @nocobase/app-plugin-agent-sessions@0.1.0-beta.0
  - @nocobase/app-plugin-agents@0.1.0-beta.10
  - @nocobase/agent-protocol@0.1.0-beta.7
  - @nocobase/app-server@2.0.0-beta.6
  - @nocobase/app-plugin-authentication@2.0.0-beta.8
  - @nocobase/app-plugin-notification-providers@0.2.0-beta.12
  - @nocobase/app-plugin-projects@0.1.0-beta.8

## 1.0.0-beta.56

### Patch Changes

- 65ec64a: Preserve failures after issue status transitions, isolate background card reconciliation failures, and return a specific failed precondition for repeated retries.
- 65ec64a: Prevent concurrent and repeated retries of the same run, retain retry attribution, and link retried runs to their replacements. Automatically settle obsolete failed-run decisions after retries, new work, reassignment, or issue completion, including outstanding cards from earlier releases.
- Updated dependencies [65ec64a]
- Updated dependencies [65ec64a]
  - @nocobase/agent-protocol@0.1.0-beta.6
  - @nocobase/app-plugin-agents@0.1.0-beta.9

## 1.0.0-beta.55

### Minor Changes

- 3668ab1: Let an agent's comment wake other agents, so one agent can hand work to another and be woken by its reply. A comment of anyone but the system now reaches the work handlers, with the person it was written for (`CommentChange.userId`). In Studio, an agent's comment wakes the agents it mentions, never itself and never the agent whose comment it answers; mentioning no agent, it wakes the issue's executing agent unless it mentions a person or the executor wrote it. It acts for the person its run acts for (the issue's owner when no run wrote it). A workflow's new `commentRunLimit` (20 by default, edited in the workflow's Limits card or through `definition.commentRunLimit`) caps such runs per issue within 24 hours; past it the comment starts nothing (`work_skipped`, reason `limited`), the owner is notified, and a person who may edit the issue can continue it once from the issue page. A run an agent's comment started always answers in that comment's thread once it ends: with its final output when it completed without commenting, or with why it failed when it failed for good; `CommentWriter.post` takes `forUserId`, the person the triggers hear the comment was written for.
- 3668ab1: Tell each issue run what was said since the agent's last run. A subject's assembly may add a note to the turn of a resumed session (`turn.resumed`) or of a fresh one (`turn.fresh`), chosen once the claim knows which it is. The comment threads list (`GET /api/projects/issues/{issueId}/comments`, `issue comment list`) takes `since` to return only what was written after it. Studio uses both: a resumed run hears that no comment arrived, the few new comments, or how many and the `--since` command that reads them; a fresh session or a first run is told to read the issue's comments before acting.

### Patch Changes

- dcdc0c9: Move issue execution history below details in the sidebar, display run models, and preserve loading, error and keyboard focus behavior in narrow containers.
- Updated dependencies [3668ab1]
- Updated dependencies [d54dd59]
- Updated dependencies [d54dd59]
- Updated dependencies [3668ab1]
- Updated dependencies [693e43d]
  - @nocobase/app-plugin-projects@0.1.0-beta.7
  - @nocobase/app-plugin-authentication@2.0.0-beta.7
  - @nocobase/app-cli@1.0.0-beta.20
  - @nocobase/app-plugin-agents@0.1.0-beta.8
  - @nocobase/app-plugin-api-keys@1.0.0-beta.16
  - @nocobase/app-plugin-authz-default-access@1.0.0-beta.13
  - @nocobase/app-plugin-authz-restriction-rules@1.0.0-beta.12
  - @nocobase/app-plugin-authz-sharing-rules@1.0.0-beta.13
  - @nocobase/app-plugin-database-explorer@1.0.0-beta.14
  - @nocobase/app-plugin-i18n@1.0.0-beta.16
  - @nocobase/app-plugin-knowledge@0.1.0-beta.3
  - @nocobase/app-plugin-releases@0.1.0-beta.4

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
