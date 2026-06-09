---
title: "nb proxy nginx restart"
description: "Référence de la commande nb proxy nginx restart : redémarrer le proxy Nginx avec le driver actuel."
keywords: "nb proxy nginx restart,NocoBase CLI,nginx,redémarrage"
---

# nb proxy nginx restart

Redémarre le proxy Nginx avec le driver actuel.

## Utilisation

```bash
nb proxy nginx restart
```

## Exemples

```bash
nb proxy nginx restart
```

## Remarques

- Cette commande arrête d'abord le proxy, puis le redémarre
- Avec `local` ou `docker`, elle agit sur le processus local ou le conteneur Docker correspondant au driver actuel

## Commandes associées

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx reload`](./reload.md)
