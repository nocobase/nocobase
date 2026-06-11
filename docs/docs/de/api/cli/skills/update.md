---
title: "nb skills update"
description: "nb skills update Befehlsreferenz: Aktualisiert die globalen NocoBase AI coding skills."
keywords: "nb skills update,NocoBase CLI,Skills aktualisieren"
---

# nb skills update

Aktualisiert die global installierten NocoBase AI coding skills. Dieser Befehl aktualisiert lediglich eine bestehende Installation von `@nocobase/skills`.

## Verwendung

```bash
nb skills update [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Bestätigung der Aktualisierung überspringen |
| `--json` | boolean | Ausgabe als JSON |
| `--verbose` | boolean | Ausführliche Ausgabe der Aktualisierung anzeigen |

## Beispiele

```bash
nb skills update
nb skills update --yes
nb skills update --json
```

## Verwandte Befehle

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
