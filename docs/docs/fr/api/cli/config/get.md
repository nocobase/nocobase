---
title: 'nb config get'
description: 'Référence de la commande nb config get : lire la valeur effective d’un élément de configuration de la CLI.'
keywords: 'nb config get,NocoBase CLI,lire la configuration'
---

# nb config get

Lit la valeur effective de l’élément de configuration CLI indiqué. S’il n’a pas été défini explicitement, la valeur par défaut est renvoyée.

## Utilisation

```bash
nb config get <key>
```

## Paramètres

| Paramètre | Type   | Description                                                                                         |
| --------- | ------ | --------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nom de l’élément de configuration. Voir [`nb config`](./index.md) pour les valeurs prises en charge |

## Exemples

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get nb-image-registry
nb config get nb-image-variant
nb config get proxy.nb-cli-root
nb config get proxy.upstream-host
nb config get bin.nginx
nb config get bin.git
```

## Commandes associées

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
