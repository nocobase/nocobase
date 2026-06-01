---
title: "nb config delete"
description: "Référence de la commande nb config delete : supprimer un réglage CLI configuré explicitement."
keywords: "nb config delete,NocoBase CLI,configuration"
---

# nb config delete

Supprime un réglage CLI configuré explicitement. Après suppression, le CLI revient à la valeur par défaut pour cette clé.

## Utilisation

```bash
nb config delete <key>
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<key>` | string | Clé de configuration : `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |

## Exemples

```bash
nb config delete locale
nb config delete update.policy
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Commandes connexes

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
