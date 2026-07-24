---
title: "Visão Geral do Desenvolvimento de Plugins"
description: "Arquitetura de microkernel do NocoBase, ciclo de vida dos plugins, estrutura de diretórios, plug and play, full-stack, código-fonte client/server, metadados do package.json."
keywords: "desenvolvimento de plugins,plugin NocoBase,microkernel,ciclo de vida do plugin,full-stack,extensão NocoBase"
---

# Visão Geral do Desenvolvimento de Plugins

O NocoBase adota uma **arquitetura de microkernel**, onde o núcleo é responsável apenas pelo agendamento do ciclo de vida dos plugins, pelo gerenciamento de dependências e pela encapsulação de capacidades básicas. Todas as funcionalidades de negócio são fornecidas na forma de plugins. Portanto, entender a estrutura organizacional, o ciclo de vida e a forma de gerenciamento dos plugins é o primeiro passo para personalizar o NocoBase.

## Conceitos Essenciais

- **Plug and Play**: Você pode instalar, habilitar ou desabilitar plugins conforme a necessidade, permitindo a combinação flexível de funcionalidades de negócio sem a necessidade de modificar o código.
- **Integração Full-stack**: Os plugins geralmente incluem implementações tanto no lado do servidor quanto no lado do cliente, garantindo a consistência entre a lógica de dados e as interações da interface.

## Estrutura Básica de um Plugin

Cada plugin é um pacote npm independente e geralmente possui a seguinte estrutura de diretórios:

```bash
plugin-hello/
├─ package.json          # Nome do plugin, dependências e metadados do plugin NocoBase
├─ client-v2.js          # Artefato de build frontend para carregamento em tempo de execução
├─ server.js             # Artefato de build backend para carregamento em tempo de execução
├─ src/
│  ├─ client-v2/         # Código-fonte do lado do cliente, pode registrar blocos, ações, campos, etc.
│  └─ server/            # Código-fonte do lado do servidor, pode registrar recursos, eventos, comandos, etc.
```

## Pré-requisitos

Antes de desenvolver plugins, você precisa primeiro inicializar uma aplicação através do NocoBase CLI. O CLI suporta duas origens, npm e Git:

- **Origem npm** (`create-nocobase-app`): Ideal para começar rapidamente, pronto para uso.
- **Origem Git** (recomendado): Clona o repositório de código-fonte do NocoBase. Ao usar IA para desenvolvimento, permite referenciar diretamente o código-fonte do núcleo, com melhores resultados.

Consulte [Instalar aplicação via CLI](../nocobase-cli/installation/cli.md) ou [Guia de integração com AI Agent](../ai/quick-start.mdx) para detalhes.

## Convenções de Diretório e Ordem de Carregamento

Aplicações criadas via `nb init` possuem a seguinte estrutura de diretórios:

```bash
<app-path>/
├── .nb/                  # Metadados salvos pelo CLI para o env atual
├── source/               # Código-fonte da aplicação (projeto NocoBase)
├── storage/              # Diretório de dados em tempo de execução
│   └── plugins/          # Plugins compilados (enviados ou importados)
├── plugins/              # Código-fonte dos seus plugins (nb scaffold plugin gera aqui)
└── .env                  # Arquivo de variáveis de ambiente da aplicação
```

- `plugins/`: Diretório de código-fonte dos plugins que você desenvolve. Plugins criados via `nb scaffold plugin` são colocados aqui. O `nb` sincroniza automaticamente os plugins para `source/packages/plugins/` para uso nos fluxos de desenvolvimento e construção — você não precisa operar manualmente no diretório `source/`.
- `storage/plugins/`: Armazena plugins já compilados, como edições comerciais ou plugins de terceiros.

## Ciclo de Vida e Estados do Plugin

Um plugin geralmente passa pelas seguintes etapas:

1. **Criar (create)**: Cria um template de plugin via CLI.
2. **Puxar (pull)**: Baixa o pacote do plugin localmente, mas ainda não o grava no banco de dados.
3. **Habilitar (enable)**: Na primeira habilitação, executa "registro + inicialização"; habilitações subsequentes apenas carregam a lógica.
4. **Desabilitar (disable)**: Interrompe a execução do plugin.
5. **Remover (remove)**: Remove completamente o plugin do sistema.

:::tip

- O `pull` apenas baixa o pacote do plugin; o processo de instalação real é acionado pela primeira vez que você o `enable`.
- Se um plugin for apenas `pull`ed, mas não habilitado, ele não será carregado.

:::

### Exemplos de Comandos CLI

```bash
# 1. Cria o esqueleto do plugin
nb scaffold plugin @my-project/plugin-hello

# 2. Habilita o plugin (instala automaticamente na primeira habilitação)
nb plugin enable @my-project/plugin-hello

# 3. Desabilita o plugin
nb plugin disable @my-project/plugin-hello
```

## Interface de Gerenciamento de Plugins

Acesse o gerenciador de plugins no navegador para visualizar e gerenciar plugins de forma intuitiva:

**URL Padrão:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Gerenciador de Plugins](https://static-docs.nocobase.com/20251030195350.png)

## Links relacionados

- [Escreva Seu Primeiro Plugin](./write-your-first-plugin.md) — Criando um plugin de bloco do zero, entendendo o fluxo completo de desenvolvimento
- [Estrutura do Projeto](./project-structure.md) — Convenções de diretório do projeto NocoBase e ordem de carregamento dos plugins
- [Visão Geral do Desenvolvimento no Servidor](./server/index.md) — Introdução geral e conceitos centrais dos plugins do lado do servidor
- [Visão Geral do Desenvolvimento no Cliente](./client/index.md) — Introdução geral e conceitos centrais dos plugins do lado do cliente
- [Construção e Empacotamento](./build.md) — Fluxo de construção, empacotamento e distribuição dos plugins
- [Gerenciamento de Dependências](./dependency-management.md) — Declaração e gerenciamento de dependências do plugin