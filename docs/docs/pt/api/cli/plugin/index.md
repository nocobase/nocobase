---
title: "nb plugin"
description: "Referência do comando nb plugin: gerencia os plugins do env NocoBase selecionado e importa plugins empacotados para storage/plugins."
keywords: "nb plugin,NocoBase CLI,gerenciamento de plugins,enable,disable,list,import"
---

# nb plugin

Gerencia os plugins do env do NocoBase selecionado. O env npm/Git executa os comandos do plugin localmente, o env Docker executa dentro do contêiner da aplicação salvo, e o env HTTP recorre à API quando disponível.

## Uso

```bash
nb plugin <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb plugin import`](./import.md) | Importa um arquivo de plugin empacotado ou um pacote npm |
| [`nb plugin list`](./list.md) | Lista os plugins instalados |
| [`nb plugin enable`](./enable.md) | Ativa um ou mais plugins |
| [`nb plugin disable`](./disable.md) | Desativa um ou mais plugins |

## Exemplos

```bash
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
