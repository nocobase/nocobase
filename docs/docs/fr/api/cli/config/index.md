---
title: 'nb config'
description: 'Référence de la commande nb config : gérez les éléments de configuration par défaut de la CLI NocoBase.'
keywords: 'nb config,NocoBase CLI,configuration,configuration par défaut'
---

# nb config

Gérez la configuration par défaut de la CLI. Les éléments de configuration actuellement pris en charge incluent :

- `locale`
- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Éléments de configuration courants

| Élément de configuration  | Valeur par défaut                           | Description                                                       |
| ------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| `locale`                  | Résolu selon les règles actuelles de la CLI | Remplace la langue utilisée par la CLI                            |
| `update.policy`           | `prompt`                                    | Politique de mise à jour au démarrage : `prompt`, `auto` ou `off` |
| `docker.network`          | `nocobase`                                  | Réseau par défaut pour les applications Docker gérées par la CLI  |
| `docker.container-prefix` | `nb`                                        | Préfixe par défaut pour les conteneurs Docker gérés par la CLI    |
| `bin.docker`              | `docker`                                    | Remplace le chemin de l’exécutable Docker                         |
| `bin.git`                 | `git`                                       | Remplace le chemin de l’exécutable Git                            |
| `bin.yarn`                | `yarn`                                      | Remplace le chemin de l’exécutable Yarn                           |

## Utilisation

```bash
nb config <command>
```

## Sous-commandes

| Commande                          | Description                                                            |
| --------------------------------- | ---------------------------------------------------------------------- |
| [`nb config get`](./get.md)       | Lit la valeur effective d’un élément de configuration                  |
| [`nb config set`](./set.md)       | Définit un élément de configuration                                    |
| [`nb config delete`](./delete.md) | Supprime un élément de configuration défini explicitement              |
| [`nb config list`](./list.md)     | Liste les éléments de configuration actuellement définis explicitement |

## Exemples

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Commandes associées

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
