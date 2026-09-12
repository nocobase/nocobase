---
title: "nb self check"
description: "Referencia del comando nb self check: comprueba la versión de la NocoBase CLI instalada y el soporte de actualización automática."
keywords: "nb self check,NocoBase CLI,comprobación de versión"
---

# nb self check

Comprueba la instalación actual de NocoBase CLI, resuelve la última versión del channel seleccionado e informa de si admite la actualización automática.

## Uso

```bash
nb self check [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--channel` | string | Channel de publicación con el que comparar; valor por defecto `auto`; opciones: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--json` | boolean | Genera la salida en JSON |

## Método de instalación

`nb self check` detecta el método de instalación actual en tiempo de ejecución. No usa el caché histórico `self-install-methods.json`.

El comando puede informar estos métodos de instalación:

| Método de instalación | Significado |
| --- | --- |
| `npm-global` | La CLI está instalada bajo el `npm prefix -g` actual. |
| `pnpm-global` | La CLI está instalada en un árbol global `node_modules` de pnpm. |
| `yarn-global` | La CLI se inicia desde `yarn global bin` o está instalada bajo `yarn global dir`. |
| `package-local` | La CLI está instalada en el árbol de dependencias de un proyecto local. |
| `source` | La CLI se ejecuta desde un checkout del repositorio. |
| `unknown` | La instalación de la CLI no se pudo asociar con un método de instalación compatible. |

La actualización automática es compatible con `npm-global`, `pnpm-global` y `yarn-global`. Para `package-local` o `source`, actualiza el proyecto padre o el checkout del repositorio.

## Ejemplos

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Comandos relacionados

- [`nb self update`](./update.md)
