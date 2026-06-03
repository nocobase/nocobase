---
title: 'nb config get'
description: 'Referenz für den Befehl nb config get: Liest den wirksamen Wert eines CLI-Konfigurationseintrags.'
keywords: 'nb config get,NocoBase CLI,Konfiguration lesen'
---

# nb config get

Liest den wirksamen Wert des angegebenen CLI-Konfigurationseintrags. Wenn er nicht explizit gesetzt wurde, wird der Standardwert zurückgegeben.

## Verwendung

```bash
nb config get <key>
```

## Parameter

| Parameter | Typ    | Beschreibung                                                                                                                                     |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<key>`   | string | Name des Konfigurationseintrags: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` oder `bin.yarn` |

## Beispiele

```bash
nb config get locale
nb config get update.policy
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Verwandte Befehle

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
