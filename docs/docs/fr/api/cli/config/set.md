---
title: "nb config set"
description: "Référence de la commande nb config set : définir une valeur de configuration du CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Définit une valeur de configuration du CLI. Les clés prises en charge sont `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` et `bin.yarn`.

## Utilisation

```bash
nb config set <key> <value>
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<key>` | string | Clé de configuration : `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |
| `<value>` | string | Valeur de configuration ; ne doit pas être vide |

## Exemples

```bash
nb config set locale fr-FR
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Remarques

Lors de la définition de `license.pkg-url`, le CLI normalise l'URL pour qu'elle se termine par `/`.

`update.policy` prend en charge `prompt`, `auto` et `off`. La valeur par défaut est `prompt`.

## Commandes connexes

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
