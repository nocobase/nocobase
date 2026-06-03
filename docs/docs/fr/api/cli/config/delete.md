---
title: 'nb config delete'
description: 'Référence de la commande nb config delete : supprime un élément de configuration CLI défini explicitement.'
keywords: 'nb config delete,NocoBase CLI,supprimer la configuration'
---

# nb config delete

Supprime un élément de configuration CLI défini explicitement. Après suppression, cet élément revient à sa valeur par défaut.

## Utilisation

```bash
nb config delete <key>
```

## Paramètres

| Paramètre | Type   | Description                                                                                                                                       |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nom de l’élément de configuration : `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |

## Exemples

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Commandes associées

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
