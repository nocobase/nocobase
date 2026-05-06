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
| `--doctor` | boolean | Ejecutar comprobaciones y sugerencias de diagnóstico adicionales |
| `--json` | boolean | Salida en JSON |

## Ejemplos

```bash
nb license status
nb license status --env app1
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Notas

El nuevo CLI todavía no implementa por completo las comprobaciones del estado de licencia en el backend. El comando puede devolver contexto básico y marcadores de diagnóstico, pero no un veredicto completo sobre la licencia.

## Comandos relacionados

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
