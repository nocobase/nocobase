---
title: "nb env add"
description: "nb env add コマンドリファレンス：NocoBase API アドレスと認証方式を保存し、現在の env に切り替えます。"
keywords: "nb env add,NocoBase CLI,環境追加,API アドレス,認証"
---

# nb env add

名前付きの NocoBase API エンドポイントを保存し、CLI がその env を使用するように切り替えます。`oauth` 認証方式を選択すると、自動的に [`nb env auth`](./auth.md) のログインフローが開始されます。

## 使い方

```bash
nb env add [name] [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `[name]` | string | 環境名。TTY 環境では省略するとプロンプトが表示されます。非 TTY 環境では必須です |
| `--verbose` | boolean | 設定書き込み時に詳細な進捗を表示します |
| `--locale` | string | CLI プロンプトの言語：`en-US` または `zh-CN` |
| `--api-base-url`, `-u` | string | NocoBase API アドレス。`/api` プレフィックスを含みます |
| `--auth-type`, `-a` | string | 認証方式：`token` または `oauth` |
| `--access-token`, `-t` | string | `token` 認証方式で使用する API key または access token |

## 使用例

```bash
nb env add
nb env add local
nb env add local --api-base-url http://localhost:13000/api --auth-type oauth
nb env add local --api-base-url http://localhost:13000/api --auth-type token --access-token <token>
```

## 関連コマンド

- [`nb env auth`](./auth.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
