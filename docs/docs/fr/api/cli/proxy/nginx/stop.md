---
title: "nb proxy nginx stop"
description: "Référence de la commande nb proxy nginx stop : arrêter le proxy Nginx avec le driver actuel."
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,arrêt"
---

# nb proxy nginx stop

Arrête le proxy Nginx avec le driver actuel.

## Utilisation

```bash
nb proxy nginx stop
```

## Exemples

```bash
nb proxy nginx stop
```

## Remarques

- Avec le driver `local`, cette commande arrête le processus Nginx local
- Avec le driver `docker`, elle arrête le conteneur proxy
- Si le proxy est déjà arrêté, la commande l'indique

## Commandes associées

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
