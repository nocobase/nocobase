---
title: "nb proxy caddy start"
description: "Référence de la commande nb proxy caddy start : démarrer le proxy Caddy avec le driver actuel."
keywords: "nb proxy caddy start,NocoBase CLI,caddy,démarrage"
---

# nb proxy caddy start

Démarre le proxy Caddy avec le driver actuel.

## Utilisation

```bash
nb proxy caddy start
```

## Exemples

```bash
nb proxy caddy start
```

## Remarques

- Avec le driver `local`, la commande démarre le processus Caddy local
- Avec le driver `docker`, elle démarre ou crée le conteneur Docker
- Si le proxy est déjà en cours d'exécution, la commande l'indique

## Commandes associées

- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy status`](./status.md)
