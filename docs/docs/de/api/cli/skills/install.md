---
title: "nb skills install"
description: "nb skills install Befehlsreferenz: Installiert die NocoBase AI coding skills global."
keywords: "nb skills install,NocoBase CLI,Skills installieren"
---

# nb skills install

Installiert die NocoBase AI coding skills global. Sind sie bereits installiert, führt dieser Befehl keine Aktualisierung durch.

## Verwendung

```bash
nb skills install [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Bestätigung der Installation überspringen |
| `--json` | boolean | Ausgabe als JSON |
| `--verbose` | boolean | Ausführliche Ausgabe der Installation anzeigen |

## Beispiele

```bash
nb skills install
nb skills install --yes
nb skills install --json
```

## Verwandte Befehle

- [`nb skills check`](./check.md)
- [`nb skills update`](./update.md)
