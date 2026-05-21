---
title: "nb license activate"
description: "Referencia del comando nb license activate: activar la licencia comercial de NocoBase para un env seleccionado."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Activa la licencia comercial para un env seleccionado. Puede proporcionar directamente un license key existente, o solicitar y activar una licencia en línea.

## Uso

```bash
nb license activate [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI; si se omite, se usa el env actual |
| `--key` | string | Pasar directamente un license key existente |
| `--key-file` | string | Leer el license key desde un archivo |
| `--online` | boolean | Solicitar una licencia en línea y activarla |
| `--account` | string | Cuenta del servicio de licencias para la activación en línea |
| `--password` | string | Contraseña del servicio de licencias para la activación en línea |
| `--desc` | string | Nombre de la aplicación para la activación en línea |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--json` | boolean | Salida en JSON |

## Ejemplos

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## Notas

Cuando se usa la activación en línea, el CLI solicita un license key al servicio de licencias con el ID de instancia y la URL de la aplicación del env actual.

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
