#複数の環境管理

`dev`、`test`、`staging`、`prod` などの複数の NocoBase アプリケーションを維持する場合、それらをそれぞれ CLI 環境として保存できます。将来の `nb` コマンドのほとんどはデフォルトで現在の環境で動作するため、`nb app`、`nb api`、`nb db` などのコマンドを実行する前に、使用している環境を確認することが重要です。

このバージョンから、CLI は概念を `current env` と `last env` に分割します。通常は、現在のシェルまたはエージェント ランタイムが使用している環境である `current env` のみを気にする必要があります。 CLI は、セッション モードが有効になっていない場合にのみ、グローバル `last env` にフォールバックします。

## クイックインデックス

|欲しいです... |どのコマンドを使用するか |
| --- | --- |
|新しいローカル環境を作成し、初期化をスムーズに完了します。 [`nb init`](../../api/cli/init.md) |
|既存のアプリケーションを CLI env として登録する | [`nb env add`](../../api/cli/env/add.md) |
|どの環境がローカルに保存されているかを確認する | [`nb env list`](../../api/cli/env/list.md) |
|すべての環境の接続と認証ステータスを確認する | [`nb env status --all`](../../api/cli/env/status.md) |
|後続のコマンドで使用する環境を切り替えます。 [`nb env use`](../../api/cli/env/use.md) |
|現在のコマンドがどの環境に該当するかを確認します。 [`nb env current`](../../api/cli/env/current.md) および [`nb env status`](../../api/cli/env/status.md) |
|環境によって保存された詳細な設定を表示 | [`nb env info`](../../api/cli/env/info.md) |
|保存された環境設定を更新し、必要に応じて CLI が現在の状態を再同期できるようにします。 [`nb env update`](../../api/cli/env/update.md) |
|ログイン状態の有効期限が切れた後に再認証するか、新しい認証方法を使用します。 [`nb env auth`](../../api/cli/env/auth.md) |
|必要に応じて、未使用の環境設定を削除し、ローカルでホストされているリソースをクリーンアップします。 [`nb env remove`](../../api/cli/env/remove.md) |

:::tip 最初にセッション モードを有効にすることをお勧めします

デフォルトでは、最初に [`nb session setup`](../../api/cli/session/setup.md) を実行することをお勧めします。このようにして、異なる端末、異なるシェル、または異なるエージェント ランタイムはそれぞれ独自の `current env` を維持でき、並列操作中に簡単に相互に影響を与えることはありません。

セッション モードが有効になっていない場合、`nb env use` はグローバル `last env` の更新に戻ります。この場合、一方の端末が環境を遮断すると、もう一方の端末にも影響が出る可能性があります。

```bash
nb session setup
```

:::

## 複数の環境を作成する

ローカル アプリケーションを作成または復元する場合は、`nb init` を使用してください。初期化が完了し、結果が新しい CLI 環境に保存されます。

```bash
nb init --env dev
nb init --env test
```

アプリケーションがすでに存在し、それを CLI に接続したいだけの場合は、通常、`nb env add` を使用する方が簡単です。

```bash
nb env add staging --api-base-url http://staging.example.com/api --auth-type oauth
nb env add prod --api-base-url https://api.example.com/api --auth-type token --access-token <token>
```

前者は「環境の初期化」に関するものであり、後者は「既存の環境の登録」に関するものです。既存のアプリケーションに接続するだけの場合は、デフォルトで `nb env add` を使用してください。

## 構成された環境を表示する

まず、`nb env list` を使用して、どの環境がローカルに保存されているかを確認します。

```bash
nb env list
```

このコマンドは構成自体を表示するだけであり、アプリケーションのステータスを積極的に確認することはありません。接続と認証ステータスの両方を確認したい場合は、`nb env status --all` を使用します。

```bash
nb env status --all
```

通常、`ok`、`auth failed`、`unreachable` などのステータス値が表示されます。

## 現在の環境を切り替える

`nb env use` を使用して環境を切り替えます。

```bash
nb env use dev
```

切り替えが完了すると、`--env` を省略した後続のコマンドは、デフォルトでこの環境を使用します。

## 現在の環境を確認する

現在のコマンドがどの環境に該当するかわからない場合は、最初に次の 2 つのコマンドを実行します。

```bash
nb env current
nb env status
```

`nb env current` は名前を確認するために使用され、`nb env status` は現在の環境にアクセス可能かどうか、および認証が正常であるかどうかを確認するために使用されます。

## 単一の環境の詳細を表示する

特定の環境にどのような構成が保存されているかを確認したい場合は、`nb env info` を使用します。

