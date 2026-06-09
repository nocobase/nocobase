---
title: "Déploiement en production"
description: "Finaliser rapidement un déploiement NocoBase en production : configurer d'abord l'auto-démarrage de l'application, puis le reverse proxy."
keywords: "NocoBase,déploiement en production,nb app autostart,nb proxy nginx,nb proxy caddy,Nginx,Caddy"
---

# Déploiement en production

Si ton application NocoBase fonctionne déjà normalement sur le serveur, un passage en production ne nécessite généralement plus que deux choses :

1. s'assurer que l'application peut redémarrer automatiquement après un redémarrage de la machine
2. ajouter un point d'entrée reverse proxy afin qu'elle soit accessible de manière fiable depuis l'extérieur

Dans NocoBase CLI, les principaux groupes de commandes concernés sont :

- `nb app autostart`
- `nb proxy`

Cette page explique d'abord le chemin global. Pour les détails propres à Nginx ou Caddy, poursuis vers les pages dédiées à chaque provider.

## Étape 1 : configurer l'auto-démarrage de l'application

En production, la priorité n'est pas d'abord le nom de domaine. Il faut d'abord s'assurer que le service lui-même peut se rétablir de manière fiable. Sinon, après un redémarrage de la machine, une recréation de conteneur ou une opération de maintenance, l'application risque de ne pas revenir automatiquement.

Les sous-commandes `nb app autostart` les plus courantes sont :

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Activer l'auto-démarrage pour l'env courant :

```bash
nb app autostart enable
```

Si la cible n'est pas l'env courant, indique-la explicitement :

```bash
nb app autostart enable --env app1 --yes
```

Vérifier quels envs sont marqués pour l'auto-démarrage :

```bash
nb app autostart list
```

Après le démarrage du système, lancer tous les envs activés :

```bash
nb app autostart run
```

Si tu veux une sortie de démarrage détaillée pendant le débogage :

```bash
nb app autostart run --verbose
```

:::tip Ce que fait réellement cette étape

`nb app autostart enable` marque un env géré par la CLI comme autorisé à démarrer automatiquement. `nb app autostart run` démarre ensuite réellement tous les envs pour lesquels l'auto-démarrage est activé.

En production, tu dois généralement quand même intégrer `nb app autostart run` dans ton propre flux de démarrage système, par exemple via `systemd`, un script de démarrage sur une plateforme de conteneurs, ou tout autre mécanisme de démarrage automatique au niveau de l'hôte que tu utilises déjà.

:::

### Applicabilité

`nb app autostart` ne fonctionne que pour les envs ayant une runtime gérée par la CLI :

- `local`
- `docker`

Si un env n'est qu'une connexion API distante, ou si l'application n'est pas gérée localement par la CLI sur la machine courante, ce groupe de commandes n'est pas la bonne façon de gérer l'auto-démarrage.

## Étape 2 : configurer le reverse proxy

Une fois que l'application peut se rétablir automatiquement, il faut traiter le point d'entrée externe. En production, le reverse proxy prend généralement en charge :

- l'attachement du nom de domaine ou du port d'entrée
- le transfert des requêtes HTTP et WebSocket vers NocoBase
- la gestion de HTTPS, des certificats, du cache ou du contrôle d'accès

Les points d'entrée CLI recommandés sont :

- `nb proxy nginx`
- `nb proxy caddy`

### Flux par défaut

Si l'application a déjà été enregistrée comme env CLI et que cet env est `local` ou `docker`, le chemin le plus courant est de laisser la CLI générer directement la configuration :

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com

nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
```

Ensuite, démarre le provider choisi :

```bash
nb proxy nginx start
nb proxy caddy start
```

La CLI aide aussi sur des détails faciles à oublier dans une configuration écrite à la main, comme :

- le transfert WebSocket
- les URL d'entrée et de ressources sous des sous-chemins
- les pages de fallback SPA
- les fichiers de configuration partagés au niveau du provider

### Quand choisir Nginx ou Caddy

| Scénario | Recommandation |
| --- | --- |
| Tu utilises déjà Nginx pour gérer des sites, du cache, des certificats ou le contrôle d'accès | [Nginx](./reverse-proxy/nginx.md) |
| Tu as déjà un nom de domaine et tu veux mettre HTTPS en service rapidement avec moins de détails TLS à maintenir | [Caddy](./reverse-proxy/caddy.md) |
| Tu veux d'abord lire l'introduction générale | [Reverse Proxy en production](./reverse-proxy/index.md) |

Si tu modifies ensuite des paramètres d'env comme `app-port` ou `app-public-path` qui affectent le comportement du proxy, réexécute la sous-commande proxy correspondante.

## Chemin de déploiement par défaut

Pour le déploiement en production le plus simple, cette séquence suffit généralement :

1. confirmer que l'application peut déjà démarrer normalement sur le serveur lui-même
2. exécuter `nb app autostart enable`
3. relier `nb app autostart run` à ton flux de démarrage système
4. choisir Nginx ou Caddy et exécuter la sous-commande `nb proxy` correspondante
5. vérifier l'accès externe via le nom de domaine ou l'adresse d'entrée

## Index rapide

| Je veux... | Aller ici |
| --- | --- |
| Lire d'abord l'introduction générale au reverse proxy | [Reverse Proxy en production](./reverse-proxy/index.md) |
| Continuer à utiliser Nginx sur la couche d'entrée | [Nginx](./reverse-proxy/nginx.md) |
| Utiliser Caddy pour obtenir HTTPS plus rapidement | [Caddy](./reverse-proxy/caddy.md) |
| Voir les opérations de démarrage, d'arrêt, de logs et de mise à niveau de l'application | [Gérer l'application](../operations/manage-app.md) |
| Lire la référence CLI de `nb proxy nginx` | [`nb proxy nginx`](../../api/cli/proxy/nginx/index.md) |
| Lire la référence CLI de `nb proxy caddy` | [`nb proxy caddy`](../../api/cli/proxy/caddy/index.md) |

## Commandes associées

```bash
# Activer l'auto-démarrage pour un env
nb app autostart enable --env app1 --yes

# Vérifier l'état de l'auto-démarrage
nb app autostart list

# Démarrer tous les envs activés
nb app autostart run

# Choisir la runtime Nginx et générer la configuration
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com
nb proxy nginx start

# Choisir la runtime Caddy et générer la configuration
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
nb proxy caddy start
```
