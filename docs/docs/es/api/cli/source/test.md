---
title: "nb source test"
description: "Referencia del comando nb source test: ejecuta los tests en el directorio de la aplicación seleccionada y prepara automáticamente la base de datos de pruebas integrada."
keywords: "nb source test,NocoBase CLI,pruebas,Vitest,base de datos"
---

# nb source test

Ejecuta los tests en el directorio de la aplicación seleccionada. Antes de ejecutarlos, la CLI vuelve a crear una base de datos de pruebas Docker integrada e inyecta las variables de entorno `DB_*` de uso interno.

## Uso

```bash
nb source test [paths...] [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `[paths...]` | string[] | Rutas o globs de archivos de test que se pasan al test runner |
| `--cwd`, `-c` | string | Directorio de la aplicación donde se ejecutan los tests; por defecto, el directorio actual |
| `--watch`, `-w` | boolean | Ejecuta Vitest en modo watch |
| `--run` | boolean | Ejecución única, sin entrar en modo watch |
| `--allowOnly` | boolean | Permite tests con `.only` |
| `--bail` | boolean | Detiene la ejecución tras el primer fallo |
| `--coverage` | boolean | Habilita el informe de cobertura |
| `--single-thread` | string | Pasa el modo single-thread al test runner subyacente |
| `--server` | boolean | Fuerza el modo de tests del servidor |
| `--client` | boolean | Fuerza el modo de tests del cliente |
| `--db-clean`, `-d` | boolean | Limpia la base de datos cuando el comando subyacente lo permita |
| `--db-dialect` | string | Tipo de la base de datos de pruebas integrada: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--db-image` | string | Imagen Docker de la base de datos de pruebas integrada |
| `--db-port` | string | Puerto TCP del host al que se publica la base de datos de pruebas integrada |
| `--db-database` | string | Nombre de la base de datos inyectado para los tests |
| `--db-user` | string | Usuario de la base de datos inyectado para los tests |
| `--db-password` | string | Contraseña de la base de datos inyectada para los tests |
| `--verbose` | boolean | Muestra la salida subyacente de Docker y del test runner |

## Ejemplos

```bash
nb source test
nb source test --cwd /path/to/app
nb source test packages/core/server/src/__tests__/foo.test.ts
nb source test --server --coverage
nb source test --db-port 5433
```

## Comandos relacionados

- [`nb source build`](./build.md)
- [`nb db ps`](../db/ps.md)
