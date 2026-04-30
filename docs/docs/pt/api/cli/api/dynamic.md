---
title: "nb api comandos dinâmicos"
description: "Referência dos comandos dinâmicos do nb api: comandos da API gerados a partir do OpenAPI Schema do NocoBase."
keywords: "nb api comandos dinâmicos,NocoBase CLI,OpenAPI,swagger"
---

# nb api comandos dinâmicos

Além de [`nb api resource`](./resource/index.md), o `nb api` também conta com um conjunto de comandos gerados dinamicamente a partir do OpenAPI Schema da aplicação NocoBase. Esses comandos são gerados e armazenados em cache na primeira execução de [`nb env add`](../env/add.md) ou [`nb env update`](../env/update.md).

## Grupos comuns

| Grupo de comandos | Descrição |
| --- | --- |
| `nb api acl` | Gerenciamento de permissões: papéis, permissões de recursos e permissões de operações |
| `nb api api-keys` | Gerenciamento de API Keys |
| `nb api app` | Gerenciamento da aplicação |
| `nb api authenticators` | Gerenciamento de autenticação: senha, SMS, SSO, etc. |
| `nb api data-modeling` | Modelagem de dados: fontes de dados, tabelas e campos |
| `nb api file-manager` | Gerenciamento de arquivos: serviços de armazenamento e anexos |
| `nb api flow-surfaces` | Orquestração de páginas: páginas, blocos, campos e ações |
| `nb api system-settings` | Configurações do sistema: título, logo, idioma, etc. |
| `nb api theme-editor` | Gerenciamento de temas: cores, tamanhos e troca de tema |
| `nb api workflow` | Workflow: gerenciamento de fluxos automatizados |

Os grupos e comandos disponíveis na prática dependem da versão da aplicação NocoBase conectada e dos plugins habilitados. Execute os comandos abaixo para ver os comandos suportados pela aplicação atual:

```bash
nb api --help
nb api <topic> --help
```

## Parâmetros do corpo da requisição

Os comandos dinâmicos com corpo de requisição suportam:

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--body` | string | Corpo da requisição como string JSON |
| `--body-file` | string | Caminho para um arquivo JSON |

`--body` e `--body-file` são mutuamente exclusivos.

## Comandos relacionados

- [`nb env update`](../env/update.md)
- [`nb api resource`](./resource/index.md)
