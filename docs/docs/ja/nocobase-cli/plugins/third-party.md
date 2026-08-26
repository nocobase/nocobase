# サードパーティのプラグインのインストールとアップグレード

サードパーティのプラグイン パッケージを入手した場合は、通常、それをターゲット アプリケーションの `storage/plugins` にインポートし、アプリケーションを再起動して、プラグインの有効化または有効かどうかの確認を続けます。

## クイックインデックス

|欲しいです... |どこを見るべきか |
| --- | --- |
|まずターゲット環境に切り替えてから、プラグインのインポートまたは再起動を開始します。 [先に対象環境を確認してください](#先に対象環境を確認してください) |
|リモート圧縮パッケージ、ローカル圧縮パッケージ、または npm からサードパーティのプラグインをインポートします。 [プラグイン パッケージをインポートするには `nb plugin import` を使用します](#Use -nb-plugin-import-プラグイン パッケージをインポート) |
|ストレージインポートプラグインの指定 | [インポートするストレージ パスを指定](#インポートするストレージ パスを指定) |
|インポートが完了したら、アプリケーションにプラグイン ディレクトリをリロードさせます。 [`nb app restart`](../../api/cli/app/restart.md) |
|最初のインストール後にプラグインを正式に有効にします。 [`nb plugin enable`](../../api/cli/plugin/enable.md) |
|有効なサードパーティ製プラグインをアップグレードする | [プラグインをバージョンアップする場合の手順](#プラグインをバージョンアップする場合の手順) |
|現在のアプリケーションにプラグインが登場しているか確認したい | [`nb plugin list`](../../api/cli/plugin/list.md) |
|ターゲット マシンはインターネットに直接接続できず、手動で `.tgz` をアップロードしてからインポートすることしかできません。 【インターネットに直接接続できない場合】(#インターネットに直接接続できない場合) |

## まずは対象環境を確認してください

複数のアプリケーションをローカルで管理する場合は、まずターゲット環境に切り替えてから、次の操作を行います。

```bash
nb env use app1
```

## `nb plugin import` を使用してプラグイン パッケージをインポートします

`nb plugin import` は、リモート圧縮パッケージ、ローカル圧縮パッケージ、npm パッケージ名の 3 種類のソースをサポートします。このコマンドは、プラグインを `storage/plugins` にインポートするだけであり、プラグインを自動的に有効にすることはありません。

プラグイン パッケージのダウンロード アドレス、ローカル ファイル パスを取得している場合、またはプラグインが npm に公開されている場合は、次のコマンドを実行できます。

```bash
# 远程压缩包
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# 本地压缩包
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm 包名或 tag
nb plugin import @my-scope/plugin-auth-cas@beta
```

プライベート npm ソースを使用している場合は、通常、最初にログインしてからレジストリを指定します。

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

## インポートするストレージ パスを指定します

ターゲット アプリケーションの `storage` ルート ディレクトリがすでにわかっている場合は、現在の環境に依存せずに `--storage-path` を直接渡すこともできます。

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

CLI はプラグインを `<storage-path>/plugins` に書き込みます。現時点では、`nb env use` を最初に実行したり、__​​PH_2__ を渡したりすることはできません。

## インポート後に再起動します

インポートが完了したら、ターゲット アプリケーションを再起動します。

```bash
nb app restart
```

最初に現在の環境を切り替えない場合は、コマンドで明示的に `-e <env>` を渡すこともできます。

## 再起動後に有効にするか確認します

初めてのインストールの場合は、再起動してプラグインを有効にします。

```bash
nb plugin enable @nocobase/plugin-auth-cas
```

初めて有効にした場合、インストールは自動的に完了します。

## プラグインをアップグレードするときに行うべきこと

プラグインがすでに有効になっており、今回は新しいバージョンに切り替えるだけの場合、通常は次の 2 つの手順のみです。

```bash
nb plugin import /your/path/plugin-auth-cas-1.5.0.tgz
nb app restart
```

npm パッケージをインポートする場合も同じことが当てはまります。

```bash
nb plugin import @my-scope/plugin-auth-cas@latest
nb app restart
```

つまり、アップグレード シナリオでは `nb plugin enable` を追加で実行する必要はありません。新しいパッケージをインポートしてアプリケーションを再起動するだけです。

## インターネットに直接接続できない場合

ターゲット マシンがプラグインのダウンロード アドレスに直接アクセスできない場合は、まず `.tgz` ファイルをターゲット マシン上の任意のディレクトリにアップロードしてから、ターゲット マシン上でローカル インポートを実行します。

例えば：

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz
nb app restart
```

:::警告メモ

ここでは手動で `storage/plugins` に抽出する必要はありません。 `nb plugin import` は、プラグインを正しいディレクトリに自動的に配置します。

:::
