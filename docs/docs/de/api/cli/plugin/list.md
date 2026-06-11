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
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |

## Beispiele

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

## Verwandte Befehle

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
