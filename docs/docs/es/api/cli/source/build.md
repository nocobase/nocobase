---
title: "nb source build"
description: "Referencia del comando nb source build: compila el proyecto de código fuente local de NocoBase."
keywords: "nb source build,NocoBase CLI,compilación,código fuente"
---

# nb source build

Compila el proyecto de código fuente local de NocoBase. Este comando reenvía la ejecución del antiguo flujo de build de NocoBase desde la raíz del repositorio.

## Uso

```bash
nb source build [packages...] [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `[packages...]` | string[] | Nombres de los paquetes a compilar; si se omite, se compilan todos |
| `--cwd`, `-c` | string | Directorio de trabajo |
| `--no-dts` | boolean | No genera archivos de declaración `.d.ts` |
| `--sourcemap` | boolean | Genera sourcemap |
| `--verbose` | boolean | Muestra la salida detallada del comando |

## Ejemplos

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
```

## Comandos relacionados

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
