---
title: ローカル開発環境のセットアップ
description: NocoBase CLI と NocoBase アプリをローカルで使うための OS 環境を準備します。Windows WSL、macOS、Linux、Node.js、Yarn、Docker を扱います。
---

# ローカル開発環境のセットアップ

このページでは、NocoBase CLI と NocoBase アプリを利用するためのローカル環境を準備します。ローカル開発、機能検証、AI Agent による NocoBase のインストールや管理に適しています。

実際のユーザー向けにデプロイする場合は、先に [本番環境のシステム要件](../get-started/system-requirements.md) を確認してください。

## Windows: WSL を使用する

Windows でローカル環境を構築する場合、主な開発環境は WSL 2 の中に置くことをおすすめします。WSL の Linux ディストリビューションに Node.js、Yarn、NocoBase CLI をインストールし、関連コマンドは WSL ターミナルから実行します。

WSL は、NocoBase がよくデプロイされる Linux 環境に近い構成です。これには次の利点があります。

- 依存関係のインストール、ビルド、起動、ログ調査がサーバー上の実際の流れに近くなる
- Docker Desktop の WSL integration を有効にすると、WSL 内で直接 `docker` コマンドを実行できる
- Windows ネイティブ環境のパス形式、ファイル権限、シンボリックリンク、ネイティブ依存関係のビルドに起因する問題を減らせる
- AI Agent の操作に向いている。Agent が `nb`、`yarn`、`docker` などのコマンドを実行するとき、同じ Linux ファイルパス、shell 構文、実行環境を使うため、問題の切り分けがしやすい

WSL ベースのローカル開発環境がまだ準備できていない場合は、[Windows で WSL を使ってローカル開発環境をセットアップする](./windows-wsl.md) を参照してください。

推奨構成:

- Windows 10 / 11
- WSL 2
- Ubuntu LTS
- Node.js >= 22
- Yarn 1.x
- Docker で NocoBase をインストールする場合は Docker Desktop

通常、Node.js、Yarn、NocoBase CLI はすべて WSL 内にインストールします。Docker Desktop を使う場合は、Docker Desktop で WSL integration を有効にし、WSL から Docker にアクセスできるようにします。

環境を確認します。

```bash
node -v
yarn -v
docker version
```

:::tip 補足

NocoBase は Windows Server にもインストールできます。ここで WSL を推奨しているのは、個人 PC 上のローカル開発や AI Agent のセットアップを想定しているためです。Windows Server がデプロイに使えないという意味ではありません。

:::

## macOS

macOS では、ローカルのターミナルをそのまま使用できます。

準備するもの:

- Node.js >= 22
- Yarn 1.x
- Docker で NocoBase をインストールする場合は Docker Desktop、OrbStack、または Colima

環境を確認します。

```bash
node -v
yarn -v
docker version
```

Docker を使用しない場合は、`docker version` の確認を省略できます。

## Linux

Linux はそのままローカル開発環境として利用できます。Ubuntu、Debian、またはその他の一般的なディストリビューションをおすすめします。

準備するもの:

- Node.js >= 22
- Yarn 1.x
- Docker で NocoBase をインストールする場合は Docker Engine

環境を確認します。

```bash
node -v
yarn -v
docker version
```

Docker を使用しない場合は、`docker version` の確認を省略できます。

## 次のステップ

- [インストール方法とバージョン比較](../get-started/quickstart.md) — まずインストール方法とバージョンチャネルを比較する
- [NocoBase アプリをインストール](./install-nocobase-app.md) — NocoBase CLI でローカルアプリを初期化する
- [AI Agent 連携ガイド](./quick-start.mdx) — AI Agent が NocoBase に接続して操作できるようにする
