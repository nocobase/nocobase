---
title: "nb config set"
description: "Referenz für den Befehl nb config set: Einen CLI-Konfigurationswert setzen."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Setzt einen CLI-Konfigurationswert. Unterstützte Schlüssel sind `license.pkg-url`, `docker.network` und `docker.container-prefix`.

## Verwendung

```bash
nb config set <key> <value>
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<key>` | string | Konfigurationsschlüssel: `license.pkg-url`, `docker.network` oder `docker.container-prefix` |
| `<value>` | string | Konfigurationswert; darf nicht leer sein |

## Beispiele

```bash
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
```

## Hinweise

Beim Setzen von `license.pkg-url` normalisiert die CLI die URL so, dass sie mit `/` endet.

## Verwandte Befehle

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
