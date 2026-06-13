---
title: "nb config"
description: "Référence de nb config : gérer les valeurs de configuration par défaut de la CLI NocoBase."
keywords: "nb config,NocoBase CLI,configuration,configuration par défaut"
---

# nb config

Gère les valeurs de configuration par défaut de la CLI. Les clés actuellement prises en charge se regroupent principalement ainsi :

- La CLI elle-même : `locale`, `update.policy`, `license.pkg-url`
- Runtime Docker : `docker.network`, `docker.container-prefix`
- Exécutables externes : `bin.docker`, `bin.caddy`, `bin.git`, `bin.nginx`, `bin.yarn`
- Génération de proxy : `proxy.nb-cli-root`, `proxy.upstream-host`, `proxy.nginx-driver`, `proxy.caddy-driver`

La plupart des projets n'ont besoin que de quelques-unes de ces clés. En pratique, les plus courantes sont :

- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.nginx` ou `bin.caddy`
- `proxy.nginx-driver` ou `proxy.caddy-driver`

## Clés de configuration courantes

| Clé | Valeur par défaut | Description |
| --- | --- | --- |
| `locale` | résolue selon les règles actuelles de la CLI | Remplace la langue utilisée par la CLI |
| `update.policy` | `prompt` | Politique de mise à jour au démarrage : `prompt`, `auto` ou `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Remplace l'URL de téléchargement des paquets d'extensions commerciales |
| `docker.network` | `nocobase` | Réseau par défaut pour les applications Docker gérées par la CLI |
| `docker.container-prefix` | `nb` | Préfixe par défaut pour les conteneurs Docker gérés par la CLI |
| `bin.docker` | `docker` | Remplace le chemin de l'exécutable Docker |
| `bin.caddy` | `caddy` | Remplace le chemin de l'exécutable Caddy |
| `bin.git` | `git` | Remplace le chemin de l'exécutable Git |
| `bin.nginx` | `nginx` | Remplace le chemin de l'exécutable Nginx |
| `bin.yarn` | `yarn` | Remplace le chemin de l'exécutable Yarn |
| `proxy.nb-cli-root` | racine de la CLI, généralement le répertoire personnel de l'utilisateur courant | Remplace la racine visible par la configuration proxy générée lorsque le processus proxy et la CLI ne voient pas la même racine du système de fichiers |
| `proxy.upstream-host` | `127.0.0.1` | Remplace l'hôte utilisé par le proxy pour renvoyer le trafic vers l'application NocoBase |
| `proxy.nginx-driver` | `local` | Driver de runtime par défaut utilisé par `nb proxy nginx` |
| `proxy.caddy-driver` | `local` | Driver de runtime par défaut utilisé par `nb proxy caddy` |

## Utilisation

```bash
nb config <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb config get`](./get.md) | Lire la valeur effective d'une clé de configuration |
| [`nb config set`](./set.md) | Définir une clé de configuration |
| [`nb config delete`](./delete.md) | Supprimer une clé de configuration explicitement définie |
| [`nb config list`](./list.md) | Lister les clés de configuration explicitement définies actuellement |

## Exemples

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.nb-cli-root
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Notes

- `bin.nginx` et `bin.caddy` n'affectent que le driver `local` de `nb proxy nginx` et `nb proxy caddy`
- `proxy.nginx-driver` et `proxy.caddy-driver` stockent le driver par défaut utilisé par chaque provider
- `proxy.nb-cli-root` et `proxy.upstream-host` sont des surcharges proxy avancées. Pour la plupart des environnements `local` ou `docker` gérés par la CLI, les valeurs par défaut suffisent
- Si tu veux simplement changer le driver proxy actif, `nb proxy nginx use` ou `nb proxy caddy use` est généralement plus clair que de modifier la clé de configuration manuellement

## Commandes associées

- [`nb init`](../init.md)
- [`nb proxy`](../proxy/index.md)
- [`nb license`](../license/index.md)
