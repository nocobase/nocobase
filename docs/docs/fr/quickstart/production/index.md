---
title: "Déploiement en production"
description: "Déployez NocoBase en production en deux étapes finales : activer le démarrage automatique de l’application et configurer un proxy inverse."
keywords: "NocoBase,déploiement en production,nb app autostart,nb env proxy,Nginx,Caddy"
---

# Déploiement en production

Si votre application NocoBase fonctionne déjà correctement sur le serveur, la mise en production ne nécessite généralement plus que deux étapes :

1. S’assurer que l’application redémarre automatiquement après le redémarrage de la machine
2. Placer un proxy inverse devant l’application pour fournir un accès externe stable

Dans la CLI NocoBase, les principales commandes sont :

- `nb app autostart`
- `nb env proxy`

Cette page présente d’abord le parcours global. Pour les détails de configuration avec Nginx ou Caddy, poursuivez avec leurs sous-pages respectives.

## Étape 1 : activer le démarrage automatique de l’application

En production, la première priorité n’est pas le nom de domaine, mais la capacité du service à se rétablir de manière fiable après un redémarrage, une recréation de conteneur ou une opération de maintenance.

Dans la CLI, `nb app autostart` est un groupe de commandes. Les plus utilisées sont :

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Activez le démarrage automatique pour l’env courant :

```bash
nb app autostart enable
```

Si vous souhaitez cibler explicitement un autre env :

```bash
nb app autostart enable --env app1 --yes
```

Ensuite, vérifiez quels envs sont marqués pour le démarrage automatique :

```bash
nb app autostart list
```

Après le démarrage du système, utilisez la commande suivante pour lancer tous les envs marqués comme démarrage automatique :

```bash
nb app autostart run
```

Si vous souhaitez afficher la sortie de démarrage sous-jacente pour le dépannage :

```bash
nb app autostart run --verbose
```

:::tip Ce que cela fait réellement

`nb app autostart enable` marque un env géré par la CLI comme autorisé à démarrer automatiquement.  
`nb app autostart run` est la commande qui démarre effectivement tous les envs marqués pour le démarrage automatique.

Autrement dit, dans un environnement de production réel, vous devez généralement intégrer `nb app autostart run` à votre propre processus de démarrage système, par exemple avec `systemd`, un script de démarrage de votre plateforme de conteneurs ou un autre mécanisme d’amorçage hôte déjà en place.

:::

### Portée

`nb app autostart` s’applique uniquement aux envs disposant d’un runtime géré par la CLI sur la machine actuelle :

- `local`
- `docker`

Si l’env n’est qu’une connexion API distante, ou si l’application n’est pas gérée localement par la CLI sur cette machine, ces commandes ne sont pas adaptées au démarrage automatique.

## Étape 2 : configurer un proxy inverse

Une fois que l’application peut redémarrer automatiquement, l’étape suivante consiste à gérer le point d’entrée externe. En production, le proxy inverse se charge généralement de :

- l’association du nom de domaine ou du port public
- la redirection du trafic HTTP et WebSocket vers NocoBase
- la gestion de HTTPS, des certificats, du cache ou du contrôle d’accès

Dans la CLI NocoBase, les points d’entrée recommandés sont :

- `nb env proxy nginx`
- `nb env proxy caddy`

### Approche par défaut

Si votre application est déjà enregistrée comme env CLI et qu’il s’agit d’un env `local` ou `docker`, laisser la CLI générer la configuration du proxy suffit généralement :

```bash
nb env proxy nginx --env app1 --host app.example.com
nb env proxy caddy --env app1 --host app.example.com
```

Si l’env courant est déjà l’env cible, vous pouvez omettre `--env` :

```bash
nb env proxy nginx --host app.example.com
```

La CLI aide à couvrir des détails faciles à oublier dans une configuration écrite à la main, par exemple :

- le transfert WebSocket
- les chemins d’entrée et des ressources statiques dans les déploiements en sous-chemin
- les pages de repli SPA
- les fichiers de configuration partagés du provider

### Quand choisir Nginx ou Caddy

Vous pouvez généralement décider ainsi :

| Scénario | Recommandé |
| --- | --- |
| Vous utilisez déjà Nginx pour les sites, le cache, les certificats ou le contrôle d’accès | [Nginx](./reverse-proxy/nginx.md) |
| Vous avez déjà un domaine et souhaitez mettre en place HTTPS rapidement avec moins de maintenance TLS | [Caddy](./reverse-proxy/caddy.md) |
| Vous voulez d’abord voir l’explication globale de ce groupe de commandes | [Production Reverse Proxy](./reverse-proxy/index.md) |

Si vous modifiez des paramètres d’env qui influencent le résultat du proxy, comme `app-port` ou `app-public-path`, pensez à relancer le sous-commande de proxy correspondant.

## Chemin recommandé pour la mise en production

Si vous souhaitez la voie la plus simple vers la production, cet ordre fonctionne généralement bien :

1. Vérifier que l’application peut déjà démarrer correctement sur le serveur lui-même
2. Exécuter `nb app autostart enable`
3. Ajouter `nb app autostart run` au processus de démarrage système
4. Choisir Nginx ou Caddy et exécuter le sous-commande `nb env proxy` correspondant
5. Vérifier l’accès externe via le domaine final ou l’adresse publique

## Liens rapides

| Je veux... | Lire ceci |
| --- | --- |
| Commencer par l’explication globale du proxy inverse | [Production Reverse Proxy](./reverse-proxy/index.md) |
| Continuer à utiliser Nginx pour la couche d’entrée | [Nginx](./reverse-proxy/nginx.md) |
| Utiliser Caddy pour une mise en place HTTPS plus rapide | [Caddy](./reverse-proxy/caddy.md) |
| Gérer le démarrage, l’arrêt, les logs et les mises à niveau | [Manage Apps](../operations/manage-app.md) |
| Lire la référence CLI de `nb env proxy` | [`nb env proxy`](../../api/cli/env/proxy/index.md) |

## Commandes associées

```bash
# Activer le démarrage automatique pour un env
nb app autostart enable --env app1 --yes

# Lister l’état du démarrage automatique
nb app autostart list

# Démarrer tous les envs avec démarrage automatique activé
nb app autostart run

# Générer la configuration de proxy inverse Nginx
nb env proxy nginx --env app1 --host app.example.com

# Générer la configuration de proxy inverse Caddy
nb env proxy caddy --env app1 --host app.example.com
```
