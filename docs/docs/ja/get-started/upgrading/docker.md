:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# Docker インストールのアップグレード

:::warning アップグレード前の準備

- 必ずデータベースのバックアップを取ってください。

:::

## 1. docker-compose.yml があるディレクトリへ移動する

例:

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. イメージのバージョン番号を更新する

:::tip バージョン番号について

- `latest` `latest-full` `beta` `beta-full` `alpha` `alpha-full` のようなエイリアスバージョンは、通常変更する必要はありません。
- `1.7.14` `1.7.14-full` のような数値バージョンは、ターゲットとなるバージョン番号に変更する必要があります。
- バージョン番号はアップグレードのみをサポートしており、ダウングレードはサポートしていません！！！
- 意図しない自動アップグレードを避けるため、本番環境では特定の数値バージョンに固定することをお勧めします。[すべてのバージョンを表示](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Alibaba Cloudのイメージの使用を推奨します（国内ネットワークがより安定しています）
    image: nocobase/nocobase:1.7.14-full
    # エイリアスバージョンも使用できます（自動アップグレードされる可能性があるため、本番環境での使用は慎重に）
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub（国内では遅い/失敗する可能性があります）
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. コンテナを再起動する

```bash
# 最新のイメージをプルする
docker compose pull app

# コンテナを再構築する
docker compose up -d app

# app プロセスの状況を確認する
docker compose logs -f app
```

## 4. サードパーティ製プラグインのアップグレード

[プラグインのインストールとアップグレード](../install-upgrade-plugins.mdx) を参照してください。

## 5. ロールバックについて

NocoBase はダウングレードをサポートしていません。ロールバックが必要な場合は、アップグレード前のデータベースバックアップを復元し、イメージバージョンを元のバージョンに戻してください。

## 6. よくある質問（FAQ）

**Q：イメージのプルが遅い、または失敗する**

イメージアクセラレータを使用するか、Alibaba Cloudのイメージ `nocobase/nocobase:<tag>` を使用してください。

**Q：バージョンが変更されていない**

`image` を新しいバージョン番号に変更し、`docker compose pull app` と `up -d app` を正常に実行したことを確認してください。

**Q：商用プラグインのダウンロードまたは更新が失敗する**

商用プラグインの場合は、システム内でライセンスキーを検証し、検証後に Docker コンテナを再起動してください。詳細は [NocoBase 商用ライセンスアクティベーションガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide) を参照してください。