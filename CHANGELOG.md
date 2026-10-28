# Changelog

All notable changes to NocoBase 3 are documented in this file, one section per release: `release-beta/<date>.<n>` for a beta and `release/<date>.<n>` for a stable release. The versions each release published are on its GitHub Release, and every package's own changes are in its CHANGELOG.md.

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
