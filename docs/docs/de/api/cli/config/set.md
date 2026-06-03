---
title: 'nb config set'
description: 'Referenz zum Befehl nb config set: Setzt einen CLI-Konfigurationseintrag.'
keywords: 'nb config set,NocoBase CLI,Konfiguration setzen'
---

# nb config set

Setzt einen CLI-Konfigurationseintrag. Derzeit werden die Konfigurationseinträge `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` und `bin.yarn` unterstützt.

## Verwendung

```bash
nb config set <key> <value>
```

## Parameter

| Parameter | Typ    | Beschreibung                                                                                                                                     |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<key>`   | string | Name des Konfigurationseintrags: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` oder `bin.yarn` |
| `<value>` | string | Konfigurationswert, darf nicht leer sein                                                                                                         |

## Beispiele

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Hinweise

`update.policy` unterstützt `prompt`, `auto` und `off`; der Standardwert ist `prompt`.

## Verwandte Befehle

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
