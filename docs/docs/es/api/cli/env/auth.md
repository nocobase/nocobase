---
title: "nb env auth"
description: "Referencia del comando nb env auth: ejecuta el inicio de sesión OAuth para un env de NocoBase guardado."
keywords: "nb env auth,NocoBase CLI,OAuth,inicio de sesión,autenticación"
---

# nb env auth

Ejecuta el inicio de sesión OAuth para el env indicado. Si se omite el nombre del entorno, se utiliza el env actual.

## Uso

```bash
nb env auth [name]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `[name]` | string | Nombre del entorno; si se omite, se utiliza el env actual |

## Descripción

Internamente utiliza el flujo PKCE: inicia un servicio local de callback, abre el navegador para la autorización, intercambia el token y lo guarda en el archivo de configuración.

## Ejemplos

```bash
nb env auth
nb env auth prod
```

## Comandos relacionados

- [`nb env add`](./add.md)
- [`nb env update`](./update.md)
