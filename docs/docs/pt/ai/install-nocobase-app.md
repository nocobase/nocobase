---
title: Instalar o aplicativo NocoBase
description: Instale o NocoBase CLI e crie rapidamente um novo aplicativo NocoBase com `nb init --ui`, para que o seu AI Agent possa começar a trabalhar imediatamente.
---

# Instalar o aplicativo NocoBase

Se você ainda não tem um aplicativo NocoBase, a forma mais rápida é instalar primeiro o `@nocobase/cli` e depois executar `nb init --ui` uma vez. Na maioria dos casos, as opções padrão do assistente já resolvem.

## Pré-requisitos

- Node.js >= 22
- Yarn 1.x
- Se pretende instalar com Docker, confira antes se o Docker já está em execução

## Passo 1: Instalar o CLI

Primeiro, instale o NocoBase CLI globalmente:

```bash
npm install -g @nocobase/cli
nb --version
```

Se você costuma trabalhar com vários terminais ao mesmo tempo, ou quer operar em paralelo com AI Agents, também recomendamos executar `nb session setup` uma vez. Assim, cada sessão mantém o seu próprio `current env`, e fica menos provável que uma interfira na outra.

## Passo 2: Inicializar o aplicativo

Por padrão, recomendamos abrir o assistente visual diretamente:

```bash
nb init --ui
```

![2026-06-11-20-14-32](https://static-docs.nocobase.com/2026-06-11-20-14-32.png)

Dependendo do caminho de setup escolhido, as etapas exibidas podem mudar um pouco. Se você seguir o caminho padrão `Install a new app`, normalmente verá estas seis etapas:

1. `Getting started` - definir o identificador `--env` e escolher `Install a new app`
2. `App environment` - definir as informações básicas do aplicativo, o local de armazenamento e a porta de execução
3. `App source and version` - escolher como obter o aplicativo e qual source e version usar
4. `Configure the database` - escolher o banco de dados embutido ou um banco de dados personalizado
5. `Create an admin account` - configurar a primeira conta de administrador
6. `Connection & authentication` - informar a URL de acesso do aplicativo e escolher um método de autenticação

Se preferir trabalhar pela linha de comando, você também pode executar:

```bash
nb init
```

Se precisar inicializar em scripts ou em CI, use o modo não interativo:

```bash
nb init --yes --env app1
```

:::tip Instalação em um servidor remoto

Se você executar `nb init --ui` em um servidor, recomendamos alterar antes o host padrão para o IP atual desse servidor. Assim, você poderá abrir o assistente no navegador local.

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

:::

## Passo 3: Confirmar que o aplicativo está pronto

Depois da instalação, normalmente vale a pena confirmar primeiro estas três coisas:

- O env foi salvo com sucesso
- O aplicativo iniciou normalmente
- Você consegue entrar com a conta de administrador

Os comandos mais usados são:

```bash
nb env list
nb env info
nb app logs
```

Em uma instalação local padrão, normalmente você pode abrir `http://localhost:13000` diretamente no navegador. Depois de fazer login, inicie uma nova sessão do AI Agent ou reinicie a atual, e a IA poderá começar a trabalhar com este aplicativo NocoBase.

As configurações do CLI ficam salvas em `~/.nocobase/` por padrão, então os AI Agents geralmente conseguem acessá-las a partir de qualquer diretório de trabalho.

Se esse aplicativo for exposto a usuários reais no futuro, não recomendamos manter o uso direto de `IP + port` no longo prazo. O próximo passo costuma ser colocar a aplicação atrás de um proxy reverso e habilitar HTTPS.

## Links relacionados

- [Comparação de Métodos de Instalação e Versões](../get-started/quickstart.md) — Compare primeiro os métodos de instalação e os canais de versão, depois decida como instalar
- [Guia de integração para AI Agent](./quick-start.mdx) — Conecte um aplicativo NocoBase existente e deixe seu AI Agent começar a trabalhar
- [Referência do comando `nb init`](../api/cli/init.md) — Inicializar um aplicativo novo, assumir um aplicativo local existente ou conectar um aplicativo remoto
- [Referência do comando `nb env info`](../api/cli/env/info.md) — Ver os detalhes de conexão e a configuração de runtime do env atual
- [NocoBase CLI](../api/cli/index.md) — Referência completa de todos os comandos `nb`
- [Gerenciamento de múltiplos ambientes](../nocobase-cli/operations/multi-environment.md) — Operações comuns quando você mantém vários envs ao mesmo tempo
