---
title: NocoBase アプリをアップグレード
description: CLI env として保存された NocoBase アプリを nb app upgrade でアップグレードします。env の確認、アップグレードコマンド、対象バージョン、結果確認を扱います。
---

# NocoBase アプリをアップグレード

## ステップ 1: 現在の env を確認する

まず、現在有効な CLI env を確認します。

```bash
nb env current
```

利用可能な env が分からない場合は、先に一覧を確認します。

```bash
nb env list
```

現在の env がアップグレード対象のアプリでない場合は、対象 env に切り替えます。

```bash
nb env use <env-name>
```

## ステップ 2: アップグレードを実行する

:::warning 注意

デフォルトでは、アップグレード時にアプリのソースコードまたは Docker イメージが再ダウンロードされます。

npm / Git env の場合、`source/` ディレクトリは削除されてから再ダウンロードされます。保持したいファイルを `source/` に置かないでください。

ソースコードまたは Docker イメージをすでに手動で準備していて、CLI に再ダウンロードさせたくない場合は、コマンドに `--skip-download` を追加します。

:::

デフォルトのアップグレードコマンドは次のとおりです。

```bash
nb app upgrade
```

このコマンドは通常、次の処理を行います。

1. 現在のアプリを停止する
2. 保存済みのソースまたはイメージをダウンロードして置き換える
3. 商用プラグインを同期する
4. アプリをアップグレードして起動する
5. env の runtime 情報を更新する

スクリプト、CI、AI Agent セッションで実行する場合は、`--force` を明示的に指定します。

```bash
nb app upgrade --force
```

アップグレード対象のアプリが現在の env でない場合は、env を指定します。

```bash
nb app upgrade --env app1 --yes --force
```

### 特定バージョンへアップグレードする

特定のバージョンチャネルにアップグレードするには `--version` を使います。

```bash
nb app upgrade --version beta
```

具体的なバージョン番号も指定できます。

```bash
nb app upgrade --version 2.1.0-beta.24
```

アップグレードに成功すると、CLI は対象バージョンを env 設定に書き戻します。以後のアップグレードや復旧フローでもそのバージョン情報を利用できます。

### ダウンロードをスキップする

ソースコードまたは Docker イメージをすでに更新済みで、現在の内容を使ってアップグレードと起動だけを行いたい場合は、`--skip-download` を追加します。

```bash
nb app upgrade --skip-download
```

このパラメータはソースまたはイメージのダウンロードをスキップし、商用プラグインの同期もスキップします。通常は、対象バージョンを手動で準備済みの場合にのみ使用します。

## ステップ 3: 結果を確認する

アップグレード後は、まず env runtime とアプリログを確認します。

```bash
nb env info
nb app logs
```

その後アプリを開き、管理者アカウントでログインできることを確認します。AI Agent にこのアプリの操作を続けさせる場合は、新しい AI Agent セッションを開始するか、現在のセッションを再起動して、最新の env 情報を読み込ませることをおすすめします。

## 関連リンク

- [アプリを管理する](../nocobase-cli/operations/manage-app.md) — アプリの起動、停止、再起動、ログ確認、アップグレード
- [`nb app upgrade` コマンドリファレンス](../api/cli/app/upgrade.md) — アップグレードコマンドの全オプションを確認する
- [複数環境の管理](../nocobase-cli/operations/multi-environment.md) — 複数の CLI env を確認、切り替え、管理する
