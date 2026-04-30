---
title: "nb plugin disable"
description: "nb plugin disable Befehlsreferenz: Deaktiviert ein oder mehrere Plugins in der ausgewählten NocoBase env."
keywords: "nb plugin disable,NocoBase CLI,Plugin deaktivieren"
---

# nb plugin disable

Deaktiviert ein oder mehrere Plugins in der ausgewählten env.

## Verwendung

```bash
nb plugin disable <packages...> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<packages...>` | string[] | Plugin-Paketnamen, erforderlich, mehrere Werte werden unterstützt |
| `--env`, `-e` | string | Name der CLI env. Wird der Name weggelassen, wird die aktuelle env verwendet |

## Beispiele

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
```

## Verwandte Befehle

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
