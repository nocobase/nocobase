---
title: "nb proxy caddy"
description: "Référence du groupe de commandes nb proxy caddy : gérer le driver du provider Caddy, la génération de configuration et le contrôle d'exécution."
keywords: "nb proxy caddy,NocoBase CLI,caddy,reverse proxy,configuration proxy"
---

# nb proxy caddy

`nb proxy caddy` est le point d'entrée du groupe de commandes pour le provider Caddy.

Si vous avez déjà un nom de domaine, que vous voulez activer HTTPS rapidement et que vous ne souhaitez pas gérer vous-même trop de détails TLS, c'est généralement le bon point de départ. Ce groupe prend en charge deux aspects :

- choisir le mode d'exécution de Caddy, c'est-à-dire `local` ou `docker`
- générer, démarrer, recharger et inspecter l'entrée Caddy des env gérés par la CLI

## Utilisation

```bash
nb proxy caddy <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | Changer le driver Caddy |
| [`nb proxy caddy current`](./current.md) | Afficher le driver actuel |
| [`nb proxy caddy generate`](./generate.md) | Générer ou actualiser la configuration Caddy pour un env |
| [`nb proxy caddy start`](./start.md) | Démarrer le proxy Caddy |
| [`nb proxy caddy restart`](./restart.md) | Redémarrer le proxy Caddy |
| [`nb proxy caddy reload`](./reload.md) | Recharger la configuration Caddy |
| [`nb proxy caddy stop`](./stop.md) | Arrêter le proxy Caddy |
| [`nb proxy caddy status`](./status.md) | Afficher l'état d'exécution de Caddy |
| [`nb proxy caddy info`](./info.md) | Afficher le driver, les chemins de configuration et les informations d'exécution |

## Remarques

- Le driver actuel est enregistré dans `proxy.caddy-driver`
- Le driver par défaut est `local`
- Le driver local utilise l'exécutable indiqué par `bin.caddy`, dont la valeur par défaut est `caddy`
- Le driver Docker utilise `caddy:latest`
- Le nom du conteneur Docker par défaut est `<docker.container-prefix>-caddy-proxy`
- Le driver Docker monte le `NB_CLI_ROOT` de l'hôte dans le conteneur sous `/apps`

## Flux courant

```bash
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app1.example.com
nb proxy caddy start
nb proxy caddy status
nb proxy caddy info
```

## Commandes associées

- [`nb proxy`](../index.md)
- [`nb proxy nginx`](../nginx/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
