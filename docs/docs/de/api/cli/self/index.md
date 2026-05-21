---
title: "nb self"
description: "nb self Befehlsreferenz: Prüft oder aktualisiert die installierte NocoBase CLI."
keywords: "nb self,NocoBase CLI,Selbstaktualisierung,Versionsprüfung"
---

# nb self

Prüft oder aktualisiert die installierte NocoBase CLI.

## Verwendung

```bash
nb self <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb self check`](./check.md) | Prüft die aktuelle CLI-Version und die Unterstützung für Selbstaktualisierung |
| [`nb self update`](./update.md) | Aktualisiert die global per npm installierte NocoBase CLI |

## Beispiele

```bash
nb self check
nb self check --json
nb self update --yes
```

## Verwandte Befehle

- [`nb skills`](../skills/index.md)
- [`nb app upgrade`](../app/upgrade.md)
