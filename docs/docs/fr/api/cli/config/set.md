---
title: 'nb config set'
description: 'Référence de la commande nb config set : définit un élément de configuration de la CLI.'
keywords: 'nb config set,NocoBase CLI,définir la configuration'
---

# nb config set

Définit un élément de configuration de la CLI. Les éléments de configuration actuellement pris en charge sont `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` et `bin.yarn`.

## Utilisation

```bash
nb config set <key> <value>
```

## Paramètres

| Paramètre | Type   | Description                                                                                                                                       |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nom de l’élément de configuration : `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |
| `<value>` | string | Valeur de configuration, ne peut pas être vide                                                                                                    |

## Exemples

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Remarques

`update.policy` prend en charge `prompt`, `auto` et `off`, et la valeur par défaut est `prompt`.

## Commandes associées

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
