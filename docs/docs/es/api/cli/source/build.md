---
title: "nb source build"
description: "Referencia del comando nb source build: compila el proyecto de código fuente local de NocoBase."
keywords: "nb source build,NocoBase CLI,compilación,código fuente"
---

# nb source build

Compila el proyecto de código fuente local de NocoBase. Debe ejecutarse en el directorio de código fuente (`<app-path>/source/`). Para las source apps gestionadas por el CLI, los plugins del directorio `plugins/` se sincronizan automáticamente a `source/packages/plugins/` antes de la compilación.

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
| `--tar` | boolean | Empaqueta automáticamente en archivo `.tgz` después de la compilación |
| `--verbose` | boolean | Muestra la salida detallada del comando |

## Ejemplos

```bash
nb source build
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
nb source build --no-dts
nb source build --sourcemap
```

## Descripción

Al usar `--tar`, el plugin especificado se empaqueta en un archivo `.tgz` después de la compilación, en el directorio `source/storage/tar/`. La ruta completa del tarball se muestra al finalizar el comando.

## Comandos relacionados

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
