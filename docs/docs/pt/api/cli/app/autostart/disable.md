---
title: "nb app autostart disable"
description: "Referência de nb app autostart disable: desabilite o autostart do aplicativo para um env."
keywords: "nb app autostart disable,NocoBase CLI,autostart,env"
---

# nb app autostart disable

Desabilita o marcador de autostart do aplicativo para um env.

Depois de desabilitado, esse env deixa de participar de `nb app autostart run`. Este comando não interrompe diretamente um aplicativo que já esteja em execução. Se você também quiser parar o runtime atual, use `nb app stop` separadamente.

## Uso

```bash
nb app autostart disable [flags]
```

## Flags

| Flag | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env da CLI que será removido do autostart. Se omitido, usa o env atual |
| `--yes`, `-y` | boolean | Pula a confirmação interativa quando `--env` explícito aponta para um env diferente do env atual |

## Exemplos

```bash
nb app autostart disable
nb app autostart disable --env app1
nb app autostart disable --env app1 --yes
```

## Notas

Este comando altera apenas o marcador de autostart salvo. Ele não para diretamente o aplicativo. Se um env já não tinha autostart habilitado, ele simplesmente continuará desabilitado.

Assim como em `enable`, o CLI só verifica uma confirmação entre envs quando `--env` é passado explicitamente. Em terminais não interativos ou fluxos com agentes de IA, adicione `--yes` por conta própria quando necessário.

## Comandos relacionados

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart list`](./list.md)
- [`nb app stop`](../stop.md)
