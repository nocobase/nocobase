---
title: "バージョン管理"
description: "バージョン管理 Skill（nocobase-revision）は、AI Builder がマイルストーンを完了した後に復元可能なアプリケーションバージョンを作成します。"
keywords: "AI Builder,バージョン管理,nocobase-revision,nb revision create,バージョン復元"
---

# バージョン管理

:::tip 前提条件

- このページを読む前に、[AI Builder クイックスタート](./index.md) に従って NocoBase CLI をインストールし、初期化を完了してください
- 「Backup Management」と「Version Control」プラグインを有効にしてください
- Community 版と Standard 版には Version Control プラグインは含まれていません。重要な変更前に戻れる状態を残したいだけであれば、[Backup Management](../ops-management/backup-manager/index.mdx) を使用してください

:::

## 概要

バージョン管理 Skill（`nocobase-revision`）は、AI Builder が意味のあるマイルストーンを完了した後に、復元可能なアプリケーションバージョンを作成します。たとえば、ページを作成した後、複数の collection を作成した後、または workflow を設定した後に、AI は `nb revision create` を実行して現在の状態を保存できます。

この Skill は、フィールドを 1 つ変更するたびにバージョンを作成するものではありません。デフォルトでは、明確なマイルストーンが完了して検証された後にだけ保存します。これにより、バージョン一覧が読みやすくなり、復元先も選びやすくなります。

バージョン一覧、手動作成、復元、保持設定については、[Version Control プラグインガイド](../ops-management/version-control/index.md)を参照してください。

## 機能範囲

できること：

- 構築マイルストーンの完了と検証後にバージョンを作成する
- 保存内容を説明する短い説明文を書く
- 現在の CLI 環境でバージョンを作成する

できないこと：

- Backup Management プラグインが提供する保存・復元機能を置き換える
- Version Control プラグインが有効でない状態でバージョンを作成する
- 特定のバージョンへ自動復元する。復元は [Version Control プラグイン](../ops-management/version-control/index.md) で実行してください

## プロンプト例

### シナリオ A：完成したページ設定を保存する

```text
現在の構築結果をバージョンとして保存してください：顧客管理ページ、フィルターエリア、編集フォームの設定が完了しました
```

Skill は説明を短いバージョンメモに整理し、バージョンを作成します。

コマンドモード：

```bash
nb revision create "顧客管理ページ、フィルターエリア、編集フォームの設定が完了"
```

### シナリオ B：データモデルと workflow を保存する

```text
仕入先 collection と購買承認 workflow は検証済みです。バージョンを作成してください。
```

複数の機能をまたぐ作業に適しています。たとえば、[データモデリング](./data-modeling)で collection を作成し、[ワークフロー管理](./workflow)で承認プロセスを設定し、結果を検証してからバージョンを保存します。

### シナリオ C：指定環境でバージョンを作成する

```text
dev 環境でバージョンを保存してください：チケット管理ページと SLA フィールドの設定が完了しました
```

指定した環境が現在の CLI 環境と異なる場合、Skill はまず対象環境を確認し、誤ったアプリケーションに保存しないようにします。

コマンドモード：

```bash
nb revision create --env dev --yes "チケット管理ページと SLA フィールドの設定が完了"
```

## バージョン説明の書き方

バージョン説明には、あいまいなラベルではなく「何が完了したか」を書きます。

推奨：

- `顧客台帳、詳細ページ、承認送信フローの設定が完了`
- `仕入先 collection、購買申請フォーム、承認 workflow が完了`
- `Completed customer detail page, edit form, and submission workflow wiring`

非推奨：

- `snapshot`
- `backup`
- `test`
- `version 2`
- 日付またはタイムスタンプのみ

また、Token、URL、パスワード、その他の機密情報を説明に含めないでください。説明はバージョン一覧に表示されるため、明確で読みやすく、監査しやすい内容にします。

## FAQ

**いつバージョンを作成すべきですか？**

単独で確認できるマイルストーンが完了した後です。たとえば、ページが正常に開いて編集できる、collection のリレーションが検証済み、workflow が保存されて node チェーンを確認済み、といった状態です。

**AI の調整ごとにバージョンを作らないのはなぜですか？**

細かすぎるバージョンが多いと、一覧がすぐに読みにくくなります。通常、バージョンは復元して作業を続けられる地点を表すべきで、単なるフィールド名変更やボタン位置の調整ではありません。

**作成前に結果を検証する必要がありますか？**

はい。バージョン管理 Skill は、完了して検証済みの成果を保存するためのものです。ページにまだエラーがある、または workflow が未確認の場合は、先に AI に修正と検証を依頼してください。

**作成したバージョンはどこで復元しますか？**

Version Control プラグインのバージョン一覧で復元します。復元すると、現在のアプリケーション設定と、そのバージョンに含まれるデータが上書きされます。操作前に [Version Control プラグインガイド](../ops-management/version-control/index.md)を確認してください。

## 関連リンク

- [Version Control プラグインガイド](../ops-management/version-control/index.md) — 手動作成、復元、バージョンルール設定
- [Backup Management](../ops-management/backup-manager/index.mdx) — Version Control が依存する基本機能
- [AI Builder 概要](./index.md) — すべての AI Builder Skills の概要とインストール方法
- [リリース管理](./publish.md) — クロス環境リリース、バックアップ復元、マイグレーション
