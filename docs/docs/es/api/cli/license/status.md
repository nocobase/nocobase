---
title: "nb license status"
description: "Referencia del comando nb license status: mostrar el estado de la licencia comercial de un env seleccionado."
keywords: "nb license status,NocoBase CLI,license status"
---

# nb license status

Muestra el estado de la licencia comercial del env seleccionado.

## Uso

```bash
nb license status [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI; si se omite, se usa el env actual |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--doctor` | boolean | Ejecutar comprobaciones y sugerencias de diagnóstico adicionales |
| `--json` | boolean | Salida en JSON |

## Ejemplos

```bash
nb license status
nb license status --env app1
nb license status --env app1 --yes
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Notas

El nuevo CLI todavía no implementa por completo las comprobaciones del estado de licencia en el backend. El comando puede devolver contexto básico y marcadores de diagnóstico, pero no un veredicto completo sobre la licencia.

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
