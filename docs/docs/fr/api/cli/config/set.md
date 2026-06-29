---
title: "nb config set"
description: "Référence de la commande nb config set : définir un élément de configuration de la CLI."
keywords: "nb config set,NocoBase CLI,définir la configuration"
---

# nb config set

Définit un élément de configuration de la CLI. Voir [`nb config`](./index.md) pour les clés de configuration prises en charge.

## Utilisation

```bash
nb config set <key> <value>
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<key>` | string | Nom de l’élément de configuration. Voir [`nb config`](./index.md) pour les valeurs prises en charge |
| `<value>` | string | Valeur de configuration, ne peut pas être vide |

## Exemples

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

## Remarques

`update.policy` prend en charge `prompt`, `auto` et `off`, et la valeur par défaut est `prompt`.

## Commandes associées

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
