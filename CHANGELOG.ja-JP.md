# 変更履歴

このファイルには NocoBase 3 の主な変更を、リリースごとに 1 セクションずつ記録します。`nocobase-v3-beta/<日付>.<連番>` はベータ版、`release/<日付>.<連番>` は正式版です。各リリースで公開されたパッケージのバージョンは対応する GitHub Release を、各パッケージ自体の変更はパッケージ内の CHANGELOG.md を参照してください。

## [nocobase-v3-beta/2026-11-13.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-13.2)

### 🎉 新機能

- **[CLI]** CLI で宣言された操作キーを安全に再利用し、大容量ファイルをストリーミング送信して、既存の更新と保護されたインストール動作を維持した独立の公開インストーラーを提供します。 ([#11535](https://github.com/nocobase/nocobase/pull/11535))
- **[Agent]** 設定済みのサービス認証情報を使い、DeepSeek モデルのネイティブエージェントでウェブ検索を利用できるようになりました。 ([#11551](https://github.com/nocobase/nocobase/pull/11551))

### 🚀 改善

- **[リリース管理]** 環境内のアプリが増えても一覧の応答性を保ち、検索文字列をそのまま照合します。 ([#11553](https://github.com/nocobase/nocobase/pull/11553))

### 🐛 不具合修正

- **[リリース管理]** 停滞したリリースのダウンロードをタイムアウトし、キャンセル可能にして後続のデプロイを継続します。 ([#11547](https://github.com/nocobase/nocobase/pull/11547))

## [nocobase-v3-beta/2026-11-13.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-13.1)

### 🎉 新機能

- **[Agent]** アプリケーションは Agents から独立して CLI を配布でき、既存の Agents 環境のダウンロードと更新プロトコルも維持されます。 ([#11539](https://github.com/nocobase/nocobase/pull/11539))

### 🚀 改善

- **[Agent]** 実行環境の一覧で、各コーディングツールの横に同時実行数の上限と現在の実行数を表示します。 ([#11530](https://github.com/nocobase/nocobase/pull/11530))
- **[アプリテンプレート]** 新しいアプリケーションのテストファイルを並列で実行し、`pnpm test` が数倍速く完了するようにします。 ([#11543](https://github.com/nocobase/nocobase/pull/11543))

### 🐛 不具合修正

- **[認証]** 認証依存関係を更新し、ログインの安全性を高めながらパスワード再設定を引き続き利用できるようにします。 ([#11526](https://github.com/nocobase/nocobase/pull/11526))
- **[メール]**
  - メールボックスの照合中や同期の合間にも新しい IMAP メールをすばやく取り込み、大きなメールボックスの同期を安全に再開します。 ([#11529](https://github.com/nocobase/nocobase/pull/11529))
  - メールプラグインは、IMAP 同期に必要な imapflow 2.2.9 以降を必須とするようになりました。 ([#11550](https://github.com/nocobase/nocobase/pull/11550))
- **[Agent]** 会話中の Runner がアップロードしたファイルを返信に表示し、会話とともに保持します。 ([#11532](https://github.com/nocobase/nocobase/pull/11532))
- **[リリース管理]** アプリホストがメモリ不足で拒否したデプロイを再試行すると展開済みのリリースを再利用し、各アプリには分かりやすい状態が 1 つだけ表示され、容量に関するメッセージも読みやすくなりました。 ([#11544](https://github.com/nocobase/nocobase/pull/11544))

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
