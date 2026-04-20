# NocoBase Skills

> [!WARNING]
> NocoBase Skills est encore à l'état de brouillon. Le contenu est fourni à titre de référence et peut changer à tout moment.

[NocoBase Skills](https://github.com/nocobase/skills) fournit un ensemble de Skills réutilisables pour des CLI d'agents de code comme Codex, Claude Code et OpenCode, afin de vous aider à travailler plus efficacement sur l'installation, la modélisation des données, la création d'interfaces et la configuration des workflows.

## Installation

1. Installez une CLI d'agent de code, par exemple Codex, Claude Code ou OpenCode.

2. Installez les Skills via [skills.sh](https://skills.sh/).

Installez toutes les NocoBase Skills depuis ce dépôt :

```bash
mkdir nocobase-app-builder && cd nocobase-app-builder
npx skills add nocobase/skills
```

## Flux d'utilisation recommandé

1. Installez NocoBase s'il n'est pas encore installé.

Vous pouvez demander directement à votre agent de le faire :

```text
Install and start NocoBase.
```

2. Configurez le serveur MCP de NocoBase.

Vous pouvez également demander à votre agent de configurer la connexion :

```text
Set up NocoBase MCP connection.
```

Vous pouvez aussi le configurer manuellement. Voir [NocoBase MCP](../mcp/index.md).

3. Commencez la modélisation des données et la construction de l'application.

Par exemple, vous pouvez dire à votre agent :

```text
I am building a CRM, design and create collections.
```

Une fois la connexion MCP établie, la plupart des API NocoBase peuvent être utilisées via les outils MCP.
