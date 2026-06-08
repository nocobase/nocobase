---
title: 'nb config'
description: 'Référence de la commande nb config : gérez les éléments de configuration par défaut de la CLI NocoBase.'
keywords: 'nb config,NocoBase CLI,configuration,configuration par défaut'
---

# nb config

Gérez la configuration par défaut de la CLI. Les éléments de configuration actuellement pris en charge incluent :

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.caddy`
- `bin.git`
- `bin.nginx`
- `bin.yarn`
- `proxy.provider`
- `proxy.nb-cli-root`
- `proxy.upstream-host`

## Éléments de configuration courants

| Élément de configuration | Valeur par défaut | Description |
| --- | --- | --- |
| `locale` | Résolu selon les règles actuelles de la CLI | Remplace la langue utilisée par la CLI |
| `update.policy` | `prompt` | Politique de mise à jour au démarrage : `prompt`, `auto` ou `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Remplace l’URL de téléchargement des paquets d’extensions commerciales |
| `docker.network` | `nocobase` | Réseau par défaut pour les applications Docker gérées par la CLI |
| `docker.container-prefix` | `nb` | Préfixe par défaut pour les conteneurs Docker gérés par la CLI |
| `bin.docker` | `docker` | Remplace le chemin de l’exécutable Docker |
| `bin.caddy` | `caddy` | Remplace le chemin de l’exécutable Caddy |
| `bin.git` | `git` | Remplace le chemin de l’exécutable Git |
| `bin.nginx` | `nginx` | Remplace le chemin de l’exécutable Nginx |
| `bin.yarn` | `yarn` | Remplace le chemin de l’exécutable Yarn |
| `proxy.provider` | `nginx` | Provider proxy par défaut utilisé par `nb env proxy` |
| `proxy.nb-cli-root` | Racine de la CLI, généralement le répertoire personnel de l’utilisateur actuel | Mappe le chemin `.nocobase` vers la racine visible par le processus proxy |
| `proxy.upstream-host` | `127.0.0.1` | Hôte utilisé par le proxy pour renvoyer le trafic vers l’application NocoBase |

## Utilisation

```bash
nb config <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb config get`](./get.md)       | Lit la valeur effective d’un élément de configuration                  |
| [`nb config set`](./set.md)       | Définit un élément de configuration                                    |
| [`nb config delete`](./delete.md) | Supprime un élément de configuration défini explicitement              |
| [`nb config list`](./list.md)     | Liste les éléments de configuration actuellement définis explicitement |

## Exemples

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.provider
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Commandes associées

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
