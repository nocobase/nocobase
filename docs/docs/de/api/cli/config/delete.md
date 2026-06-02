---
title: "nb config delete"
description: "Referenz für den Befehl nb config delete: Eine explizit gesetzte CLI-Einstellung löschen."
keywords: "nb config delete,NocoBase CLI,configuration"
---

# nb config delete

Löscht eine explizit gesetzte CLI-Einstellung. Danach fällt die CLI für diesen Schlüssel auf den Standardwert zurück.

## Verwendung

```bash
nb config delete <key>
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<key>` | string | Konfigurationsschlüssel: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` oder `bin.yarn` |

## Beispiele

```bash
nb config delete locale
nb config delete update.policy
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Verwandte Befehle

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
