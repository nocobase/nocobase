---
title: "nb app autostart list"
description: "Referência de nb app autostart list: mostre o status de autostart de todos os envs configurados."
keywords: "nb app autostart list,NocoBase CLI,autostart,lista de envs"
---

# nb app autostart list

Mostra o status de autostart de todos os envs configurados.

A tabela de saída inclui:

- `Current`: marca o env atual com `*`
- `Env`: nome do env
- `Kind`: tipo do env
- `Source`: tipo de instalação ou origem
- `Autostart`: se o autostart está habilitado

## Uso

```bash
nb app autostart list
```

## Exemplo

```bash
nb app autostart list
```

## Notas

Se ainda não houver nenhum env salvo, o comando imprime `No environments are configured.`.

Este comando mostra apenas o estado salvo no CLI. Ele não verifica se um aplicativo já está em execução, nem se o processo de inicialização do sistema já chama `nb app autostart run`. Seu objetivo principal é mostrar quais envs estão marcados para autostart na configuração do CLI.

## Comandos relacionados

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
