---
title: "nb plugin list"
description: "nb plugin list Befehlsreferenz: Listet die Plugins der ausgewählten NocoBase env auf."
keywords: "nb plugin list,NocoBase CLI,Pluginliste"
---

# nb plugin list

Listet die installierten Plugins der ausgewählten env auf.

## Verwendung

```bash
nb plugin list [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI env. Wird der Name weggelassen, wird die aktuelle env verwendet |

## Beispiele

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local-docker
```

## Verwandte Befehle

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
