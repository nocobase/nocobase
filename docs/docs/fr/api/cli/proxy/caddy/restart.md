---
title: "nb proxy caddy restart"
description: "Référence de la commande nb proxy caddy restart : redémarrer le proxy Caddy avec le driver actuel."
keywords: "nb proxy caddy restart,NocoBase CLI,caddy,redémarrage"
---

# nb proxy caddy restart

Redémarre le proxy Caddy avec le driver actuel.

## Utilisation

```bash
nb proxy caddy restart
```

## Exemples

```bash
nb proxy caddy restart
```

## Remarques

- Cette commande arrête d'abord le proxy, puis le redémarre
- Avec `local` ou `docker`, elle agit sur le processus local ou le conteneur Docker correspondant au driver actuel

## Commandes associées

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy reload`](./reload.md)
