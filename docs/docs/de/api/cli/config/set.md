---
title: "nb config set"
description: "Referenz zum Befehl nb config set: einen CLI-Konfigurationseintrag setzen."
keywords: "nb config set,NocoBase CLI,Konfiguration setzen"
---

# nb config set

Setzt einen CLI-Konfigurationseintrag. Die unterstützten Konfigurationsschlüssel findest du unter [`nb config`](./index.md).

## Verwendung

```bash
nb config set <key> <value>
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<key>` | string | Name des Konfigurationseintrags. Unterstützte Werte findest du unter [`nb config`](./index.md) |
| `<value>` | string | Konfigurationswert, darf nicht leer sein |

## Beispiele

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.caddy /opt/homebrew/bin/caddy
nb config set bin.git /usr/bin/git
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.pnpm /usr/local/bin/pnpm
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set bin.yarn yarn
```

## Hinweise

`update.policy` unterstützt `prompt`, `auto` und `off`. Der Standardwert ist `prompt`.

## Verwandte Befehle

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
