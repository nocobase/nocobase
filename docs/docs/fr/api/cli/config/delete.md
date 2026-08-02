---
title: 'nb config delete'
description: 'Référence de la commande nb config delete : supprimer un élément de configuration CLI défini explicitement.'
keywords: 'nb config delete,NocoBase CLI,supprimer la configuration'
---

# nb config delete

Supprime un élément de configuration CLI défini explicitement. Après la suppression, cet élément revient à sa valeur par défaut.

## Utilisation

```bash
nb config delete <key>
```

## Paramètres

| Paramètre | Type   | Description                                                                                         |
| --------- | ------ | --------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nom de l’élément de configuration. Voir [`nb config`](./index.md) pour les valeurs prises en charge |

## Exemples

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete nb-image-registry
nb config delete nb-image-variant
nb config delete proxy.nb-cli-root
nb config delete proxy.upstream-host
nb config delete bin.nginx
nb config delete bin.git
nb config delete bin.pnpm
```

## Commandes associées

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
