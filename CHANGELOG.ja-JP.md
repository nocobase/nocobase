# 変更履歴

このファイルには NocoBase 3 の主な変更を、リリースごとに 1 セクションずつ記録します。`nocobase-v3-beta/<日付>.<連番>` はベータ版、`release/<日付>.<連番>` は正式版です。各リリースで公開されたパッケージのバージョンは対応する GitHub Release を、各パッケージ自体の変更はパッケージ内の CHANGELOG.md を参照してください。

## [nocobase-v3-beta/2026-11-12.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-12.1)

### 🎉 新機能

- **[サーバー]** Plugins can provide application-local ID generation without replacing the application's ID provider, while keeping synchronous generation and previously resolved service references. ([#11489](https://github.com/nocobase/nocobase/pull/11489))
- **[アプリ作成]** Create multi-app projects with a root Main application, independently deployed children, and synchronized development, migration and deployment Skills. ([#11497](https://github.com/nocobase/nocobase/pull/11497))

### 🚀 改善

- **[ユーザー]** Invitation emails are now written in one language chosen when inviting, with a localized subject and expiry time, and the sign-up page opens in that language. ([#11482](https://github.com/nocobase/nocobase/pull/11482))
- **[Skills]** Table row actions in new and template pages now sit in one consistent "⋮" menu at the end of the row, with no actions column header and no pinned column. ([#11484](https://github.com/nocobase/nocobase/pull/11484))
- **[Agent]** The runtime list shows each coding tool's quota usage and when an exhausted quota resets, and its version column shows only Latest or Upgradable. ([#11494](https://github.com/nocobase/nocobase/pull/11494))
- **[プロジェクト]**
  - Refresh task reminders faster for people responsible for a small part of a large project backlog. ([#11502](https://github.com/nocobase/nocobase/pull/11502))
  - Reduce project task grouping work while preserving visible parent context and dependency counts. ([#11503](https://github.com/nocobase/nocobase/pull/11503))
- **[ナレッジベース]** Load knowledge-space directories with fewer queries while preserving document visibility and archived counts. ([#11506](https://github.com/nocobase/nocobase/pull/11506))
- **[アプリテンプレート]** Move the Main-only multi-app template and scenario Skills to Pro, delivering child applications through deployment archives. ([#11511](https://github.com/nocobase/nocobase/pull/11511))

### 🐛 不具合修正

- **[デモモード]** Fix a blank application when Demo Mode is registered in an application whose System settings nest categories and modules under the same path. ([#11455](https://github.com/nocobase/nocobase/pull/11455))
- **[メール]** Speed up IMAP synchronization and attachment downloads, and tolerate mailbox changes during verification. ([#11490](https://github.com/nocobase/nocobase/pull/11490))
- **[Agent]** Clarified runtime quota settings and empty states, kept thresholds visible to viewers, and displayed quota windows in readable units ([#11493](https://github.com/nocobase/nocobase/pull/11493))
- **[ユーザー]** After registering with automatic sign-in turned off, the register page now shows that the request was submitted instead of an empty form. ([#11495](https://github.com/nocobase/nocobase/pull/11495))
- **[CLI]** Build applications without compiling unrelated example applications, with a larger default compiler heap. ([#11508](https://github.com/nocobase/nocobase/pull/11508))
- **[アプリ作成]** Add scoped NocoBase registry selection while preserving the legacy --registry option with migration guidance. ([#11512](https://github.com/nocobase/nocobase/pull/11512))
