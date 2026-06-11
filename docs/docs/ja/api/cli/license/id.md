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
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--force` | boolean | 保存済みの instance ID があっても再生成します |
| `--json` | boolean | JSON を出力します |

## 使用例

```bash
nb license id
nb license id --env app1
nb license id --env app1 --yes
nb license id --env app1 --force
nb license id --env app1 --json
```

`--force` は instance ID の再生成を強制するだけです。cross-env の確認を置き換えるものではありません。明示的に指定した `--env` が現在以外の env を指す場合でも、確認または `--yes` が必要です。

## 関連コマンド

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
