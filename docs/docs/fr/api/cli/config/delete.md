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
| `<key>` | string | Clé de configuration : `license.pkg-url`, `docker.network` ou `docker.container-prefix` |

## Exemples

```bash
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
```

## Commandes connexes

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
