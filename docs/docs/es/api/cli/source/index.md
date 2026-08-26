---
title: "nb source"
description: "Referencia del comando nb source: gestiona el proyecto de código fuente local de NocoBase, incluyendo descarga, desarrollo, build y test."
keywords: "nb source,NocoBase CLI,código fuente,download,dev,build,test"
---

# nb source

Gestiona el proyecto de código fuente local de NocoBase. Los env npm/Git utilizan el directorio de código fuente local; los env Docker normalmente solo necesitan [`nb app`](../app/index.md) para gestionar el estado de ejecución.

## Uso

```bash
nb source <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb source download`](./download.md) | Obtiene NocoBase desde npm, Docker o Git |
| [`nb source dev`](./dev.md) | Inicia el modo de desarrollo en un env de código fuente npm/Git |
| [`nb source build`](./build.md) | Compila el proyecto de código fuente local |
| [`nb source test`](./test.md) | Ejecuta los tests en el directorio de la aplicación seleccionada |

## Ejemplos

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
