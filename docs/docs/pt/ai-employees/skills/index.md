# NocoBase Skills

> [!WARNING]
> NocoBase Skills ainda está em estado de rascunho. O conteúdo é apenas para referência e pode mudar a qualquer momento.

[NocoBase Skills](https://github.com/nocobase/skills) oferece um conjunto de Skills reutilizáveis para CLIs de coding agent como Codex, Claude Code e OpenCode, ajudando você a trabalhar com mais eficiência em instalação, modelagem de dados, construção de interfaces e configuração de fluxos de trabalho.

## Instalação

1. Instale uma CLI de coding agent, como Codex, Claude Code ou OpenCode.

2. Instale Skills por meio do [skills.sh](https://skills.sh/).

Instale todas as NocoBase Skills deste repositório:

```bash
mkdir nocobase-app-builder && cd nocobase-app-builder
npx skills add nocobase/skills
```

## Fluxo de uso recomendado

1. Instale o NocoBase, caso ainda não esteja instalado.

Você pode pedir diretamente ao agent para fazer isso:

```text
Install and start NocoBase.
```

2. Configure o NocoBase MCP Server.

Você também pode pedir ao agent para configurar a conexão:

```text
Set up NocoBase MCP connection.
```

Você também pode configurá-lo manualmente. Veja [NocoBase MCP](../mcp/index.md).

3. Comece a modelagem de dados e a construção da aplicação.

Por exemplo, você pode dizer ao agent:

```text
I am building a CRM, design and create collections.
```

Depois que a conexão MCP estiver pronta, a maioria das APIs do NocoBase poderá ser usada por meio das ferramentas MCP.
