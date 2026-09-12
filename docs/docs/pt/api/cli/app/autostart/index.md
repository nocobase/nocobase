---
title: "nb app autostart"
description: "Referência do grupo de comandos nb app autostart: habilite ou desabilite o autostart para envs locais ou Docker e inicie todos os envs habilitados de uma vez."
keywords: "nb app autostart,NocoBase CLI,autostart,local,docker"
---

# nb app autostart

Gerencia as configurações de autostart do aplicativo.

Este grupo de comandos cobre dois tipos de trabalho:

- habilitar ou desabilitar o marcador de autostart para um env
- iniciar todos os envs que já têm autostart habilitado

`nb app autostart` só se aplica a envs com runtime gerenciado pelo CLI na máquina atual, ou seja, `local` e `docker`. Se um env for apenas uma conexão remota de API, ou não for um runtime de aplicativo gerenciado pelo CLI e iniciável nesta máquina, ele não pode participar desse fluxo de autostart.

## Uso

```bash
nb app autostart <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb app autostart enable`](./enable.md) | Habilita o marcador de autostart para um env |
| [`nb app autostart disable`](./disable.md) | Desabilita o marcador de autostart para um env |
| [`nb app autostart list`](./list.md) | Mostra o status de autostart de todos os envs |
| [`nb app autostart run`](./run.md) | Inicia todos os envs com autostart habilitado |

## Notas

`nb app autostart enable` apenas marca um env como autorizado a iniciar automaticamente. Isso não integra o env, por si só, ao fluxo de inicialização do sistema. Em um setup real de produção, normalmente você ainda precisa chamar `nb app autostart run` a partir do seu próprio mecanismo de inicialização do host, como `systemd`, um script de inicialização da plataforma de contêineres ou outro processo de boot que você já use.

Além disso, `nb app autostart run` verifica cada env habilitado um a um. Os envs que podem ser iniciados continuam internamente por `nb app start --env <name> --yes`. Os envs que não devem ser iniciados automaticamente na máquina atual aparecem como `skipped` ou `failed` na tabela de resultados.

## Exemplos

```bash
nb app autostart enable
nb app autostart enable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Comandos relacionados

- [`nb app start`](../start.md)
- [`nb app stop`](../stop.md)
- [`nb env list`](../../env/list.md)
- [`nb env use`](../../env/use.md)
