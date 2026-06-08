---
title: 'nb app'
description: 'Referência do comando nb app: gerencia o runtime do aplicativo NocoBase, incluindo iniciar, parar, reiniciar, logs e atualização.'
keywords: 'nb app,NocoBase CLI,iniciar,parar,reiniciar,logs,atualização'
---

# nb app

Gerencia o runtime do aplicativo NocoBase. Em npm/Git env, os comandos do aplicativo são executados no diretório local do código-fonte; em Docker env, os contêineres do aplicativo são gerenciados com base na configuração salva.

## Uso

```bash
nb app <command>
```

## Subcomandos

| Comando                          | Descrição                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| [`nb app start`](./start.md)     | Inicia o aplicativo ou recria o contêiner Docker                                    |
| [`nb app stop`](./stop.md)       | Para o aplicativo ou limpa o contêiner Docker                                       |
| [`nb app restart`](./restart.md) | Primeiro para e depois inicia o aplicativo                                          |
| [`nb app autostart`](./autostart/index.md) | Gerencia marcadores de autostart e inicia todos os envs habilitados |
| [`nb app logs`](./logs.md)       | Visualiza os logs do aplicativo                                                     |
| [`nb app upgrade`](./upgrade.md) | Para o aplicativo, substitui o código-fonte ou a imagem e depois o inicia novamente |

## Exemplos

```bash
nb app start --env app1
nb app restart --env app1
nb app autostart enable --env app1 --yes
nb app autostart run
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app stop --env app1 --with-db
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb env remove`](../env/remove.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
