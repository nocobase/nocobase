---
title: "nb proxy nginx reload"
description: "Référence de la commande nb proxy nginx reload : recharger la configuration Nginx avec le driver actuel."
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,rechargement"
---

# nb proxy nginx reload

Recharge la configuration Nginx avec le driver actuel.

## Utilisation

```bash
nb proxy nginx reload
```

## Exemples

```bash
nb proxy nginx reload
```

## Remarques

- Cette commande s'utilise généralement après avoir régénéré la configuration
- `reload` exige que Nginx soit déjà en cours d'exécution ; s'il n'est pas encore lancé, utilisez d'abord `nb proxy nginx start`
- Le driver local recharge Nginx localement, et le driver Docker recharge Nginx à l'intérieur du conteneur

## Commandes associées

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
