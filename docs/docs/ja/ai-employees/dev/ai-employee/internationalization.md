---
title: "AI 従業員プラグインの国際化"
description: "NocoBase AI 従業員の Tool、Skill、組み込み従業員プロフィールで使用する国際化ファイル、翻訳テンプレート、現在の制限について説明します。"
keywords: "NocoBase,AI 従業員プラグインの国際化,Tool introduction,Skill introduction,locale"
---

# AI 従業員プラグインの国際化

AI 従業員プラグインの管理画面に表示するテキストは、現在の UI 言語に合わせる必要があります。Tool と Skill は `introduction` からプラグイン独自の locale ファイルを使用できますが、従業員プロフィールの扱いは異なります。

## 国際化が必要な内容

通常、管理者やユーザーに表示する次の UI テキストを国際化します：

- Tool の `introduction.title` と `introduction.about`
- Skill の `introduction.title` と `introduction.about`
- フロントエンドのカード、モーダル、操作ボタンに表示するテキスト

`definition.name`、`definition.description`、schema の説明、Skill の本文、AI 従業員のシステムプロンプトは主にモデル向けです。UI を翻訳するために、Tool の安定した名前やワークフローの内容を変更しないでください。

## Tool と Skill の管理画面テキストを翻訳する

Tool の `introduction` では、`{{t(...)}}` 翻訳テンプレートを使用できます：

```ts
introduction: {
  title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
  about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
},
```

Skill では、`SKILLS.md` の frontmatter に同じ形式で記述します：

```yaml
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
```

`ns` は、プラグインで実際に使用している国際化 namespace と一致させる必要があります。

## 言語ファイルを追加する

プラグインの言語ファイルは `src/locale/` ディレクトリに配置します。すべての言語で同じ key を使用し、対応するテキストだけを変更します。

### 英語のテキストを追加する

`src/locale/en-US.json` に追加します：

```json
{
  "ai.tools.greetDeveloper.title": "Developer name check",
  "ai.tools.greetDeveloper.about": "Validate the developer name before writing a welcome message.",
  "ai.tools.developerChoice.title": "Developer choices",
  "ai.tools.developerChoice.about": "Ask the developer to choose the next plugin capability.",
  "ai.skills.welcomeDeveloper.title": "Developer welcome",
  "ai.skills.welcomeDeveloper.about": "Welcome a developer and ask what plugin capability they want to build."
}
```

### 中国語のテキストを追加する

`src/locale/zh-CN.json` に追加します：

```json
{
  "ai.tools.greetDeveloper.title": "开发者姓名确认",
  "ai.tools.greetDeveloper.about": "在生成欢迎语之前确认开发者姓名。",
  "ai.tools.developerChoice.title": "开发方向选择",
  "ai.tools.developerChoice.about": "让开发者选择下一步要实现的插件能力。",
  "ai.skills.welcomeDeveloper.title": "欢迎开发者",
  "ai.skills.welcomeDeveloper.about": "欢迎开发者，并询问接下来要实现的插件能力。"
}
```

## AI 従業員プロフィールの現在の制限

AI 従業員プロフィールの `nickname`、`position`、`bio`、`greeting` には、上記の `{{t(...)}}` テンプレートは使用されません。現在、組み込み従業員の実行時には、これらの元の文字列が `@nocobase/plugin-ai` namespace で翻訳されます。そのため、サードパーティープラグインでは、独自の namespace が自動的に適用されると想定しないでください。

追加のローカライズ処理を実装しない場合は、従業員プロフィールには 1 つのデフォルト言語を使用し、Tool、Skill、フロントエンドインタラクションの UI テキストはプラグイン独自の locale ファイルに配置することを推奨します。

## 関連リンク

- [AI 従業員プラグイン開発](./index.md) — 開発ガイドの概要に戻る
- [サーバーサイド Tool の定義](./define-tool.md) — Tool の introduction で翻訳テンプレートを使用する
- [Skill の定義](./define-skill.md) — Skill の frontmatter で翻訳テンプレートを使用する
- [組み込み AI 従業員の定義](./define-ai-employee.md) — 従業員プロフィールのフィールドを確認する
- [Tool にフロントエンドインタラクションを追加する](./frontend-tool-ui.md) — フロントエンドのカードとモーダルに UI 翻訳を追加する
