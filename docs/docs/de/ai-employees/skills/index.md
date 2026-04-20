# NocoBase Skills

> [!WARNING]
> NocoBase Skills befinden sich noch im Entwurfsstatus. Die Inhalte dienen nur als Referenz und können sich jederzeit ändern.

[NocoBase Skills](https://github.com/nocobase/skills) bietet eine Reihe wiederverwendbarer Skills für Coding-Agent-CLIs wie Codex, Claude Code und OpenCode und hilft dir, Installation, Datenmodellierung, UI-Aufbau und Workflow-Konfiguration effizienter umzusetzen.

## Installation

1. Installiere eine Coding-Agent-CLI, zum Beispiel Codex, Claude Code oder OpenCode.

2. Installiere Skills über [skills.sh](https://skills.sh/).

Installiere alle NocoBase Skills aus diesem Repository:

```bash
mkdir nocobase-app-builder && cd nocobase-app-builder
npx skills add nocobase/skills
```

## Empfohlener Ablauf

1. Installiere NocoBase, falls es noch nicht installiert ist.

Du kannst deinen Agenten direkt darum bitten:

```text
Install and start NocoBase.
```

2. Richte den NocoBase MCP-Server ein.

Du kannst auch deinen Agenten bitten, die Verbindung einzurichten:

```text
Set up NocoBase MCP connection.
```

Du kannst ihn auch manuell konfigurieren. Siehe [NocoBase MCP](../mcp/index.md).

3. Beginne mit Datenmodellierung und Anwendungsaufbau.

Zum Beispiel kannst du deinem Agenten sagen:

```text
I am building a CRM, design and create collections.
```

Sobald die MCP-Verbindung steht, können die meisten NocoBase-APIs über MCP-Tools aufgerufen werden.
