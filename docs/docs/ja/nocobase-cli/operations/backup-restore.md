# バックアップと復元

NocoBase アプリケーションを CLI 環境として保存した場合、毎日のバックアップとリカバリは基本的に `nb backup` グループのコマンドで完了します。 `nb backup create` は、ターゲット環境にバックアップを作成し、それをローカルにダウンロードするために使用されます。 `nb backup restore` は、ローカル バックアップ ファイルをターゲット環境に復元するために使用されます。

ほとんどの場合、デフォルトのアドバイスを覚えておくだけで十分です。データをアップグレード、移行、またはバッチ変更する前にバックアップを作成します。現在のデータを上書きすることが明確にわかっている場合にのみ、リカバリを実行してください。

## クイックインデックス

|欲しいです... |どのコマンドを使用するか |
| --- | --- |
|まず、現在の環境をローカルにバックアップします。 [`nb backup create`](../../api/cli/backup/create.md) |
|バックアップを指定したディレクトリに保存します。 [`nb backup create --output ./backups`](../../api/cli/backup/create.md) |
|スクリプトがバックアップ結果を引き続き使用できるようにします。 [`nb backup create --json-output`](../../api/cli/backup/create.md) |
|ローカル バックアップを現在の環境に復元する | [`nb backup restore --file ./backups/xxx.nbdata --force`](../../api/cli/backup/restore.md) |
|ローカル バックアップを別の環境に復元する | [`nb backup restore --env app1 --file ./backups/xxx.nbdata --yes --force`](../../api/cli/backup/restore.md) |

:::tip まず現在の環境を確認してください

`nb backup` コマンドは、デフォルトで現在の環境に作用します。複数の環境を同時に維持する場合、デフォルトの推奨事項は、バックアップまたは復元を実行する前に現在の環境を確認することです。

```bash
nb env current
nb env use app1
```

別の `--env` を明示的に渡すと、通常、CLI は確認を求めます。スクリプトまたは非対話型シナリオでは、`--yes` を追加してこの手順をスキップできます。

:::

## バックアップを作成する

最も簡単な使用法は、バックアップを直接作成することです。

```bash
nb backup create
```

コマンドが正常に返されると、バックアップ ファイルがローカルにダウンロードされます。 `--output` が省略された場合、CLI はファイルを現在の作業ディレクトリに保存し、リモート エンドから返されたファイル名 (通常は `backup_*.nbdata`) を使用します。

バックアップを 1 つのディレクトリに置きたい場合は、これを使用できます。

```bash
nb backup create --output ./backups
```

`./backups` がすでに存在し、それがディレクトリである場合、CLI はリモート バックアップ ファイル名をディレクトリに自動的に追加します。パスが存在しない場合にのみ、CLI はそのパスをターゲット ファイル パスとして扱います。

スクリプト、CI、またはエージェント リンクでバックアップ結果を引き続き使用したい場合は、`--json-output` を追加できます。

```bash
nb backup create --env app1 --yes --json-output
```

このモードでは、CLI は進行状況テキストを出力しなくなり、最終的な JSON を直接返します。これには通常、`env`、`name`、`output` の 3 つのフィールドが含まれます。

## バックアップを復元する

復元コマンドは、ローカル バックアップ ファイルをターゲット環境にアップロードし、現在のアプリケーション データを上書きします。

```bash
nb backup restore --file ./backups/backup_20260520_190408_8397.nbdata --force
```

現在の環境以外の環境に復元したい場合は、通常は次のように記述する方が安全です。

```bash
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::警告メモ

リカバリは完全にカバーされる操作です。デフォルトでは、復元する前に現在のターゲット環境のバックアップを再度作成することをお勧めします。

```bash
nb backup create --env app1 --yes --output ./backups
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::

`nb backup restore` は、まず `--file` が指すパスが存在するかどうかをチェックし、それが通常のファイルであることを確認します。アップロードが成功した後、CLI はアプリケーションがヘルス チェックに再度合格するまで待機し続けるため、コマンドが正常に返されると、通常、アプリケーションはアクセス可能な状態に復元されています。

`--force` が渡されない場合、対話型端末は再度確認を求めます。非対話型ターミナル、スクリプト、および AI エージェント セッションでは、`--force` が必要です。

## よくある状況

インターフェイスでの操作に慣れている場合、またはスケジュールされたバックアップやクラウド ストレージの同期などの機能が必要な場合は、[バックアップ管理](../../ops-management/backup-manager/index.mdx) を直接参照できます。このようなシナリオでは、多くの場合、Web UI の方が適しています。

## 関連リンク

- [`nb backup` コマンドリファレンス](../../api/cli/backup/index.md)
- [`nb env` コマンドリファレンス](../../api/cli/env/index.md)
- [複数の環境管理](./multi-environment.md)
- [バックアップ管理](../../ops-management/backup-manager/index.mdx)
