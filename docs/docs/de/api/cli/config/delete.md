---
title: "nb config delete"
description: "Referenz zum Befehl nb config delete: einen explizit gesetzten CLI-Konfigurationseintrag löschen."
keywords: "nb config delete,NocoBase CLI,Konfiguration löschen"
---

# nb config delete

Löscht einen explizit gesetzten CLI-Konfigurationseintrag. Nach dem Löschen fällt der Eintrag auf seinen Standardwert zurück.

## Verwendung

```bash
nb config delete <key>
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<key>` | string | Name des Konfigurationseintrags. Unterstützte Werte findest du unter [`nb config`](./index.md) |

## Beispiele

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete proxy.nb-cli-root
nb config delete proxy.upstream-host
nb config delete bin.nginx
nb config delete bin.git
nb config delete bin.pnpm
```

## Verwandte Befehle

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
