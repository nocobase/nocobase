---
title: "nb license status"
description: "nb license status コマンドリファレンス：選択した env の商用ライセンス状態を表示します。"
keywords: "nb license status,NocoBase CLI,license status"
---

# nb license status

選択した env の商用ライセンス状態を表示します。

## 使い方

```bash
nb license status [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env が使用されます |
| `--doctor` | boolean | 追加の診断チェックと提案を実行します |
| `--json` | boolean | JSON を出力します |

## 使用例

```bash
nb license status
nb license status --env app1
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## 補足

新しい CLI では、バックエンドのライセンス状態チェックはまだ完全には実装されていません。このコマンドは基本的なコンテキストや診断用プレースホルダーを返せますが、完全なライセンス判定はまだ行えません。

## 関連コマンド

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
