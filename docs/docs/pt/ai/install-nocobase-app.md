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

No assistente, conclua estas etapas em ordem:

1. Defina o nome do aplicativo - ele também será o nome do env no CLI
2. Escolha "Nova instalação"
3. Escolha o método de instalação - Docker, npm ou Git
4. Defina a porta, o banco de dados e a conta de administrador
5. Aguarde o download, a instalação e a inicialização terminarem

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
nb env status
nb app logs
```

Em uma instalação local padrão, normalmente você pode abrir `http://localhost:13000` diretamente no navegador. Depois de fazer login, inicie uma nova sessão do AI Agent ou reinicie a atual, e a IA poderá começar a trabalhar com este aplicativo NocoBase.

As configurações do CLI ficam salvas em `~/.nocobase/` por padrão, então os AI Agents geralmente conseguem acessá-las a partir de qualquer diretório de trabalho.

Se esse aplicativo for exposto a usuários reais no futuro, não recomendamos manter o uso direto de `IP + port` no longo prazo. O próximo passo costuma ser colocar a aplicação atrás de um proxy reverso e habilitar HTTPS.

## O que vem a seguir

- Se você já tem uma instância NocoBase em execução, vá direto para o [Guia de integração para AI Agent](./quick-start.mdx)
- Se quiser continuar com a implantação em produção, vá para [Instalar com CLI](../nocobase-cli/installation/cli.md) e [Visão geral da implantação em produção](../nocobase-cli/production/index.md)
- Se quiser que a IA comece a construir o aplicativo em seguida, vá para [AI Builder](../ai-builder/index.md)
