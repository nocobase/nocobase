---
title: "nb license activate"
description: "Referencia del comando nb license activate: activa una license key comercial existente de NocoBase para un env seleccionado."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Activa una license key comercial existente para un env seleccionado. Puedes pasarla directamente, leerla desde un archivo o pegarla en un terminal interactivo.

## Uso

```bash
nb license activate [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI; si se omite, se usa el env actual |
| `--key` | string | Pasar directamente una license key comercial existente |
| `--key-file` | string | Leer una license key comercial existente desde un archivo |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--json` | boolean | Salida en JSON |

## Ejemplos

```bash
nb license activate
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --json --key-file ./license.txt
```

## Notas

Cuando la ejecutas de forma interactiva, la CLI primero muestra el Hostname y el Instance ID actuales, y después te pide que pegues la license key directamente o introduzcas la ruta de un archivo de key. Esa información te ayuda a confirmar que la licencia se está vinculando a la instancia correcta.

Después de activar la licencia correctamente, reinicia la aplicación para que la licencia y el estado de los plugins comerciales surtan efecto de verdad; la CLI sincronizará automáticamente los plugins comerciales permitidos por la licencia actual antes del reinicio:

```bash
nb app restart
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb app restart`](../app/restart.md)
- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
