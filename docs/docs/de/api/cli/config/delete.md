---
title: 'nb config delete'
description: 'Referenz für den Befehl nb config delete: Löscht einen explizit gesetzten CLI-Konfigurationseintrag.'
keywords: 'nb config delete,NocoBase CLI,Konfiguration löschen'
---

# nb config delete

Löscht einen explizit gesetzten CLI-Konfigurationseintrag. Nach dem Löschen wird dieser Konfigurationseintrag auf den Standardwert zurückgesetzt.

## Verwendung

```bash
nb config delete <key>
```

## Parameter

| Parameter | Typ    | Beschreibung                                                                                                                                     |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<key>`   | string | Name des Konfigurationseintrags: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` oder `bin.yarn` |

## Beispiele

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Verwandte Befehle

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
