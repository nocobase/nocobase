---
title: "nb env use"
description: "nb env use コマンドリファレンス：現在の NocoBase CLI env を切り替えます。"
keywords: "nb env use,NocoBase CLI,環境切り替え,current env"
---

# nb env use

現在の CLI env を切り替えます。以降、`--env` を省略したコマンドはこの env をデフォルトとして使用します。

## 使い方

```bash
nb env use <name>
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<name>` | string | 設定済みの環境名 |

## 使用例

```bash
nb env use local
```

## 関連コマンド

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
