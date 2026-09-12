---
title: "nb proxy nginx"
description: "Référence du groupe de commandes nb proxy nginx : gérer le driver du provider Nginx, la génération de configuration et le contrôle d'exécution."
keywords: "nb proxy nginx,NocoBase CLI,nginx,reverse proxy,configuration proxy"
---

# nb proxy nginx

`nb proxy nginx` est le point d'entrée du groupe de commandes pour le provider Nginx.

Si vous utilisez déjà Nginx pour gérer des sites, des certificats, le cache ou le contrôle d'accès, c'est généralement le bon point de départ. Ce groupe prend en charge deux aspects :

- choisir le mode d'exécution de Nginx, c'est-à-dire `local` ou `docker`
- générer, démarrer, recharger et inspecter l'entrée Nginx des env gérés par la CLI

## Utilisation

```bash
nb proxy nginx <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | Changer le driver Nginx |
| [`nb proxy nginx current`](./current.md) | Afficher le driver actuel |
| [`nb proxy nginx generate`](./generate.md) | Générer ou actualiser la configuration Nginx pour un env |
| [`nb proxy nginx start`](./start.md) | Démarrer le proxy Nginx |
| [`nb proxy nginx restart`](./restart.md) | Redémarrer le proxy Nginx |
| [`nb proxy nginx reload`](./reload.md) | Recharger la configuration Nginx |
| [`nb proxy nginx stop`](./stop.md) | Arrêter le proxy Nginx |
| [`nb proxy nginx status`](./status.md) | Afficher l'état d'exécution de Nginx |
| [`nb proxy nginx info`](./info.md) | Afficher le driver, les chemins de configuration et les informations d'exécution |

## Remarques

- Le driver actuel est enregistré dans `proxy.nginx-driver`
- Le driver par défaut est `local`
- Le driver local utilise l'exécutable indiqué par `bin.nginx`, dont la valeur par défaut est `nginx`
- Le driver Docker utilise `nginx:latest`
- Le nom du conteneur Docker par défaut est `<docker.container-prefix>-nginx-proxy`
- Le driver Docker monte le `NB_CLI_ROOT` de l'hôte dans le conteneur sous `/apps`

## Flux courant

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app1.example.com
nb proxy nginx start
nb proxy nginx status
nb proxy nginx info
```

## Commandes associées

- [`nb proxy`](../index.md)
- [`nb proxy caddy`](../caddy/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
