---
title: "Skill の定義"
description: "NocoBase AI 従業員の SKILLS.md における frontmatter、プロンプト本文、Tool のバインド、およびディレクトリの自動検出について解説します。"
keywords: "NocoBase, AI 従業員 Skill, SKILLS.md, Skill Toolバインド, business-analysis-report"
---

# Skill の定義

Skill はコードを実行しません。これはモデルに提供される操作ガイドであり、処理フロー、利用可能なツール、チェックステップ、および出力要件を規定するために使用されます。

## Skill ディレクトリ

各 Skill は独立したディレクトリを使用します：

```text
src/ai/skills/business-analysis-report/
├── SKILLS.md
└── tools/
    └── businessReportGenerator.ts
```

内訳：

- `SKILLS.md`：メタデータとプロンプト本文を定義します
- `tools/`：この Skill でのみ使用するTool を保存します
- `tools/` 内で検出されたToolは、自動的にこの Skill のツールリストに追加されます

## `SKILLS.md` の frontmatter

最小構成のSkill は以下の通りです：

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and explain the next step for starting NocoBase plugin development.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You help welcome developers who are starting NocoBase plugin development.

When the user asks you to greet or welcome a developer:

1. Extract the developer name from the request.
2. Call `greetDeveloper` exactly once.
3. Return the greeting from the tool result.
4. Ask which plugin capability the developer wants to build next.

Do not claim that the greeting was generated until the tool returns `status: "success"`.
```

frontmatter でよく使用されるフィールドは以下の通りです：

| フィールド | 役割 |
| --- | --- |
| `scope` | Skill の有効範囲。省略した場合は `SPECIFIED` となります |
| `name` | Skill の一意な名称 |
| `description` | モデルがこの Skillをいつロードすべきかを判断するための説明 |
| `introduction.title` | 管理画面に表示されるタイトル |
| `introduction.about` | 管理画面に表示される説明 |
| `tools` | バインドが必要な追加 Tool の名前リスト |

Skill の本文はそのまま保存され、Skillがロードされた後にモデルのコンテキストに追加されます。本文ではワークフローと制約に焦点を当て、Tool の実装詳細をコピーしないでください。

## Skill に Tool をバインドする

2つの方法があります。

1つ目は、frontmatter で明示的に宣言する方法です：

```yaml
tools:
  - getSkill
  - businessReportGenerator
```

2つ目は、Tool を現在のSkill の `tools/` ディレクトリに配置する方法です：

```text
src/ai/skills/welcome-developer/
├── SKILLS.md
└── tools/
    └── greetDeveloper.ts
```

ローダーが `greetDeveloper` を自動的に検出し、Skill のツールリストにマージします。特定のSkill 専用のToolは、デフォルトでSkill ディレクトリ内に配置することが推奨されており、これによりファイル位置でバインド関係を表現できます。

## Skill を適切に作成する

実用的なSkillには通常、以下の内容が含まれます：

1. ロールとタスクの境界
2. 遵守すべき処理順序
3. 各ステップでどのTool を呼び出すべきか
4. どのような場合にユーザーへの確認が必要か
5. Tool が失敗した際の処理方法
6. 最終的な出力構造と検証条件

Tool がデータを変更する場合、Skill はモデルに対してTool から成功の結果が返るまで待機することを明確に要求する必要があります。呼び出し前に操作が完了したと主張してはいけません。

## 組み込み Skill の例：`business-analysis-report`

`packages/plugins/@nocobase/plugin-ai/src/ai/skills/business-analysis-report/SKILLS.md` では、業務分析が明確なワークフローに分割されています：

```yaml
---
scope: GENERAL
name: business-analysis-report
description: Analyze business data with the data-query workflow and generate stakeholder-facing reports with markdown and ECharts.
introduction:
  title: '{{t("ai.skills.businessAnalysisReport.title", { ns: "@nocobase/plugin-ai" })}}'
  about: '{{t("ai.skills.businessAnalysisReport.about", { ns: "@nocobase/plugin-ai" })}}'
tools:
  - getSkill
  - businessReportGenerator
---
```

本文では単に「業務レポートを作成する」と書くのではなく、以下のように規定しています：

- まず意思決定の目標、ターゲット、期間、および指標を把握する
- 業務データに関わる場合、最初の ToolCall で必ず `data-query` Skill をロードする
- データテーブル、リレーションパス、クエリ結果を推測することを禁止する
- データが準備できてから `businessReportGenerator` を呼び出す
- チャートとMarkdown レポートを同じ ToolCall内で生成する
- Tool が返した `status`、`chartCount`、`errors`、`warnings` に基づいて成功か判断する
- チャートの生成に失敗した場合は1 回だけリトライし、その後は純粋なMarkdown レポートにフォールバックする

このようなルールこそがSkill の主な価値であり、「モデルができること」を再現可能で検証可能なプロセスへと収束させます。

## 関連リンク

- [AI 従業員プラグイン開発](./index.md) — AI 従業員拡張におけるSkill の位置付けについて
- [サーバーサイドTool の定義](./define-tool.md) — Skillから呼び出し可能なTool の定義
- [組み込み AI 従業員の定義](./define-ai-employee.md) — Skillを特定の従業員にバインドする
- [完全な例：組み込み AI 従業員の作成](./complete-example.md) — SkillとTool の完全なバインド例を確認する
