---
title: "nb proxy nginx start"
description: "Référence de la commande nb proxy nginx start : démarrer le proxy Nginx avec le driver actuel."
keywords: "nb proxy nginx start,NocoBase CLI,nginx,démarrage"
---

# nb proxy nginx start

Démarre le proxy Nginx avec le driver actuel.

## Utilisation

```bash
nb proxy nginx start
```

## Exemples

```bash
nb proxy nginx start
```

## Remarques

- Avec le driver `local`, la commande démarre le processus Nginx local
- Avec le driver `docker`, elle démarre ou crée le conteneur Docker
- Si le proxy est déjà en cours d'exécution, la commande l'indique

## Commandes associées

- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx status`](./status.md)
