---
title: "nb proxy caddy stop"
description: "Référence de la commande nb proxy caddy stop : arrêter le proxy Caddy avec le driver actuel."
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,arrêt"
---

# nb proxy caddy stop

Arrête le proxy Caddy avec le driver actuel.

## Utilisation

```bash
nb proxy caddy stop
```

## Exemples

```bash
nb proxy caddy stop
```

## Remarques

- Avec le driver `local`, cette commande arrête le processus Caddy local
- Avec le driver `docker`, elle arrête le conteneur proxy
- Si le proxy est déjà arrêté, la commande l'indique

## Commandes associées

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
