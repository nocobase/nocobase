---
title: "nb source"
description: "Referência do comando nb source: gerencia o projeto local do código-fonte do NocoBase, incluindo download, desenvolvimento, build e testes."
keywords: "nb source,NocoBase CLI,código-fonte,download,dev,build,test"
---

# nb source

Gerencia o projeto local do código-fonte do NocoBase. O env npm/Git utiliza o diretório local do código-fonte; o env Docker, em geral, precisa apenas do [`nb app`](../app/index.md) para gerenciar o estado em execução.

## Uso

```bash
nb source <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb source download`](./download.md) | Obtém o NocoBase a partir do npm, Docker ou Git |
| [`nb source dev`](./dev.md) | Inicia o modo de desenvolvimento em um env de código-fonte npm/Git |
| [`nb source build`](./build.md) | Compila o projeto local do código-fonte |
| [`nb source test`](./test.md) | Executa testes no diretório da aplicação selecionada |

## Exemplos

```bash
nb source download --source npm --version alpha
nb source download --source docker --version alpha --docker-platform auto
nb source dev --env app1
nb source build @nocobase/acl
nb source test --server --coverage
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
