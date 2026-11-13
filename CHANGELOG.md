# Changelog

All notable changes to NocoBase 3 are documented in this file, one section per release: `nocobase-v3-beta/<date>.<n>` for a beta and `release/<date>.<n>` for a stable release. The versions each release published are on its GitHub Release, and every package's own changes are in its CHANGELOG.md.

## [nocobase-v3-beta/2026-11-13.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-13.1)

### 🎉 New Features

- **[Agents]** Applications can distribute their CLI independently of Agents while existing Agents installations keep their download and update protocols. ([#11539](https://github.com/nocobase/nocobase/pull/11539))

### 🚀 Improvements

- **[Agents]** The runtime list shows each coding tool's concurrency limit and current runs beside the tool. ([#11530](https://github.com/nocobase/nocobase/pull/11530))
- **[App templates]** Run a new application's test files in parallel, so `pnpm test` finishes several times faster. ([#11543](https://github.com/nocobase/nocobase/pull/11543))

### 🐛 Bug Fixes

- **[Authentication]** Improve sign-in security and preserve password recovery after updating authentication dependencies. ([#11526](https://github.com/nocobase/nocobase/pull/11526))
- **[Mail]**
  - Import new IMAP messages promptly during mailbox verification and between synchronization runs, and resume large mailbox synchronization safely. ([#11529](https://github.com/nocobase/nocobase/pull/11529))
  - The mail plugin now requires imapflow 2.2.9 or later, which its IMAP synchronization needs. ([#11550](https://github.com/nocobase/nocobase/pull/11550))
- **[Agents]** Show files uploaded by conversation runners in their replies and retain them with the conversation. ([#11532](https://github.com/nocobase/nocobase/pull/11532))
- **[Release management]** Retrying a deployment the app host refused for memory reuses the already expanded release, and each app shows a single clear state with readable capacity messages. ([#11544](https://github.com/nocobase/nocobase/pull/11544))

## [nocobase-v3-beta/2026-11-12.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-12.1)

### 🎉 New Features

- **[Server]** Plugins can provide application-local ID generation without replacing the application's ID provider, while keeping synchronous generation and previously resolved service references. ([#11489](https://github.com/nocobase/nocobase/pull/11489))
- **[Create app]** Create multi-app projects with a root Main application, independently deployed children, and synchronized development, migration and deployment Skills. ([#11497](https://github.com/nocobase/nocobase/pull/11497))

### 🚀 Improvements

- **[Users]** Invitation emails are now written in one language chosen when inviting, with a localized subject and expiry time, and the sign-up page opens in that language. ([#11482](https://github.com/nocobase/nocobase/pull/11482))
- **[Skills]** Table row actions in new and template pages now sit in one consistent "⋮" menu at the end of the row, with no actions column header and no pinned column. ([#11484](https://github.com/nocobase/nocobase/pull/11484))
- **[Agents]** The runtime list shows each coding tool's quota usage and when an exhausted quota resets, and its version column shows only Latest or Upgradable. ([#11494](https://github.com/nocobase/nocobase/pull/11494))
- **[Projects]**
  - Refresh task reminders faster for people responsible for a small part of a large project backlog. ([#11502](https://github.com/nocobase/nocobase/pull/11502))
  - Reduce project task grouping work while preserving visible parent context and dependency counts. ([#11503](https://github.com/nocobase/nocobase/pull/11503))
- **[Knowledge base]** Load knowledge-space directories with fewer queries while preserving document visibility and archived counts. ([#11506](https://github.com/nocobase/nocobase/pull/11506))
- **[App templates]** Move the Main-only multi-app template and scenario Skills to Pro, delivering child applications through deployment archives. ([#11511](https://github.com/nocobase/nocobase/pull/11511))

### 🐛 Bug Fixes

- **[Demo mode]** Fix a blank application when Demo Mode is registered in an application whose System settings nest categories and modules under the same path. ([#11455](https://github.com/nocobase/nocobase/pull/11455))
- **[Mail]** Speed up IMAP synchronization and attachment downloads, and tolerate mailbox changes during verification. ([#11490](https://github.com/nocobase/nocobase/pull/11490))
- **[Agents]** Clarified runtime quota settings and empty states, kept thresholds visible to viewers, and displayed quota windows in readable units ([#11493](https://github.com/nocobase/nocobase/pull/11493))
- **[Users]** After registering with automatic sign-in turned off, the register page now shows that the request was submitted instead of an empty form. ([#11495](https://github.com/nocobase/nocobase/pull/11495))
- **[CLI]** Build applications without compiling unrelated example applications, with a larger default compiler heap. ([#11508](https://github.com/nocobase/nocobase/pull/11508))
- **[Create app]** Add scoped NocoBase registry selection while preserving the legacy --registry option with migration guidance. ([#11512](https://github.com/nocobase/nocobase/pull/11512))

## [nocobase-v3-beta/2026-11-11.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-11.1)

### 🎉 New Features

- **[Agents]** Show Claude quota windows and let runtime owners pause new work at a chosen usage threshold ([#11483](https://github.com/nocobase/nocobase/pull/11483)) by @2013xile

### 🚀 Improvements

- **[Skills]** Applications built with the development Skill now get phone-ready pages on first delivery, and the templates' data table can show records as cards on phones. ([#11402](https://github.com/nocobase/nocobase/pull/11402)) by @chenos
- **[Files]** Configure attachment upload limits per storage disk, with consistent size hints and validation for tasks, comments and Agent conversations. ([#11460](https://github.com/nocobase/nocobase/pull/11460)) by @2013xile
- **[Knowledge base]** Applications can turn off knowledge semantic indexing, which removes its settings, routes and permission; the Knowledge indexing permission is now translated and grouped. ([#11471](https://github.com/nocobase/nocobase/pull/11471)) by @2013xile
- **[Interface]** The UI Library's issue table shows statuses as shapes, an agent owner's avatar and the project, and can add columns, group rows and a compact phone layout. ([#11478](https://github.com/nocobase/nocobase/pull/11478)) by @2013xile

### 🐛 Bug Fixes

- **[Agents]**
  - Hide agent runs and transcripts when their subjects are not visible to the reader. ([#11470](https://github.com/nocobase/nocobase/pull/11470)) by @2013xile
  - A message sent while an agent is still answering joins its queue instead of being refused as busy, and a run that fails while being prepared shows why without reloading. ([#11481](https://github.com/nocobase/nocobase/pull/11481)) by @2013xile
- **[Agent runner]** Read native Claude user settings during model discovery and user, project and local settings during conversations so configured providers and model aliases work in the runner. ([#11480](https://github.com/nocobase/nocobase/pull/11480)) by @2013xile
- **[Demo mode]** Keep a demo visitor's language choice in their own browser instead of saving it to the shared demo account. ([#11486](https://github.com/nocobase/nocobase/pull/11486)) by @gchust

## [nocobase-v3-beta/2026-11-10.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-10.2)

### 🐛 Bug Fixes

- **[Create app]** Creating an app from a private NocoBase registry preserves the configured default registry for third-party dependencies. ([#11473](https://github.com/nocobase/nocobase/pull/11473)) by @chenos

## [nocobase-v3-beta/2026-11-10.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-10.1)

### 🎉 New Features

- **[Agents]** People can choose whether their runs go to their personal runners or to shared runners first; the other kind still takes a run about a second later when the preferred kind cannot. ([#11408](https://github.com/nocobase/nocobase/pull/11408)) by @2013xile
- **[Agent runner]** Runners install `@nocobase/*` packages from the default registry and use NocoBase's private registry, with the token the application keeps, only when a project declares it or a package is missing elsewhere. ([#11415](https://github.com/nocobase/nocobase/pull/11415)) by @2013xile
- **[App templates]** After a create, edit or delete, related lists, details, cards and counts in template applications show the new data the next time they are visible. ([#11417](https://github.com/nocobase/nocobase/pull/11417)) by @katherinehhh
- **[Server]**
  - Support coordinated database tasks across multiple named connections, scoped module CLI registration and reliable cleanup of stopped deployments. ([#11418](https://github.com/nocobase/nocobase/pull/11418)) by @chenos
  - Support required database preparation hooks and report preparation failures, with fresh runs resetting every selected database before any migration or Seed begins. ([#11456](https://github.com/nocobase/nocobase/pull/11456)) by @cgyrock

### 🚀 Improvements

- **[Notifications]** Notification templates open in a drawer with a shareable address, are grouped by category with a compact filter bar, show translated names instead of technical identifiers, and preview in the interface language. ([#11462](https://github.com/nocobase/nocobase/pull/11462)) by @katherinehhh
- **[CLI]** Support scoped portal packages in App CLI registration and package management. ([#11464](https://github.com/nocobase/nocobase/pull/11464)) by @chenos
- **[Create app]** Create multi-portal applications with a template alias and guidance for authenticated commercial registry access. ([#11466](https://github.com/nocobase/nocobase/pull/11466)) by @chenos

### 🐛 Bug Fixes

- **[Interface]**
  - Keep the agent chat panel's input above the soft keyboard on phones. ([#11409](https://github.com/nocobase/nocobase/pull/11409)) by @zhouyanliang
  - The notification logs block installs with `shadcn add` again, gives the source column the space, formats dates in the application language, follows the theme's status colors, can hide its own heading when used as a tab, and adds Korean and Russian. ([#11459](https://github.com/nocobase/nocobase/pull/11459)) by @katherinehhh
- **[Agents]** Let agents confirm whether their current run starts an independent tool session before reviewing a change. ([#11416](https://github.com/nocobase/nocobase/pull/11416)) by @2013xile
- **[App templates]** Keep the application's tab icon visible when the browser or system uses a dark theme. ([#11463](https://github.com/nocobase/nocobase/pull/11463)) by @katherinehhh

## [nocobase-v3-beta/2026-11-09.3](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-09.3)

### 🎉 New Features

- **[Skills]** Add Agent Skills for configuring and verifying multi-instance applications and shared Redis backends. ([#11397](https://github.com/nocobase/nocobase/pull/11397)) by @chenos
- **[App foundation]** Add a `foundation.scanOnStart` setting that stops App Foundation from scanning at application start, and turn it off for test applications so tests start and close faster. ([#11403](https://github.com/nocobase/nocobase/pull/11403)) by @Molunerfinn

### 🚀 Improvements

- **[App templates]** Improve Database explorer browsing and mobile page spacing, and move Features and extensions into System settings with configurable access permissions. ([#11386](https://github.com/nocobase/nocobase/pull/11386)) by @chenos

## [nocobase-v3-beta/2026-11-09.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-09.2)

### 🚀 Improvements

- **[App foundation]** Features and extensions now opens the first matching feature by default on desktop while preserving search filters. ([#11396](https://github.com/nocobase/nocobase/pull/11396)) by @chenos

### 🐛 Bug Fixes

- **[App templates]** Keep generated application catalog checks compatible with additional plugins that use generic introductions. ([#11399](https://github.com/nocobase/nocobase/pull/11399)) by @chenos

## [nocobase-v3-beta/2026-11-09.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-09.1)

### 🎉 New Features

- **[Agents]** Preserve quota-limited work on its original Runner and resume the original session when quota recovers. ([#11372](https://github.com/nocobase/nocobase/pull/11372)) by @2013xile
- **[Languages]** Add Russian and Korean to the agents, projects, releases, knowledge and other core plugins, and correct mistranslated terms such as "issue" and "executor" in their other languages. ([#11379](https://github.com/nocobase/nocobase/pull/11379)) by @2013xile
- **[App foundation]** Discover application features and extensions in System settings, inspect their configuration, and use Agent setup guidance alongside database browsing. ([#11383](https://github.com/nocobase/nocobase/pull/11383)) by @chenos

### 🚀 Improvements

- **[Authentication]** Configure password recovery through auth.passwordReset.mailer; move existing auth.email.mailer references directly to the new field. ([#11346](https://github.com/nocobase/nocobase/pull/11346)) by @cgyrock
- **[Permissions]** Reduce redundant database reads during permission checks and automatic ticket closure. ([#11357](https://github.com/nocobase/nocobase/pull/11357)) by @chenos
- **[Agents]**
  - A run history's agent filter can list only the agents that ran on that subject, including removed ones. ([#11367](https://github.com/nocobase/nocobase/pull/11367)) by @app/nocobase-studio
  - Runtime owners and administrators can clear a quota mark before its known reset time, and a mark lifts by itself when the same quota window reports quota left again. ([#11369](https://github.com/nocobase/nocobase/pull/11369)) by @2013xile
  - Allow applications to keep fixed instructions first in independent agent sessions for better prompt cache reuse. ([#11371](https://github.com/nocobase/nocobase/pull/11371)) by @2013xile
  - Share queued agent runs between runners in proportion to each runner's limit for the run's coding tool, so idler runners take the next run first. ([#11388](https://github.com/nocobase/nocobase/pull/11388)) by @2013xile
- **[Release management]**
  - Show each shared app host once on the environments page as a capacity card linking to its running apps; the apps list shows each app's runtime state with why and filters by it, and an app's page mentions the host only when it affects that app. ([#11380](https://github.com/nocobase/nocobase/pull/11380)) by @2013xile
  - Apps are listed and created on their environment's page, with each app's runtime state and a state filter; a shared host's card links to each environment's running apps. ([#11385](https://github.com/nocobase/nocobase/pull/11385)) by @2013xile
- **[Projects]** Issue activity says "added a relation to" or "removed the relation to" for related issues, on both issues, instead of calling them dependencies. ([#11389](https://github.com/nocobase/nocobase/pull/11389)) by @2013xile
- **[Realtime updates]** Configure application realtime brokers under `realtime.broker`, preserving the in-memory default and reporting legacy configuration paths with migration guidance. ([#11392](https://github.com/nocobase/nocobase/pull/11392)) by @cgyrock
- **[Server]** Standardize Concurrency, Jobs and Queue settings under `backends` and reject legacy or mixed configuration with migration guidance instead of silently falling back to local execution. ([#11393](https://github.com/nocobase/nocobase/pull/11393)) by @cgyrock

### 🐛 Bug Fixes

- **[Database]** Improve indexed sorting of non-nullable fields while preserving null ordering and pagination. ([#11356](https://github.com/nocobase/nocobase/pull/11356)) by @chenos
- **[App host]**
  - Keep preview admission stable when transient heap usage rises while preserving bounded Host rotation. ([#11359](https://github.com/nocobase/nocobase/pull/11359)) by @2013xile
  - Keep shared application Hosts responsive with bounded archive work, live memory admission and recycling that protects active requests and deployments. ([#11373](https://github.com/nocobase/nocobase/pull/11373)) by @2013xile
- **[Agents]**
  - Preserve refused chat messages for recovery and present a consistent next step for conversation problems. ([#11361](https://github.com/nocobase/nocobase/pull/11361)) by @2013xile
  - Retry temporary repository access problems before starting an Agent and show the actual failure when preparation cannot recover. ([#11374](https://github.com/nocobase/nocobase/pull/11374)) by @2013xile
  - Start a fresh agent session when switching between read-only and writable work, while keeping existing writable sessions reusable. ([#11377](https://github.com/nocobase/nocobase/pull/11377)) by @2013xile
  - A conversation interrupted by a dropped connection recovers once it is idle and refreshed. ([#11381](https://github.com/nocobase/nocobase/pull/11381)) by @2013xile
- **[App templates]**
  - Remove the floating annotation toolbar from newly generated Examples applications. ([#11366](https://github.com/nocobase/nocobase/pull/11366)) by @gchust
  - Applications in a language other than English no longer show "Loading application…" in English while they start. ([#11376](https://github.com/nocobase/nocobase/pull/11376)) by @chenos
- **[Release management]** Let release page descriptions use the available width while keeping page actions visible. ([#11368](https://github.com/nocobase/nocobase/pull/11368)) by @gchust
- **[Skills]** The UI component checker now flags native and shadcn Input date fields, and the Examples work calendar picks holiday dates from a calendar instead of the browser's native date picker. ([#11378](https://github.com/nocobase/nocobase/pull/11378)) by @chenos
- **[Agent runner]** Automatically recover runner services after unexpected termination while keeping explicit stops stopped and reporting failed update restarts. ([#11384](https://github.com/nocobase/nocobase/pull/11384)) by @2013xile

## [nocobase-v3-beta/2026-11-06.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-06.1)

### 🎉 New Features

- **[Agents]** Share completed conversation snapshots with selected users and revoke their read-only access. ([#11326](https://github.com/nocobase/nocobase/pull/11326)) by @2013xile

### 🚀 Improvements

- **[Release management]**
  - Cancel deployments before switching, replace older queued deployments, and see queue positions while archive processing runs outside the application Host. ([#11337](https://github.com/nocobase/nocobase/pull/11337)) by @2013xile
  - Let applications include authenticated execution details in artifact operation logs for troubleshooting. ([#11360](https://github.com/nocobase/nocobase/pull/11360)) by @2013xile
- **[Client]** Keep loading feedback consistent across pages, tables, lists, pickers, uploads and background tasks, and keep submit buttons stable while preserving form submission protection. ([#11349](https://github.com/nocobase/nocobase/pull/11349)) by @katherinehhh
- **[App templates]** Remove default Refresh buttons from ordinary application pages and shared generation guidance while retaining automatic updates and contextual retries. ([#11353](https://github.com/nocobase/nocobase/pull/11353)) by @chenos
- **[App foundation]** The App foundation page shows capabilities in a wrapping grid with clear status badges, separate selection, readable extension names and key numbers grouped by capability. ([#11362](https://github.com/nocobase/nocobase/pull/11362)) by @katherinehhh

### 🐛 Bug Fixes

- **[Agent sessions]** Keep agent settings available with long option descriptions and show concrete discovery failure reasons. ([#11344](https://github.com/nocobase/nocobase/pull/11344)) by @zhouyanliang
- **[Release management]** Keep active previews connected, let hidden tabs release capacity, and bound host memory use and rotation waits. ([#11345](https://github.com/nocobase/nocobase/pull/11345)) by @2013xile
- **[General]** Keep link and native button actions aligned in dialog footers, including long labels on narrow screens. ([#11351](https://github.com/nocobase/nocobase/pull/11351)) by @chenos
- **[App templates]** Keep detail-page parent navigation visible on desktop and mobile, with safe destinations and consistent page-generation guidance. ([#11352](https://github.com/nocobase/nocobase/pull/11352)) by @chenos
- **[Agents]** Show the sharing backdrop in phone Agent panels, format snapshot cutoffs in the application language and display the conversation agent in shared replies. ([#11358](https://github.com/nocobase/nocobase/pull/11358)) by @2013xile

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
