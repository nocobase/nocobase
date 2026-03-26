# NocoBase Skills

> [!WARNING]
> NocoBase Skills todavía se encuentra en fase de borrador. El contenido es solo de referencia y puede cambiar en cualquier momento.

[NocoBase Skills](https://github.com/nocobase/skills) ofrece un conjunto de Skills reutilizables para CLI de coding agent como Codex, Claude Code y OpenCode, lo que te ayuda a trabajar con mayor eficiencia en instalación, modelado de datos, creación de interfaces y configuración de flujos de trabajo.

## Instalación

1. Instala un CLI de coding agent, por ejemplo Codex, Claude Code u OpenCode.

2. Instala Skills a través de [skills.sh](https://skills.sh/).

Instala todas las NocoBase Skills de este repositorio:

```bash
mkdir nocobase-app-builder && cd nocobase-app-builder
npx skills add nocobase/skills
```

## Flujo de uso recomendado

1. Instala NocoBase, si todavía no está instalado.

Puedes pedirle directamente a tu agent que lo haga:

```text
Install and start NocoBase.
```

2. Configura el servidor MCP de NocoBase.

También puedes pedirle a tu agent que configure la conexión:

```text
Set up NocoBase MCP connection.
```

También puedes configurarlo manualmente. Consulta [NocoBase MCP](../mcp/index.md).

3. Comienza con el modelado de datos y la construcción de la aplicación.

Por ejemplo, puedes decirle a tu agent:

```text
I am building a CRM, design and create collections.
```

Una vez establecida la conexión MCP, la mayoría de las APIs de NocoBase se pueden usar a través de herramientas MCP.
