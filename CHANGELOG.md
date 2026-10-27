# Changelog

All notable changes to NocoBase 3 are documented in this file, one section per release: `release-beta/<date>.<n>` for a beta and `release/<date>.<n>` for a stable release. The versions each release published are on its GitHub Release, and every package's own changes are in its CHANGELOG.md.

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
