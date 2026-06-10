---
title: "Reverse proxy en production"
description: "Utilisez nb proxy nginx et nb proxy caddy pour générer et gérer la configuration de reverse proxy des env NocoBase gérés par la CLI."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,reverse proxy,Nginx,Caddy,production"
---

# Reverse proxy en production

Dans la NocoBase CLI, les points d'entrée recommandés pour le reverse proxy en production sont :

- `nb proxy nginx`
- `nb proxy caddy`

Où :

- `proxy` gère la couche d'entrée
- `nginx` et `caddy` sont les implémentations de provider
- `docker` et `local` sont les drivers d'exécution
- `--env <name>` sélectionne l'env CLI pour lequel générer la configuration

Tant que votre application a été enregistrée comme env géré par la CLI et que cet env est de type `local` ou `docker`, laisser la CLI générer et gérer la configuration de reverse proxy suffit généralement. Cette approche garde au même endroit la gestion de WebSocket, des sous-chemins, des pages de repli SPA et des mises à jour ultérieures.

Si l'application n'est pas gérée par la CLI, ou si vous souhaitez volontairement maintenir toute la configuration de proxy à la main, passez directement aux sections de configuration manuelle sur les pages de chaque provider.

## Avant de commencer

Assurez-vous que :

- l'application est déjà accessible en interne, par exemple via `http://127.0.0.1:13000`
- l'application a déjà été enregistrée comme env CLI, et que cet env est `local` ou `docker`
- l'env a déjà `appPort` enregistré

Si la commande indique que l'env ne contient pas `appPort`, mettez-le d'abord à jour avec [`nb env update`](../../../api/cli/env/update.md).

Si vous modifiez plus tard des réglages comme `app-port` ou `app-public-path` qui influencent le comportement du proxy, relancez la commande `generate` correspondante.

## Flux par défaut

Pour Nginx :

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Pour Caddy :

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Le rôle de chaque étape est le suivant :

- `use docker|local` : choisir le driver d'exécution du provider courant
- `generate --env <name> --host <domain>` : générer la configuration de reverse proxy pour un env
- `start` : démarrer le processus local ou le conteneur Docker du provider courant

Si vous mettez la configuration à jour ensuite, `reload` est généralement le premier choix. Utilisez `restart` quand vous avez besoin d'un redémarrage complet de la couche d'entrée.

## Comment se répartit le groupe de commandes

En prenant Nginx comme exemple :

| Commande | Rôle |
| --- | --- |
| `nb proxy nginx use docker` | Basculer l'exécution de Nginx vers Docker |
| `nb proxy nginx use local` | Basculer l'exécution de Nginx vers un processus local |
| `nb proxy nginx current` | Afficher le driver d'exécution actuel |
| `nb proxy nginx generate --env <name> --host <domain>` | Générer la configuration Nginx pour un env |
| `nb proxy nginx start` | Démarrer Nginx |
| `nb proxy nginx reload` | Recharger la configuration Nginx |
| `nb proxy nginx restart` | Redémarrer Nginx |
| `nb proxy nginx stop` | Arrêter Nginx |
| `nb proxy nginx status` | Afficher l'état de Nginx |
| `nb proxy nginx info` | Afficher la configuration actuelle, les chemins et les détails d'exécution |

Caddy reprend le même ensemble d'actions, avec un provider différent.

## Ce que la CLI maintient

La CLI ne se contente pas de produire un simple fragment de proxy. Elle maintient aussi les fichiers d'assistance et la structure d'entrée du site en cohérence avec le provider :

- Nginx maintient les `snippets` partagés, `app.conf`, `public/index-v1.html` et `public/index-v2.html`
- Caddy maintient `nocobase.caddy`, `app.caddy`, `public/index-v1.html` et `public/index-v2.html`, où `app.caddy` correspond à la configuration complète du site pour un env

:::warning Note

Si vous devez ajouter une configuration au niveau du site, vous modifierez généralement `app.conf` pour Nginx et utiliserez `app.caddy` comme base pour Caddy. Ne modifiez pas directement les fichiers d'assistance gérés par la CLI. Notez aussi que `app.caddy` est entièrement écrasé quand vous relancez `generate`, tandis que `nocobase.caddy` sert surtout de fichier d'entrée au niveau du provider.

:::

## Quelle page ouvrir en premier

| Je veux... | Aller ici |
| --- | --- |
| Continuer à utiliser Nginx pour les sites, certificats, caches ou contrôles d'accès | [Nginx](./nginx.md) |
| Mettre HTTPS en place rapidement avec moins de détails TLS à gérer | [Caddy](./caddy.md) |
| Ajuster des réglages d'env qui peuvent influencer le proxy, comme `app-port` ou `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Installer d'abord l'application comme env géré par la CLI | [Installer avec la CLI](../../installation/cli.md) |

## Quand ce chemin CLI n'est pas le bon

Dans les cas suivants, les sections de configuration manuelle sur les pages de provider sont généralement plus adaptées :

- l'application n'est pas gérée par la CLI
- l'env n'est qu'une connexion API distante ou un env SSH
- vous souhaitez volontairement gérer vous-même toute la configuration Nginx ou le `Caddyfile`

Tant que l'application est enregistrée comme env CLI et que son exécution est accessible depuis la machine courante, ce groupe de commandes reste le choix recommandé par défaut. Il est ensuite généralement bien plus simple à maintenir quand vous devez changer de domaine, ajouter une configuration au niveau du site, changer de driver ou régénérer les fichiers d'entrée.

## Liens associés

- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [Variables d'environnement](../../installation/env.md)
- [Installer avec la CLI](../../installation/cli.md)
