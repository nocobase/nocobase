---
title: "nb proxy caddy reload"
description: "Référence de la commande nb proxy caddy reload : recharger la configuration Caddy avec le driver actuel."
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,rechargement"
---

# nb proxy caddy reload

Recharge la configuration Caddy avec le driver actuel.

## Utilisation

```bash
nb proxy caddy reload
```

## Exemples

```bash
nb proxy caddy reload
```

## Remarques

- Cette commande s'utilise généralement après avoir régénéré la configuration
- `reload` exige que Caddy soit déjà en cours d'exécution ; s'il n'est pas encore lancé, utilisez d'abord `nb proxy caddy start`
- Le driver local recharge Caddy localement, et le driver Docker recharge Caddy à l'intérieur du conteneur

## Commandes associées

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
