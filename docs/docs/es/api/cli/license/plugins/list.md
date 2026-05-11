---
title: "nb license plugins list"
description: "Referencia del comando nb license plugins list: mostrar los plugins comerciales asociados a la licencia actual para un env seleccionado."
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

Muestra los plugins comerciales asociados al license key guardado del env seleccionado.

## Uso

```bash
nb license plugins list [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI; si se omite, se usa el env actual |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--json` | boolean | Salida en JSON |

## Ejemplos

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --yes
nb license plugins list --env app1 --json
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
