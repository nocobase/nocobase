# NocoBase Skills

> [!WARNING]
> NocoBase Skills are still in draft status. The content is for reference only and may change at any time.

[NocoBase Skills](https://github.com/nocobase/skills) provides a set of reusable skills for coding agent CLIs such as Codex, Claude Code, and OpenCode, helping you work more efficiently on installation, data modeling, UI building, and workflow setup.

## Installation

1. Install a coding agent CLI, such as Codex, Claude Code, or OpenCode.

2. Install Skills through [skills.sh](https://skills.sh/).

Install all NocoBase Skills from this repository:

```bash
mkdir nocobase-app-builder && cd nocobase-app-builder
npx skills add nocobase/skills
```

## Recommended Workflow

1. Install NocoBase, if it is not already installed.

You can ask your agent to do it directly:

```text
Install and start NocoBase.
```

2. Set up the NocoBase MCP Server.

You can also ask your agent to configure it:

```text
Set up NocoBase MCP connection.
```

You can also configure it manually. See [NocoBase MCP](../mcp/index.md).

3. Start data modeling and application building.

For example, you can tell your agent:

```text
I am building a CRM, design and create collections.
```

After the MCP connection is ready, most NocoBase APIs can be accessed through MCP tools.
