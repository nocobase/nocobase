---
title: "nb config"
description: "Référence de la commande nb config : gérer la configuration par défaut du CLI."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Gérer la configuration par défaut du CLI. Clés actuellement prises en charge :

- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`

## Utilisation

```bash
nb config <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb config get`](./get.md) | Obtenir la valeur effective d'une clé de configuration |
| [`nb config set`](./set.md) | Définir une valeur de configuration |
| [`nb config delete`](./delete.md) | Supprimer une valeur configurée explicitement |
| [`nb config list`](./list.md) | Lister les valeurs configurées explicitement |

## Exemples

```bash
nb config list
nb config get docker.network
nb config set docker.network nocobase
nb config delete docker.container-prefix
```

## Commandes connexes

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
