---
title: "nb config get"
description: "Referenz für den Befehl nb config get: Effektiven Wert eines CLI-Konfigurationsschlüssels auslesen."
keywords: "nb config get,NocoBase CLI,configuration"
---

# nb config get

Liest den effektiven Wert eines CLI-Konfigurationsschlüssels aus. Wenn kein expliziter Wert gesetzt ist, wird der Standardwert zurückgegeben.

## Verwendung

```bash
nb config get <key>
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<key>` | string | Konfigurationsschlüssel: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` oder `bin.yarn` |

## Beispiele

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Verwandte Befehle

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
