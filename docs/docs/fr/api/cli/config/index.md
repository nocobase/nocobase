---
title: "nb config"
description: "Référence de la commande nb config : gérer les éléments de configuration par défaut du CLI NocoBase."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Gérer la configuration par défaut du CLI. Clés actuellement prises en charge :

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Clés courantes

| Clé | Valeur par défaut | Description |
| --- | --- | --- |
| `locale` | résolution actuelle de la locale du CLI | Remplace la langue utilisée par le CLI |
| `update.policy` | `prompt` | Comportement de mise à jour au démarrage : `prompt`, `auto` ou `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Registre de paquets utilisé pour les paquets commerciaux |
| `docker.network` | `nocobase` | Réseau Docker par défaut utilisé par les applications Docker gérées par le CLI |
| `docker.container-prefix` | `nb` | Préfixe de conteneur par défaut utilisé par les applications Docker gérées par le CLI |
| `bin.docker` | `docker` | Remplace le chemin de l'exécutable Docker |
| `bin.git` | `git` | Remplace le chemin de l'exécutable Git |
| `bin.yarn` | `yarn` | Remplace le chemin de l'exécutable Yarn |

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
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Commandes connexes

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
