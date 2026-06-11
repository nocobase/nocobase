---
pkg: '@nocobase/plugin-ai'
title: 'AI 従業員のツール使用'
description: 'ツール（Tools）は AI 従業員の能力を定義します：General tools、Employee-specific tools、Custom tools、ツール権限 Ask/Allow の設定。'
keywords: 'AI 従業員ツール,Tools,Ask,Allow,ツール権限,NocoBase'
---

# ツールの使用

ツール（Tools）は AI 従業員が「何ができるか」を定義します。

## ツール構成

ツールページは 3 つのカテゴリに分かれています：

1. `General tools`：すべての AI 従業員で共有され、通常は読み取り専用です。
2. `Employee-specific tools`：現在の従業員専用のツールです。
3. `Custom tools`：ワークフローの「AI 従業員イベント」トリガーを使用してカスタムツールを作成できます。追加・削除が可能で、デフォルトの権限を設定できます。

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## ツール権限

ツールの権限は以下のように統一されています：

- `Ask`：呼び出し前に確認を求めます。
- `Allow`：直接の呼び出しを許可します。

推奨：データの変更を伴うツールについては、デフォルトで `Ask` を使用することをお勧めします。

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## ツール紹介

### 汎用ツール

| ツール名             | 機能説明                                     |
| -------------------- | -------------------------------------------- |
| Form filler          | 指定されたフォームにデータを入力します                         |
| Chart generator      | ECharts チャートの JSON 設定を生成します                  |
| Load specific SKILLS | スキルとスキルに必要なツールをロードします                     |
| Suggestions          | 現在の会話内容とコンテキストに基づいて、次のアクションの提案を行います |

### 専属ツール

| ツール名                     | 機能説明                                     | 所属従業員 |
| ---------------------------- | -------------------------------------------- | -------- |
| AI employee task dispatching | タスクタイプと従業員の能力に基づいてタスクを割り当てる業務ディスパッチツール | Atlas    |
| List AI employees            | 利用可能なすべての従業員を一覧表示します                             | Atlas    |
| Get AI employee              | スキルやツールを含む、指定された従業員の詳細情報を取得します       | Atlas    |

### カスタムツール

ワークフローモジュールでトリガータイプが `AI employee event` のワークフローを作成します。

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

`Custom tools` で `Add tool` をクリックしてワークフローをツールとして追加し、ビジネスリスクに応じて権限を設定します。

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
