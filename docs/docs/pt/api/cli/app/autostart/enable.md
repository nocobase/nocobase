---
title: "nb app autostart enable"
description: "Referência de nb app autostart enable: habilite o autostart do aplicativo para um env local ou Docker."
keywords: "nb app autostart enable,NocoBase CLI,autostart,env"
---

# nb app autostart enable

Habilita o marcador de autostart do aplicativo para um env.

Esse marcador só se aplica a envs `local` ou `docker` cujo runtime é gerenciado pelo CLI na máquina atual. Ele não inicia o aplicativo imediatamente. Em vez disso, adiciona o env ao conjunto que depois poderá ser iniciado por `nb app autostart run`.

## Uso

```bash
nb app autostart enable [flags]
```

## Flags

| Flag | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env da CLI que será adicionado ao autostart. Se omitido, usa o env atual |
| `--yes`, `-y` | boolean | Pula a confirmação interativa quando `--env` explícito aponta para um env diferente do env atual |

## Exemplos

```bash
nb app autostart enable
nb app autostart enable --env app1
nb app autostart enable --env app1 --yes
```

## Notas

O CLI só verifica se o env de destino é diferente do env atual quando você passa `--env` explicitamente. Em terminais interativos ele pede confirmação primeiro. Em terminais não interativos ou fluxos com agentes de IA, você precisa adicionar `--yes` por conta própria, ou trocar antes para o env de destino com `nb env use <name>`.

Se o env de destino não for um runtime `local` ou `docker` gerenciado pelo CLI na máquina atual, o comando falha e não salva o marcador de autostart.

## Comandos relacionados

- [`nb app autostart disable`](./disable.md)
- [`nb app autostart list`](./list.md)
- [`nb app autostart run`](./run.md)
