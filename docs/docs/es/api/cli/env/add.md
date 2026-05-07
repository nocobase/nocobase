---
title: "nb env add"
description: "Referencia del comando nb env add: guarda la dirección de la API de NocoBase y el método de autenticación, y la establece como env actual."
keywords: "nb env add,NocoBase CLI,añadir entorno,dirección de API,autenticación"
---

# nb env add

Guarda un endpoint con nombre de la API de NocoBase y cambia el CLI para utilizar ese env. Al elegir el método de autenticación `oauth`, se entra automáticamente en el flujo de inicio de sesión de [`nb env auth`](./auth.md).

## Uso

```bash
nb env add [name] [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `[name]` | string | Nombre del entorno; en TTY se solicita si se omite, en no-TTY es obligatorio |
| `--verbose` | boolean | Mostrar el progreso detallado al escribir la configuración |
| `--locale` | string | Idioma de los mensajes del CLI: `en-US` o `zh-CN` |
| `--api-base-url`, `-u` | string | Dirección de la API de NocoBase, incluyendo el prefijo `/api` |
| `--auth-type`, `-a` | string | Método de autenticación: `token` u `oauth` |
| `--access-token`, `-t` | string | API key o access token utilizado por el método de autenticación `token` |

## Ejemplos

```bash
nb env add
nb env add local
nb env add local --api-base-url http://localhost:13000/api --auth-type oauth
nb env add local --api-base-url http://localhost:13000/api --auth-type token --access-token <token>
```

## Comandos relacionados

- [`nb env auth`](./auth.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
