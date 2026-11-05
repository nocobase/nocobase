# Changelog

All notable changes to NocoBase 3 are documented in this file, one section per release: `nocobase-v3-beta/<date>.<n>` for a beta and `release/<date>.<n>` for a stable release. The versions each release published are on its GitHub Release, and every package's own changes are in its CHANGELOG.md.

## [nocobase-v3-beta/2026-11-05.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-05.2)

### 🚀 Improvements

- **[Agents]** Let applications start independent agent sessions with bounded handoff summaries. ([#11341](https://github.com/nocobase/nocobase/pull/11341)) by @2013xile
- **[App foundation]** App foundation statistics now show a plain metric name before each value, with the same name on the summary cards and in capability details. ([#11342](https://github.com/nocobase/nocobase/pull/11342)) by @katherinehhh

### 🐛 Bug Fixes

- **[Release management]** Keep environment App inputs aligned when their labels wrap. ([#11338](https://github.com/nocobase/nocobase/pull/11338)) by @gchust

## [nocobase-v3-beta/2026-11-05.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-05.1)

### 🎉 New Features

- **[Agent runner]**
  - Let runs use the official Gitea CLI with their supplied credentials. ([#11313](https://github.com/nocobase/nocobase/pull/11313)) by @2013xile
  - Run DeepSeek Harness as a coding tool on execution machines through ACP. ([#11314](https://github.com/nocobase/nocobase/pull/11314)) by @2013xile
- **[Notifications]** Show registered notification scenarios and safe synthetic content previews in a unified read-only template directory. ([#11331](https://github.com/nocobase/nocobase/pull/11331)) by @katherinehhh
- **[Users]** Keep users' selected language across browsers and devices, and let background tasks resolve their preferred language by user ID. ([#11332](https://github.com/nocobase/nocobase/pull/11332)) by @mytharcher
- **[App templates]** Applications built from the templates show administration as one System settings entry that opens a home page of cards by category, with tabs inside each module. ([#11333](https://github.com/nocobase/nocobase/pull/11333)) by @katherinehhh

### 🚀 Improvements

- **[App templates]** Unify the Default and Examples sidebar and sign-in slogans as “AI + NocoBase” and “Build reliable business systems”, and remove the template name from the Default footer while keeping its version. ([#11321](https://github.com/nocobase/nocobase/pull/11321)) by @katherinehhh
- **[Agent sessions]**
  - Show usage in My Agent's session details as rows, the same way as runner conversations. ([#11329](https://github.com/nocobase/nocobase/pull/11329)) by @zhouyanliang
  - Simplify Runner Agent and My Agent session rows by removing secondary agent, runtime and project labels. ([#11330](https://github.com/nocobase/nocobase/pull/11330)) by @zhouyanliang
  - Show a linked task's full-width title in session details, with its key and status on the line below. ([#11335](https://github.com/nocobase/nocobase/pull/11335)) by @zhouyanliang
- **[Agents]** The runtime drawer's overview, workspaces and runs tables give their width to tool quotas, directories and issues instead of short columns, so sizes, types and agent names are no longer cut off. ([#11336](https://github.com/nocobase/nocobase/pull/11336)) by @zhouyanliang

### 🐛 Bug Fixes

- **[Demo mode]** Open protected demo links automatically while keeping the current account and destination URL. ([#11319](https://github.com/nocobase/nocobase/pull/11319)) by @gchust
- **[Agents]** Remove restored conversations from the archived list automatically. ([#11320](https://github.com/nocobase/nocobase/pull/11320)) by @gchust
- **[Authentication]** Give accurate registration feedback, sign in new accounts by default, and warn about configurations that cannot explain the next step. ([#11322](https://github.com/nocobase/nocobase/pull/11322)) by @katherinehhh
- **[Server]** Give a request ten minutes to arrive instead of five, so a large upload over a slow link is no longer cut off with HTTP 408. ([#11323](https://github.com/nocobase/nocobase/pull/11323)) by @gchust
- **[CLI]** Restart running background agent connections after CLI upgrades and provide recovery steps when agent settings cannot load. ([#11334](https://github.com/nocobase/nocobase/pull/11334)) by @zhouyanliang

## [nocobase-v3-beta/2026-11-04.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-04.1)

### 🎉 New Features

- **[Server]** Configure named application mailers once for password reset, invitations and email notifications while retaining existing sender configurations. ([#11284](https://github.com/nocobase/nocobase/pull/11284)) by @cgyrock
- **[Caching]** Keep custom cache drivers isolated between applications while allowing registration before first use. ([#11302](https://github.com/nocobase/nocobase/pull/11302)) by @cgyrock

### 🚀 Improvements

- **[Interface]**
  - Share conversation headers across pages and panels, with optional related-work details and list-first navigation. ([#11285](https://github.com/nocobase/nocobase/pull/11285)) by @2013xile
  - The agent sessions page and the side panel share one workspace that adapts to the space it has, so they look and work the same. ([#11312](https://github.com/nocobase/nocobase/pull/11312)) by @2013xile
- **[Database]** Applications and plugins can recognize duplicate-key errors consistently across supported databases without treating unrelated SQLite constraints as duplicates. ([#11298](https://github.com/nocobase/nocobase/pull/11298)) by @mytharcher
- **[App foundation]** Keep App Foundation results across restarts and update them in the background on refresh or kernel changes, with compact statistics and clear historical states. ([#11300](https://github.com/nocobase/nocobase/pull/11300)) by @katherinehhh
- **[Agents]** Explain why Runner conversations are waiting and allow withdrawing an unclaimed turn before choosing another Agent. ([#11303](https://github.com/nocobase/nocobase/pull/11303)) by @2013xile
- **[App templates]** Move theme settings into the account menu in both application templates while preserving saved preferences. ([#11309](https://github.com/nocobase/nocobase/pull/11309)) by @katherinehhh

### 🐛 Bug Fixes

- **[Mail]** Allow IMAP/SMTP users to move, archive and delete the selected folder copy safely, with explanations when an action is unavailable. ([#10895](https://github.com/nocobase/nocobase/pull/10895)) by @cgyrock
- **[Files]** Center images in file preview dialogs. ([#11292](https://github.com/nocobase/nocobase/pull/11292)) by @katherinehhh
- **[App foundation]** Preserve database model associations through proven local callbacks and query accessors, and reject malformed request header names. ([#11293](https://github.com/nocobase/nocobase/pull/11293)) by @katherinehhh
- **[Interface]**
  - Show the last two characters of Chinese, Japanese and Korean names in default text avatars, ignoring spaces. ([#11294](https://github.com/nocobase/nocobase/pull/11294)) by @katherinehhh
  - Conversation details open inside the conversation and close when you press outside them, on desktop and phone. ([#11304](https://github.com/nocobase/nocobase/pull/11304)) by @2013xile
- **[Agents]** Let applications admit agent runs under their executing user's permissions and let runs change only their own comments from the current run. ([#11307](https://github.com/nocobase/nocobase/pull/11307)) by @2013xile

## [nocobase-v3-beta/2026-11-02.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-02.1)

### 🚀 Improvements

- **[Agents]** Applications can order conversation-linked work by its latest update without additional requests. ([#11283](https://github.com/nocobase/nocobase/pull/11283)) by @2013xile
- **[Users]** Invited users can choose an optional username and correct conflicts without losing their form. ([#11289](https://github.com/nocobase/nocobase/pull/11289)) by @2013xile

### 🐛 Bug Fixes

- **[Agents]**
  - Explain exhausted tool quota and known reset times for queued runs instead of reporting unavailable tools. ([#11279](https://github.com/nocobase/nocobase/pull/11279)) by @zhouyanliang
  - Continue unreceived queued messages after stopping a Runner turn without creating duplicate messages. ([#11282](https://github.com/nocobase/nocobase/pull/11282)) by @zhouyanliang
- **[Projects]** Show why a saved comment did not start work, including when the comment run limit was reached. ([#11280](https://github.com/nocobase/nocobase/pull/11280)) by @2013xile
- **[Agent sessions]** Press Enter for new lines on phones and use the send button to submit personal agent messages. ([#11281](https://github.com/nocobase/nocobase/pull/11281)) by @app/nocobase-studio
- **[App foundation]** Restore evidence-backed data model associations through guarded service factories in App Foundation. ([#11287](https://github.com/nocobase/nocobase/pull/11287)) by @katherinehhh

## [nocobase-v3-beta/2026-10-31.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-10-31.1)

### 🎉 New Features

- **[Realtime updates]** Redis-backed realtime now requires explicit registration of the commercial broker plugin, while single-instance applications retain the built-in Memory broker. ([#11258](https://github.com/nocobase/nocobase/pull/11258)) by @cgyrock
- **[App templates]** Add a four-step employee onboarding example with private recoverable drafts, conditional validation and duplicate-safe employee creation. ([#11259](https://github.com/nocobase/nocobase/pull/11259)) by @katherinehhh

### 🚀 Improvements

- **[Projects]** Read issue details and refresh progress with fewer database queries. ([#11264](https://github.com/nocobase/nocobase/pull/11264)) by @2013xile
- **[Concurrency]** Keep local locks held until explicit release, task completion, or application shutdown without treating lease durations as task timeouts. ([#11269](https://github.com/nocobase/nocobase/pull/11269)) by @cgyrock
- **[Agents]** Keep runner conversations current with fewer duplicate reads and batch linked work in conversation lists. ([#11272](https://github.com/nocobase/nocobase/pull/11272)) by @2013xile

### 🐛 Bug Fixes

- **[Realtime updates]** Reduce repeated requests when opening tasks, inboxes and conversations while preserving live updates. ([#11257](https://github.com/nocobase/nocobase/pull/11257)) by @2013xile
- **[Agents]**
  - Show the saved Agent description when reopening its editor immediately after saving. ([#11268](https://github.com/nocobase/nocobase/pull/11268)) by @2013xile
  - Distinguish workspace preparation from Agent startup and keep received replies before queued follow-ups. ([#11271](https://github.com/nocobase/nocobase/pull/11271)) by @2013xile
- **[Agent sessions]** Show the session list before the details on narrower pages, and remember whether My Agent's details are open. ([#11275](https://github.com/nocobase/nocobase/pull/11275)) by @gchust

## [nocobase-v3-beta/2026-10-30.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-10-30.1)

### 🎉 New Features

- **[Concurrency]**
  - Application developers can coordinate fixed-TTL critical sections through a reusable concurrency API and in-process backend, with cancellable waits, safe timer-failure handling, deadline-safe shutdown and automatic backend cleanup. ([#11209](https://github.com/nocobase/nocobase/pull/11209)) by @cgyrock
  - Applications can configure named process-local concurrency services and share one lock manager across plugins. ([#11256](https://github.com/nocobase/nocobase/pull/11256)) by @cgyrock
- **[Background jobs]** Redis-backed background and scheduled jobs now require the commercial Jobs Redis Server plugin, while Memory jobs remain available without it. ([#11229](https://github.com/nocobase/nocobase/pull/11229)) by @cgyrock
- **[Authentication]** Configure password recovery with an independent SMTP or Resend sender while preserving existing custom callbacks and legacy email channels. ([#11233](https://github.com/nocobase/nocobase/pull/11233)) by @cgyrock
- **[Database]** Support portable case-insensitive text searches with a LOWER expression in database queries. ([#11236](https://github.com/nocobase/nocobase/pull/11236)) by @2013xile
- **[Agents]**
  - Choose and retain a supported reasoning effort for each Runner conversation. ([#11239](https://github.com/nocobase/nocobase/pull/11239)) by @2013xile
  - Allow Runner conversations to use project repositories and preserve their workspace when changing Agents. ([#11244](https://github.com/nocobase/nocobase/pull/11244)) by @2013xile

### 🚀 Improvements

- **[Agents]**
  - Remove legacy Agents vector collections in Agents 2, with migration guidance and retained data, while preserving model services and Knowledge indexing. ([#11216](https://github.com/nocobase/nocobase/pull/11216)) by @cgyrock
  - Fill Agent descriptions from a compact template menu with Undo, including automatic suggestions for newer models in known families. ([#11249](https://github.com/nocobase/nocobase/pull/11249)) by @2013xile
- **[Projects]**
  - Allow applications to translate automatic comment notices using their own message types while keeping private provenance hidden. ([#11220](https://github.com/nocobase/nocobase/pull/11220)) by @2013xile
  - Allow applications to page completed task history without loading every historical task. ([#11224](https://github.com/nocobase/nocobase/pull/11224)) by @2013xile
  - Reduce repeated database and refresh requests for task details and progress. ([#11225](https://github.com/nocobase/nocobase/pull/11225)) by @2013xile
  - Load issue cards in lightweight batches and keep unrelated task details from reloading during live updates. ([#11240](https://github.com/nocobase/nocobase/pull/11240)) by @2013xile
- **[Skills]** Learn list and edit interactions from a runnable, tested example included with the application development Skills. ([#11222](https://github.com/nocobase/nocobase/pull/11222)) by @chenos
- **[Background jobs]** Redis queues now require an explicitly registered commercial Server plugin, while in-process Memory queues remain available without Redis dependencies. ([#11227](https://github.com/nocobase/nocobase/pull/11227)) by @cgyrock
- **[App templates]** Simplify new applications by removing unused client extension entry files from both templates. ([#11228](https://github.com/nocobase/nocobase/pull/11228)) by @chenos

### 🐛 Bug Fixes

- **[App templates]**
  - Template lists distinguish empty data, unmatched filters, denied access and request failures, with clear recovery actions and a verified source upgrade path for existing applications. ([#11188](https://github.com/nocobase/nocobase/pull/11188)) by @katherinehhh
  - Prevent misleading loading indicators and table jumps when opening or closing user edit drawers. ([#11218](https://github.com/nocobase/nocobase/pull/11218)) by @chenos
- **[Agents]**
  - Keep active agent conversations connected when returning, synchronize saved replies when recovery is unavailable, and clear pending browser subscriptions after confirmed completion. ([#11205](https://github.com/nocobase/nocobase/pull/11205)) by @2013xile
  - Let runners find eligible work behind up to 150 queued candidates when earlier work cannot run on them. ([#11210](https://github.com/nocobase/nocobase/pull/11210)) by @2013xile
  - Keep a run's displayed status current when it changes while its details are first loading. ([#11226](https://github.com/nocobase/nocobase/pull/11226)) by @2013xile
  - Browse runtime runs in pages of twenty with exact totals, open owned conversations by name, and keep status and quota badges consistent. ([#11238](https://github.com/nocobase/nocobase/pull/11238)) by @2013xile
  - Preserve conversation completion history when marking messages as read. ([#11251](https://github.com/nocobase/nocobase/pull/11251)) by @2013xile
  - Keep supported Agent reasoning defaults for conversations, fall back to tool defaults when unavailable, and explain when a manual selection cannot be applied. ([#11255](https://github.com/nocobase/nocobase/pull/11255)) by @2013xile
- **[Release management]** Keep generated first administrator credentials until they are saved or the app is removed. ([#11219](https://github.com/nocobase/nocobase/pull/11219)) by @2013xile
- **[Agent sessions]**
  - Keep session page toolbars aligned with full session lists and let users fold and reopen the sidebar. ([#11223](https://github.com/nocobase/nocobase/pull/11223)) by @Molunerfinn
  - Long hashes, URLs and words without spaces in your messages to an agent now wrap inside the message bubble instead of cutting off the start of each line. ([#11241](https://github.com/nocobase/nocobase/pull/11241)) by @app/nocobase-studio
- **[Projects]** Keep attachment evidence reads bounded for tasks with long file histories. ([#11246](https://github.com/nocobase/nocobase/pull/11246)) by @app/nocobase-studio
- **[Demo mode]** Recover settled daily demo reset failures safely and advance queued mailbox cleanup without repeating successful daily resets. ([#11248](https://github.com/nocobase/nocobase/pull/11248)) by @gchust
- **[App foundation]**
  - Combine duplicate Settings groups and report physical foreign keys separately from logical relationship fields. ([#11253](https://github.com/nocobase/nocobase/pull/11253)) by @katherinehhh
  - Identify API traffic sources in request logs while keeping query context bounded and excluding sensitive parameters. ([#11254](https://github.com/nocobase/nocobase/pull/11254)) by @2013xile
- **[Skills]** Plan frontend and backend together from the start, streamline routine CRUD development, and verify complete application features without routine design approval pauses. ([#11260](https://github.com/nocobase/nocobase/pull/11260)) by @chenos
- **[Permissions]** Align permission data ranges across operations and groups, with consistent selector widths and responsive layouts. ([#11262](https://github.com/nocobase/nocobase/pull/11262)) by @katherinehhh

## [nocobase-v3-beta/2026-10-28.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-10-28.2)

### 🎉 New Features

- **[Demo mode]** Improve demo account roles and reset layout, and let applications share mode checks and block requests that cause external effects. ([#11204](https://github.com/nocobase/nocobase/pull/11204)) by @gchust

### 🐛 Bug Fixes

- **[Agents]** Keep saved progress messages current and live runner replies visible during conversation refreshes. ([#11202](https://github.com/nocobase/nocobase/pull/11202)) by @2013xile
- **[Demo mode]** Deployments no longer require the Demo Mode writable collections variable. ([#11207](https://github.com/nocobase/nocobase/pull/11207)) by @2013xile

## [release-beta/2026-10-28.1](https://github.com/nocobase/nocobase/releases/tag/release-beta%2F2026-10-28.1)

### 🎉 New Features

- **[Agents]** Manage Runner Agent conversations with task links, queued messages and usage, and change agents while keeping conversation history ([#11189](https://github.com/nocobase/nocobase/pull/11189)) by @2013xile
- **[Release management]** Download release archives and distinguish preview and test environments with their App counts ([#11190](https://github.com/nocobase/nocobase/pull/11190)) by @2013xile
- **[App templates]** Prevent duplicate form and standard action submissions in template applications, with safe retries and coordinated upgrades for customized applications. ([#11192](https://github.com/nocobase/nocobase/pull/11192)) by @katherinehhh
- **[Client]** Show form validation reasons beside fields, automatically locate editable errors, and preserve input after failed submissions in application templates. ([#11193](https://github.com/nocobase/nocobase/pull/11193)) by @katherinehhh

### 🚀 Improvements

- **[Permissions]** Make role permissions easier to scan with standard top tabs, compact checkbox groups, menu routes and global grant-status filtering. ([#11201](https://github.com/nocobase/nocobase/pull/11201)) by @katherinehhh

### 🐛 Bug Fixes

- **[App templates]**
  - Recover invalid list pages after deletions while preserving filters, ordering and detail-return context. ([#11186](https://github.com/nocobase/nocobase/pull/11186)) by @katherinehhh
  - Preserve template list sorting, page sizes and source tabs when returning from details, with documented source upgrades for customized applications. ([#11187](https://github.com/nocobase/nocobase/pull/11187)) by @katherinehhh
- **[Demo mode]** Keep language and appearance choices made through the Users preference API independent per demo visitor session while preserving ordinary deployment behavior. ([#11191](https://github.com/nocobase/nocobase/pull/11191)) by @gchust
- **[Skills]** Allow agents to develop App-local plugins without publication and run the plugin Skill's CLI testing example with published npm packages. ([#11194](https://github.com/nocobase/nocobase/pull/11194)) by @chenos
- **[Interface]**
  - Keep workflow node titles readable by displaying configuration actions as compact icon buttons. ([#11195](https://github.com/nocobase/nocobase/pull/11195)) by @mytharcher
  - Place the file preview download button beside the filename instead of at the right edge of the dialog. ([#11196](https://github.com/nocobase/nocobase/pull/11196)) by @mytharcher
- **[Agents]**
  - Confirm the final Runner Agent selection together with the message, avoiding switch notices for unused selections. ([#11198](https://github.com/nocobase/nocobase/pull/11198)) by @2013xile
  - Clear a task-linked conversation question when the corresponding task resumes, while preserving newer questions and unread replies. ([#11203](https://github.com/nocobase/nocobase/pull/11203)) by @2013xile

## [release-beta/2026-10-27.1](https://github.com/nocobase/nocobase/releases/tag/release-beta%2F2026-10-27.1)

### 🎉 New Features

- **[Plugin development]** Create plugins, including custom scoped plugins, directly inside an existing application's packages workspace without a NocoBase source checkout. ([#11175](https://github.com/nocobase/nocobase/pull/11175)) by @chenos

### 🚀 Improvements

- **[Skills]** Provide plugin development guidance with the App's installed version and guide upgrades away from older global Skills. ([#11178](https://github.com/nocobase/nocobase/pull/11178)) by @chenos

## [release-beta/2026-10-26.3](https://github.com/nocobase/nocobase/releases/tag/release-beta%2F2026-10-26.3)

### 🎉 New Features

- **[CLI]** Support private shared packages in application workspaces, including development updates, package checks, and standalone deployment. ([#11170](https://github.com/nocobase/nocobase/pull/11170)) by @chenos

### 🚀 Improvements

- **[Plugin development]** Install editable File and Notification UI from the UI Library, with bundled translations, as plugin-owned Registry recipes and the scaffold's Registry capability are retired. ([#11173](https://github.com/nocobase/nocobase/pull/11173)) by @chenos

### 🐛 Bug Fixes

- **[App templates]** Preserve list searches, filters and pagination when returning from detail pages in template applications. ([#11177](https://github.com/nocobase/nocobase/pull/11177)) by @katherinehhh
