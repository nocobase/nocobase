---
title: "nb app autostart run"
description: "Referência de nb app autostart run: inicie todos os envs que têm o autostart do aplicativo habilitado."
keywords: "nb app autostart run,NocoBase CLI,autostart,início em lote"
---

# nb app autostart run

Inicia todos os envs que têm o autostart do aplicativo habilitado.

Este comando costuma ser chamado depois que o sistema host termina de subir, por meio do seu próprio mecanismo de inicialização. O CLI lê todos os envs salvos, filtra os que têm autostart habilitado e então tenta iniciá-los um por um.

## Uso

```bash
nb app autostart run [flags]
```

## Flags

| Flag | Tipo | Descrição |
| --- | --- | --- |
| `--verbose` | boolean | Mostra a saída bruta de inicialização dos comandos locais ou Docker subjacentes |

## Exemplos

```bash
nb app autostart run
nb app autostart run --verbose
```

## Notas

Se nenhum env tiver autostart habilitado, o comando imprime `No environments have app autostart enabled.`.

Durante a execução, o CLI processa cada env habilitado um por um:

- os envs que podem ser iniciados aparecem como `started`
- os envs que não devem ser iniciados automaticamente na máquina atual aparecem como `skipped`
- os envs que falham durante a inicialização aparecem como `failed`

Internamente, este comando chama `nb app start --env <name> --yes`. Se você passar `--verbose`, essa flag também será encaminhada para o fluxo de inicialização subjacente.

Se qualquer resultado for `failed`, o comando termina com erro e imprime `Some app autostart envs failed to start.`. Assim, as falhas ficam visíveis em `systemd`, CI ou outros mecanismos de inicialização do host.

## Comandos relacionados

- [`nb app autostart enable`](./enable.md)
- [`nb app start`](../start.md)
- [`nb app logs`](../logs.md)
