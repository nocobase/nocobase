---
title: "nb license"
description: "Référence de la commande nb license : gérer les licences commerciales et les plugins sous licence de NocoBase."
keywords: "nb license,NocoBase CLI,commercial licensing"
---

# nb license

Gère la licence commerciale NocoBase, y compris l'activation avec une license key existante, les Instance ID, l'état de la licence et les plugins sous licence.

## Utilisation

```bash
nb license <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb license activate`](./activate.md) | Activer la licence commerciale de l'env courant avec une license key existante |
| [`nb license id`](./id.md) | Afficher ou générer l'ID d'instance pour l'env courant |
| [`nb license status`](./status.md) | Afficher l'état de la licence commerciale pour l'env courant |
| [`nb license plugins`](./plugins/index.md) | Gérer les plugins commerciaux autorisés par la licence actuelle |

## Exemples

```bash
nb license id --env app1
nb license activate --env app1 --key-file ./license.txt
nb license status --env app1
nb license plugins list --env app1
nb license plugins sync --env app1
```

## Commandes connexes

- [`nb config`](../config/index.md)
- [`nb plugin`](../plugin/index.md)
- [`nb db check`](../db/check.md)
