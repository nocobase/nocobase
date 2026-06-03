---
title: 'nb config get'
description: 'Référence de la commande nb config get : lit la valeur effective d’un élément de configuration CLI.'
keywords: 'nb config get,NocoBase CLI,lire la configuration'
---

# nb config get

Lit la valeur effective de l’élément de configuration CLI spécifié. S’il n’est pas défini explicitement, la valeur par défaut est renvoyée.

## Utilisation

```bash
nb config get <key>
```

## Paramètres

| Paramètre | Type   | Description                                                                                                                                       |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nom de l’élément de configuration : `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |

## Exemples

```bash
nb config get locale
nb config get update.policy
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Commandes associées

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