```bash
nb env info dev
nb env info dev --json
nb env info dev --field app.url
nb env info dev --show-secrets
```

このうち、`--field` はスクリプト内で値を 1 つだけ取るのに適しています。 `--show-secrets` は、トークンやパスワードなどの機密情報をプレーン テキストで表示します。明らかにトラブルシューティングが必要な場合にのみ使用してください。

## 環境設定を更新する

`nb env update` は、保存された環境の構成を調整するために使用されます。 API アドレス、認証方法、ソース コード ソース、アプリケーション ポート、データベース パラメーターなど。更新が完了すると、CLI は変更に基づいてフォローアップ手順を自動的に処理します。

現在の環境の最新の状態に従って CLI を再同期したいだけの場合は、次のように記述します。

```bash
nb env update
nb env update prod
```

この環境によって保存された接続情報またはローカル構成を変更する場合は、明示的にパラメーターを指定できます。

```bash
nb env update prod --api-base-url https://api.example.com/api
nb env update prod --access-token <token>
nb env update dev --app-port 13080 --timezone Asia/Shanghai
```

ここでまずデフォルトの判断を思い出してください。

- env によって保存された接続情報またはローカル構成を変更するには、`nb env update` を使用します。
- アプリケーション インターフェイス、プラグイン、または CLI で使用できる機能が変更されたばかりです。`nb env update` を再度実行することもできます
- ログイン ステータスの有効期限が切れているか、認証プロセスを再度実行する必要がある場合は、`nb env auth` を使用してください。
- 現在保存されている内容を確認するには、`nb env info` を使用してください

`app-port`、`timezone`、`db-*` などのローカル実行構成を変更した場合、`update` は保存された値を変更するだけで、アプリケーションは自動的に再起動しません。一般に、`nb app restart --env <name>` は後で実行されます。変更に CLI 管理の組み込みデータベースが関係する場合は、`nb app restart --env <name> --with-db` を使用します。

## 再認証

env は保存されているが、ログイン状態の有効期限が切れている場合、または認証方法を切り替えたい場合は、次のようにして再認証できます。

```bash
nb env auth
nb env auth prod
nb env auth prod --auth-type oauth
nb env auth prod --auth-type basic --username admin --password secret
nb env auth prod --auth-type token --access-token <api-key>
```

環境名を省略した場合、CLI は現在の環境を使用します。認証が完了すると、CLI はその後の同期を自動的に処理します。

## 環境を削除する

これらのシナリオは最も混乱を招きます。まず、デフォルトの提案を覚えておいてください。

- アプリケーションを停止したいだけの場合は、`nb app stop` を使用してください。
- 現在のマシンの組み込みデータベース ランタイムも停止したいので、`nb app stop --with-db` を使用してください。
- この環境はもう必要ないが、ストレージとローカル アプリ ファイルを最初に保持したい場合は、`nb env remove` を使用してください。
- ローカル ホスティング リソースもクリーンアップし、`nb env remove --purge` を使用します

保存された環境設定のみを削除したい場合は、次のようにします。

```bash
nb env remove staging
```

ローカルまたは Docker でホストされている環境で、ローカル マシン上で実行中のリソースとストレージ データもクリーンアップしたい場合は、`--purge` を追加できます。

```bash
nb env remove test --purge
```

非対話モードでは、`nb env remove` を `--force` に明示的に渡す必要があります。

```bash
nb env remove test --purge --force
```

`--purge` は、現在のマシン上の CLI 管理のリソースのみをクリーンアップします。リモート API 環境の場合、リモート サービス自体は削除されません。

アプリケーションと CLI で管理される組み込みデータベースを停止したいだけの場合は、次のように記述します。

```bash
nb app stop --env app1 --with-db
```

この環境を削除してもストレージとローカル アプリ ファイルは保持したい場合は、次のようにします。

```bash
nb env remove app1 --force
```

この環境のネイティブにホストされているコンテンツを本当にクリーンアップしたい場合は、`--purge` を追加します。

```bash
nb env remove app1 --purge --force
```

CLI ダウンロードによって管理されるローカル npm/Git env の場合、`--purge` は CLI でホストされるローカル アプリ ファイルも削除します。 HTTP または SSH 環境の場合、CLI に保存された環境設定のみが削除され、外部サービス自体は削除されません。

## 関連リンク

- [`nb env` コマンドリファレンス](../../api/cli/env/index.md)
- [`nb env update`](../../api/cli/env/update.md)
- [`nb session` コマンドリファレンス](../../api/cli/session/index.md)
- [nb アプリの設計意図](../cli-design/nb-app-design-intent.md)
- [アプリの管理](./manage-app.md)
