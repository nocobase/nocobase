---
title: "nb portal registry"
description: "nb portal registry コマンドリファレンス：AI Portal ワークスペースでプラグイン提供の Portal Registry 項目を管理します。"
keywords: "nb portal registry,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry

AI Portal ワークスペース内の NocoBase Portal Registry 項目を管理します。サーバーで有効化されたプラグインは、コンポーネント、Hook、アダプター、デモページなど、再利用可能なフロントエンド統合を提供できます。Registry コマンドは、それらを Portal のソースコードにインストールします。

## 使用方法

```bash
nb portal registry <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb portal registry sync`](./sync.md) | 有効な NocoBase プラグインが提供する Registry 項目をインストールまたは更新します |

## 前提条件

- Portal ワークスペースが作成済みで、`package.json` と `components.json` が存在する必要があります。
- 選択した NocoBase env が Portal Registry API を公開している必要があります。
- 有効なプラグインが提供する Registry 項目だけを利用できます。

## 例

利用可能なすべての Registry 項目を `customer` Portal にインストールします。

```bash
nb portal registry sync customer
```

指定した項目だけをインストールします。

```bash
nb portal registry sync customer ai acl auth-sms
```

## 関連コマンド

- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
