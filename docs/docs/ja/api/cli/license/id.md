---
title: "nb license id"
description: "nb license id コマンドリファレンス：選択した env の商用ライセンス instance ID を表示または再生成します。"
keywords: "nb license id,NocoBase CLI,instance id"
---

# nb license id

選択した env の商用ライセンス instance ID を表示します。まだ保存済みの instance ID がない場合、CLI が自動的に生成して保存します。

## 使い方

```bash
nb license id [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env が使用されます |
| `--force` | boolean | 保存済みの instance ID があっても再生成します |
| `--json` | boolean | JSON を出力します |

## 使用例

```bash
nb license id
nb license id --env app1
nb license id --env app1 --force
nb license id --env app1 --json
```

## 関連コマンド

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
