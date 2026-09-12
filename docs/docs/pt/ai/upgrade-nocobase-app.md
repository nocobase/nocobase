---
title: Atualizar o aplicativo NocoBase
description: Atualize um aplicativo NocoBase salvo como CLI env com nb app upgrade, incluindo confirmação do env, comandos de atualização, versões de destino e verificação.
---

# Atualizar o aplicativo NocoBase

:::tip Escopo

Este guia se aplica a aplicativos instalados com `nb init`. Se o seu aplicativo foi instalado pelo método antigo, leia primeiro [Como atualizar o NocoBase de 2.0 para 2.1](./upgrade-from-2-0-to-2-1.md).

:::

## Etapa 1: confirme o env atual

Primeiro confirme o CLI env ativo:

```bash
nb env current
```

Se você não souber quais envs estão disponíveis, liste-os primeiro:

```bash
nb env list
```

Se o env atual não for o aplicativo que você quer atualizar, alterne para o env de destino:

```bash
nb env use <env-name>
```

## Etapa 2: execute a atualização

:::warning Observação

Por padrão, a atualização baixa novamente o código-fonte do aplicativo ou a imagem Docker.

Para envs npm / Git, o diretório `source/` é excluído e baixado novamente. Não coloque arquivos que precisam ser preservados em `source/`.

Se você já preparou manualmente o código-fonte ou a imagem Docker e não quer que a CLI baixe novamente, adicione `--skip-download` ao comando.

:::

O comando padrão de atualização é:

```bash
nb app upgrade
```

Esse comando normalmente executa estas etapas:

1. Para o aplicativo atual
2. Baixa e substitui o código ou a imagem salvos
3. Sincroniza plugins comerciais
4. Atualiza e inicia o aplicativo
5. Atualiza as informações de runtime do env

Em scripts, CI ou sessões de AI Agent, passe `--force` explicitamente:

```bash
nb app upgrade --force
```

Se o aplicativo a ser atualizado não for o env atual, especifique o env:

```bash
nb app upgrade --env app1 --yes --force
```

### Atualizar para uma versão específica

Use `--version` para atualizar para um canal de versão específico:

```bash
nb app upgrade --version beta
```

Você também pode informar uma versão exata:

```bash
nb app upgrade --version 2.1.0-beta.24
```

Após uma atualização bem-sucedida, a CLI grava a versão de destino de volta na configuração do env, para que atualizações ou recuperações futuras possam reutilizá-la.

### Pular o download

Se você já atualizou o código-fonte ou a imagem Docker e quer apenas executar a atualização e iniciar com o conteúdo atual, adicione `--skip-download`:

```bash
nb app upgrade --skip-download
```

Esse parâmetro pula o download do código ou da imagem e também pula a sincronização de plugins comerciais. Normalmente use apenas quando a versão de destino já tiver sido preparada manualmente.

## Etapa 3: verifique o resultado

Após a atualização, verifique primeiro o runtime do env e os logs do aplicativo:

```bash
nb env info
nb app logs
```

Depois abra o aplicativo e confirme que a conta de administrador consegue entrar. Se você quiser que um AI Agent continue trabalhando com esse aplicativo, inicie uma nova sessão do AI Agent ou reinicie a sessão atual para que ele leia as informações mais recentes do env.

## Links relacionados

- [Gerenciar aplicativos](../nocobase-cli/operations/manage-app.md) — Iniciar, parar, reiniciar, ver logs e atualizar aplicativos
- [Referência do comando `nb app upgrade`](../api/cli/app/upgrade.md) — Ver todas as opções do comando de atualização
- [Gerenciamento de múltiplos ambientes](../nocobase-cli/operations/multi-environment.md) — Confirmar, alternar e manter vários CLI envs
