# NocoBase Skills

> [!WARNING]
> NocoBase Skills はまだドラフト段階です。内容は参考用であり、今後変更される可能性があります。

[NocoBase Skills](https://github.com/nocobase/skills) は、Codex、Claude Code、OpenCode などの coding agent CLI 向けに再利用可能な Skills を提供し、インストール、データモデリング、UI 構築、ワークフロー設定をより効率的に進められるようにします。

## インストール

1. Codex、Claude Code、OpenCode などの coding agent CLI をインストールします。

2. [skills.sh](https://skills.sh/) から Skills をインストールします。

このリポジトリにある NocoBase Skills をすべてインストールします。

```bash
mkdir nocobase-app-builder && cd nocobase-app-builder
npx skills add nocobase/skills
```

## 推奨ワークフロー

1. まだインストールしていない場合は NocoBase をインストールします。

agent に直接依頼することもできます。

```text
Install and start NocoBase.
```

2. NocoBase MCP Server を設定します。

接続設定も agent に依頼できます。

```text
Set up NocoBase MCP connection.
```

手動で設定する場合は [NocoBase MCP](../mcp/index.md) を参照してください。

3. データモデリングとアプリ構築を始めます。

たとえば agent に次のように伝えられます。

```text
I am building a CRM, design and create collections.
```

MCP 接続ができれば、NocoBase の大部分の API を MCP tools 経由で利用できます。
