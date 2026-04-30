---
title: "nb self update"
description: "nb self update Befehlsreferenz: Aktualisiert die global per npm installierte NocoBase CLI."
keywords: "nb self update,NocoBase CLI,Aktualisierung,Selbstaktualisierung"
---

# nb self update

Aktualisiert die installierte NocoBase CLI, sofern die aktuelle CLI durch eine standardmäßige globale npm-Installation verwaltet wird.

## Verwendung

```bash
nb self update [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--channel` | string | Release-Channel, auf den aktualisiert werden soll, Standard `auto`; mögliche Werte: `auto`, `latest`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Bestätigung der Aktualisierung überspringen |
| `--json` | boolean | Ausgabe als JSON |
| `--verbose` | boolean | Ausführliche Ausgabe der Aktualisierung anzeigen |

## Beispiele

```bash
nb self update
nb self update --yes
nb self update --channel alpha --json
```

## Verwandte Befehle

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
