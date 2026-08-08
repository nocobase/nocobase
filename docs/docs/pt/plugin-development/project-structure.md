---
title: "Estrutura do Projeto"
description: "Estrutura do projeto de plugins NocoBase: layout da aplicação nb init, diretório plugins, código-fonte source, diretório runtime storage."
keywords: "estrutura do projeto,nb init,plugins,diretório de plugins,NocoBase"
---

# Estrutura do Projeto

Aplicações inicializadas através do NocoBase CLI (`nb init`) geram um diretório de aplicação padrão. O CLI suporta duas origens, npm (`create-nocobase-app`) e Git, e a estrutura de nível superior é a mesma.

## Visão Geral do Diretório de Nível Superior

```bash
<app-path>/
├── .nb/                   # Metadados salvos pelo CLI para o env atual
├── source/                # Código-fonte da aplicação (NocoBase core + plugins integrados)
├── storage/               # Diretório de dados em tempo de execução
│   ├── plugins/           # Plugins compilados (enviados ou importados)
│   └── tar/               # Arquivos de pacote de plugins (.tgz)
├── plugins/               # Código-fonte dos seus plugins (nb scaffold plugin gera aqui)
├── .env                   # Arquivo de variáveis de ambiente da aplicação
```

## Diretório de Desenvolvimento de Plugins plugins/

`plugins/` é o local principal para o desenvolvimento de plugins personalizados. Plugins criados via `nb scaffold plugin` são colocados aqui.

O `nb` sincroniza automaticamente os plugins em `plugins/` para `source/packages/plugins/` via links simbólicos, para uso nos fluxos de desenvolvimento e construção. Você não precisa operar manualmente o conteúdo dentro do diretório `source/`.

## Diretório de Código-fonte source/

O diretório `source/` contém o código-fonte completo do projeto NocoBase. O conteúdo específico depende da origem do projeto:

- **Origem npm** (`create-nocobase-app`): Por padrão, contém apenas diretórios básicos como `packages/plugins/`.
- **Origem Git** (recomendado): Contém o código-fonte completo do framework (`packages/core/`), plugins integrados, etc. Ao usar IA para desenvolvimento, permite referenciar diretamente o código-fonte.

## Diretório de Tempo de Execução storage/

`storage/` armazena dados gerados em tempo de execução e saídas de build:

- `plugins/`: Plugins empacotados, enviados pela interface do usuário ou importados via CLI.
- `tar/`: Pacotes compactados de plugins gerados após executar `nb source build <plugin> --tar`.

## Caminhos de Carregamento e Prioridade de Plugins

Plugins podem existir em vários locais. O NocoBase os carregará na seguinte ordem de prioridade ao iniciar:

1. Versão do código-fonte em `source/packages/plugins` (para desenvolvimento e depuração local, sincronizada automaticamente pelo `nb` a partir de `plugins/`).
2. Versão empacotada em `storage/plugins` (enviada pela interface do usuário ou importada via CLI).
3. Pacotes de dependência em `node_modules` (instalados via npm/yarn ou integrados ao framework).

Quando um plugin com o mesmo nome existe tanto no diretório de código-fonte quanto no diretório empacotado, o NocoBase priorizará o carregamento da versão do código-fonte, facilitando substituições locais e depuração.

## Modelo de Diretório de Plugin

Crie um plugin usando a CLI:

```bash
nb scaffold plugin @my-project/plugin-hello
```

A estrutura de diretórios gerada é a seguinte:

```bash
plugins/@my-project/plugin-hello/
├── dist/                    # Saída de build (gerada conforme necessário)
├── src/                     # Diretório do código-fonte
│   ├── client-v2/           # Código frontend (blocos, páginas, modelos, etc.)
│   │   ├── plugin.ts        # Classe principal do plugin no lado do cliente
│   │   └── index.ts         # Entrada do lado do cliente
│   ├── locale/              # Recursos multilíngues (compartilhados entre frontend e backend)
│   ├── swagger/             # Documentação OpenAPI/Swagger
│   └── server/              # Código backend
│       ├── collections/     # Definições de coleções
│       ├── commands/        # Comandos personalizados
│       ├── migrations/      # Scripts de migração de banco de dados
│       ├── plugin.ts        # Classe principal do plugin no lado do servidor
│       └── index.ts         # Entrada do lado do servidor
├── index.ts                 # Exportação de ponte frontend e backend
├── client-v2.d.ts           # Declarações de tipo frontend
├── client-v2.js             # Artefato de build frontend
├── server.d.ts              # Declarações de tipo backend
├── server.js                # Artefato de build backend
├── .npmignore               # Configuração de ignorar na publicação
└── package.json
```

:::tip Dica

Após a conclusão do build, o diretório `dist/` e os arquivos `client-v2.js`, `server.js` serão carregados quando o plugin for habilitado. Durante a fase de desenvolvimento, você só precisa modificar o diretório `src/`. Antes de publicar, execute `nb source build <plugin>` ou `nb source build <plugin> --tar`.

:::

## Links relacionados

- [Escreva Seu Primeiro Plugin](./write-your-first-plugin.md) — Criando um plugin do zero e experimentando o fluxo completo de desenvolvimento
- [Visão Geral do Desenvolvimento no Servidor](./server/index.md) — Introdução geral e conceitos centrais dos plugins do lado do servidor
- [Visão Geral do Desenvolvimento no Cliente](./client/index.md) — Introdução geral e conceitos centrais dos plugins do lado do cliente
- [Construção e Empacotamento](./build.md) — Fluxo de construção, empacotamento e distribuição dos plugins
- [Gerenciamento de Dependências](./dependency-management.md) — Declaração e gerenciamento de dependências do plugin
