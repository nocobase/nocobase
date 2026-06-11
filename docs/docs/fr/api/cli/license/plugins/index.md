---
title: "nb license plugins"
description: "Référence de la commande nb license plugins : consulter ou synchroniser les plugins commerciaux autorisés par la licence actuelle."
keywords: "nb license plugins,NocoBase CLI,commercial plugins"
---

# nb license plugins

Consulte ou synchronise les plugins commerciaux autorisés par la licence actuelle.

## Utilisation

```bash
nb license plugins <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb license plugins list`](./list.md) | Afficher les plugins commerciaux associés à la licence actuelle |
| [`nb license plugins sync`](./sync.md) | Synchroniser les plugins commerciaux autorisés par la licence actuelle |
| [`nb license plugins clean`](./clean.md) | Supprimer les plugins commerciaux téléchargés pour l'env courant |

## Exemples

```bash
nb license plugins list --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins clean --env app1 --verbose
```

## Commandes connexes

- [`nb license activate`](../activate.md)
- [`nb plugin list`](../../plugin/list.md)
