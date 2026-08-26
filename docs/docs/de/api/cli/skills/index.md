---
title: "nb skills"
description: "nb skills Befehlsreferenz: Prüft, installiert, aktualisiert oder entfernt globale NocoBase AI coding skills."
keywords: "nb skills,NocoBase CLI,Skills,AI coding skills"
---

# nb skills

Prüft, installiert, aktualisiert oder entfernt globale NocoBase AI coding skills.

## Verwendung

```bash
nb skills <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb skills check`](./check.md) | Prüft die globalen NocoBase AI coding skills |
| [`nb skills install`](./install.md) | Installiert die NocoBase AI coding skills global |
| [`nb skills update`](./update.md) | Aktualisiert die installierten NocoBase AI coding skills |
| [`nb skills remove`](./remove.md) | Entfernt die von `nb` verwalteten NocoBase AI coding skills |

## Beispiele

```bash
nb skills check
nb skills install --yes
nb skills update --json
nb skills remove --yes
```

## Verwandte Befehle

- [`nb init`](../init.md)
- [`nb self`](../self/index.md)
