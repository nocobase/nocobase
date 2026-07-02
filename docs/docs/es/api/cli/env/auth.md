---
title: "nb env auth"
description: "Referencia del comando nb env auth: autentica un env de NocoBase guardado con basic, token u OAuth."
keywords: "nb env auth,NocoBase CLI,basic,token,OAuth,inicio de sesión,autenticación"
---

# nb env auth

Vuelve a autenticar un env de NocoBase guardado o actualiza la información de autenticación guardada para él. Si se omite el nombre del entorno, se utiliza el env actual.

`nb env auth` admite tres métodos de autenticación: `basic`, `token` y `oauth`. Si se omite `--auth-type`, la CLI primero infiere el método a partir de las opciones de autenticación que pases. Si aun así no puede inferirlo, usa el método de autenticación ya guardado en el env.

## Uso

```bash
nb env auth [name] [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `[name]` | string | Nombre del entorno configurado en el que se iniciará sesión; si se omite, se usa el env actual |
| `--auth-type`, `-a` | string | Método de autenticación: `basic`, `token` u `oauth` |
| `--access-token`, `-t` | string | API key o access token usado con la autenticación `token` |
| `--username` | string | Nombre de usuario usado con la autenticación `basic`; se solicita en un TTY si se omite |
| `--password` | string | Contraseña usada con la autenticación `basic`; se solicita en un TTY si se omite |

## Opciones de compatibilidad

| Opción | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del entorno, equivalente a `[name]`. Esta opción oculta se conserva por compatibilidad con otros comandos; normalmente basta con el argumento posicional |

## Descripción

Los métodos de autenticación funcionan así:

- `basic`: inicia sesión en NocoBase con nombre de usuario y contraseña, y guarda el access token devuelto junto con el nombre de usuario
- `token`: guarda el API key o access token pasado con `--access-token`
- `oauth`: inicia el flujo de autenticación en el navegador y guarda el access token cuando finaliza la autenticación

En un terminal interactivo, la CLI solicita `--auth-type`, `--username`, `--password` o `--access-token` cuando hace falta. En modo no interactivo, la autenticación `basic` requiere `--username` y `--password`.

La autenticación `oauth` intenta primero Device Authorization Grant. Cuando el servidor OAuth admite este flujo, el comando muestra una URL de verificación y un código de usuario, y después espera mediante polling hasta que la aprobación en el navegador se complete. Esto funciona en servidores remotos o sin interfaz gráfica porque no requiere un listener de callback local.

Si el servidor OAuth no expone un device authorization endpoint, el comando vuelve al flujo PKCE loopback: inicia un servicio local de callback, abre el navegador para la autorización, intercambia el token y lo guarda en el archivo de configuración.

Después de autenticarse correctamente, la CLI ejecuta automáticamente `nb env update <name>` para volver a sincronizar el estado del env.

## Límites

- `[name]` y `--env` no pueden indicar nombres de entorno diferentes al mismo tiempo
- `--access-token` no puede usarse con `--username` ni `--password`
- `--auth-type oauth` no puede usarse con `--access-token`, `--username` ni `--password`
- `--auth-type token` no puede usarse con `--username` ni `--password`
- `--auth-type basic` no puede usarse con `--access-token`
- `--access-token`, `--username` y `--password` no pueden estar vacíos después de proporcionarlos

## Ejemplos

```bash
# Autenticar el env actual con el método de autenticación guardado
nb env auth

# Autenticar un env específico
nb env auth prod

# Usar inicio de sesión OAuth en el navegador
nb env auth prod --auth-type oauth

# Iniciar sesión con nombre de usuario y contraseña
nb env auth prod --auth-type basic --username admin --password secret

# Guardar un API key o access token
nb env auth prod --auth-type token --access-token <api-key>
```

Para device authorization, sigue la URL que imprime el comando e introduce en el navegador el código mostrado.

## Comandos relacionados

- [`nb env add`](./add.md)
- [`nb env info`](./info.md)
- [`nb env update`](./update.md)
