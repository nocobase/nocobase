---
title: "nb config"
description: "Referenz für den Befehl nb config: CLI-Standardkonfiguration verwalten."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

CLI-Standardkonfiguration verwalten. Derzeit unterstützte Schlüssel:

- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`

## Verwendung

```bash
nb config <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb config get`](./get.md) | Effektiven Wert eines Konfigurationsschlüssels auslesen |
| [`nb config set`](./set.md) | Einen Konfigurationswert setzen |
| [`nb config delete`](./delete.md) | Einen explizit gesetzten Wert löschen |
| [`nb config list`](./list.md) | Explizit gesetzte Werte auflisten |

## Beispiele

```bash
nb config list
nb config get docker.network
nb config set docker.network nocobase
nb config delete docker.container-prefix
```

## Verwandte Befehle

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
