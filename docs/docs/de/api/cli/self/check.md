---
title: "nb self check"
description: "nb self check Befehlsreferenz: Prüft die Version der installierten NocoBase CLI und die Unterstützung für Selbstaktualisierung."
keywords: "nb self check,NocoBase CLI,Versionsprüfung"
---

# nb self check

Prüft die aktuelle Installation der NocoBase CLI, ermittelt die neueste Version des gewählten Channels und meldet, ob automatische Selbstaktualisierung unterstützt wird.

## Verwendung

```bash
nb self check [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--channel` | string | Release-Channel zum Vergleich, Standard `auto`; mögliche Werte: `auto`, `latest`, `beta`, `alpha` |
| `--json` | boolean | Ausgabe als JSON |

## Beispiele

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Verwandte Befehle

- [`nb self update`](./update.md)
