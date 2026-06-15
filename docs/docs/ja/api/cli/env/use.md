---
title: "nb env use"
description: "nb env use コマンドリファレンス：現在の NocoBase CLI env を切り替えます。"
keywords: "nb env use,NocoBase CLI,環境切り替え,current env"
---

# nb env use

現在の CLI env を切り替えます。以降、`--env` を省略したコマンドはこの env をデフォルトとして使用します。

現在のシェルまたはランタイムで session mode が有効な場合、この変更は現在のセッションにだけ影響します。

session mode が有効でない場合は、グローバルな `last env` の更新にフォールバックします。その場合、セッション分離のない他のターミナルやエージェントランタイムにも影響する可能性があります。

## 使い方

```bash
nb env use <name>
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<name>` | string | 切り替え先の設定済み環境名 |

## 使用例

```bash
nb env use local
```

## 関連コマンド

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
