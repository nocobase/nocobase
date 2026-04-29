---
title: "nb env auth"
description: "nb env auth コマンドリファレンス：保存済みの NocoBase env に対して OAuth ログインを実行します。"
keywords: "nb env auth,NocoBase CLI,OAuth,ログイン,認証"
---

# nb env auth

指定した env に対して OAuth ログインを実行します。環境名を省略すると、現在の env を使用します。

## 使い方

```bash
nb env auth [name]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `[name]` | string | 環境名。省略時は現在の env を使用します |

## 説明

内部では PKCE フローを使用しています。ローカルのコールバックサーバーを起動し、ブラウザで認証を行い、token を交換して設定ファイルに保存します。

## 使用例

```bash
nb env auth
nb env auth prod
```

## 関連コマンド

- [`nb env add`](./add.md)
- [`nb env update`](./update.md)
