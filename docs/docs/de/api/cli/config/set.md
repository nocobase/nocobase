---
title: "nb config set"
description: "Referenz für den Befehl nb config set: Einen CLI-Konfigurationswert setzen."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Setzt einen CLI-Konfigurationswert. Unterstützte Schlüssel sind `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` und `bin.yarn`.

## Verwendung

```bash
nb config set <key> <value>
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<key>` | string | Konfigurationsschlüssel: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` oder `bin.yarn` |
| `<value>` | string | Konfigurationswert; darf nicht leer sein |

## Beispiele

```bash
nb config set locale de-DE
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Hinweise

Beim Setzen von `license.pkg-url` normalisiert die CLI die URL so, dass sie mit `/` endet.

`update.policy` unterstützt `prompt`, `auto` und `off`. Der Standardwert ist `prompt`.

## Verwandte Befehle

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
