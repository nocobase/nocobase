---
title: "ビルドとパッケージング"
description: "NocoBase プラグインのビルドとパッケージング：yarn build、yarn nocobase tar、build.config.ts カスタム設定、Rsbuild クライアントバンドル、tsup サーバーバンドル。"
keywords: "プラグインビルド,プラグインパッケージング,yarn build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# ビルドとパッケージング

プラグインの開発が完了したら、ビルド（ソースコードのコンパイル）とパッケージング（`.tar.gz` の生成）の 2 つのステップを経て、他の NocoBase アプリケーションに配布して使用できるようになります。

## プラグインのビルド

ビルドでは `src/` 以下の TypeScript ソースコードを JavaScript にコンパイルします。クライアントコードは Rsbuild でバンドルされ、サーバーコードは tsup でバンドルされます：

```bash
yarn build @my-project/plugin-hello
```

ビルド成果物はプラグインのルートディレクトリの `dist/` に出力されます。

:::tip ヒント

プラグインがソースコードリポジトリ内で作成された場合、初回ビルド時にリポジトリ全体の型チェックが実行されるため、時間がかかる場合があります。依存関係がインストール済みであることを確認し、リポジトリをビルド可能な状態に保つことをお勧めします。

:::

## プラグインのパッケージング

パッケージングでは、ビルド成果物を `.tar.gz` ファイルに圧縮し、他の環境へのアップロードを容易にします：

```bash
yarn nocobase tar @my-project/plugin-hello
```

パッケージファイルはデフォルトで `storage/tar/@my-project/plugin-hello.tar.gz` に出力されます。

`--tar` パラメータを使用すると、ビルドとパッケージングを 1 ステップにまとめることもできます：

```bash
yarn build @my-project/plugin-hello --tar
```

## 他の NocoBase アプリケーションへのアップロード

`.tar.gz` ファイルをターゲットアプリケーションの `./storage/plugins` ディレクトリにアップロードして解凍するだけです。詳細な手順は [プラグインのインストールとアップグレード](../get-started/install-upgrade-plugins.mdx) をご覧ください。

## カスタムビルド設定

通常、デフォルトのビルド設定で十分です。カスタマイズが必要な場合 -- 例えばバンドルエントリの変更、エイリアスの追加、圧縮オプションの調整など -- プラグインのルートディレクトリに `build.config.ts` ファイルを作成してください：

```ts
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // クライアント（src/client-v2）の Rsbuild バンドル設定を変更
    // 参考：https://rsbuild.rs/guide/configuration/rsbuild
    return config;
  },
  modifyTsupConfig: (config) => {
    // サーバー（src/server）の tsup バンドル設定を変更
    // 参考：https://tsup.egoist.dev/#using-custom-configuration
    return config;
  },
  beforeBuild: (log) => {
    // ビルド開始前のコールバック、例：一時ファイルのクリーンアップ、コード生成など
  },
  afterBuild: (log) => {
    // ビルド完了後のコールバック、例：追加リソースのコピー、統計情報の出力など
  },
});
```

いくつかの重要なポイント：

- `modifyRsbuildConfig` -- クライアントバンドルの調整に使用します。例えば、Rsbuild プラグインの追加、resolve エイリアスの変更、コード分割戦略の調整などです。設定項目は [Rsbuild ドキュメント](https://rsbuild.rs/guide/configuration/rsbuild) を参照してください
- `modifyTsupConfig` -- サーバーバンドルの調整に使用します。例えば、target、externals、entry の変更などです。設定項目は [tsup ドキュメント](https://tsup.egoist.dev/#using-custom-configuration) を参照してください
- `beforeBuild` / `afterBuild` -- ビルド前後のフックで、ログ出力用の `log` 関数を受け取ります。例えば `beforeBuild` でコードファイルを生成し、`afterBuild` で静的リソースを成果物ディレクトリにコピーするなどの用途があります

## 関連リンク

- [はじめてのプラグインを作成する](./write-your-first-plugin.md) -- ゼロからプラグインを作成する、ビルドとパッケージングの完全なフロー
- [プロジェクトのディレクトリ構造](./project-structure.md) -- `packages/plugins`、`storage/tar` などのディレクトリの役割を理解する
- [依存関係の管理](./dependency-management.md) -- プラグインの依存関係宣言とグローバル依存関係
- [プラグイン開発の概要](./index.md) -- プラグイン開発の全体的な紹介
- [プラグインのインストールとアップグレード](../get-started/install-upgrade-plugins.mdx) -- パッケージファイルをターゲット環境にアップロードする
