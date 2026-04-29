---
title: "nb env remove"
description: "Référence de la commande nb env remove : supprimer la configuration d'un env NocoBase CLI."
keywords: "nb env remove,NocoBase CLI,supprimer un environnement,supprimer la configuration"
---

# nb env remove

Supprimer un env configuré. Cette commande supprime uniquement la configuration de l'env CLI ; pour nettoyer l'application locale, les conteneurs et le storage, utilisez [`nb app down`](../app/down.md).

## Utilisation

```bash
nb env remove <name> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<name>` | string | Nom de l'environnement à supprimer |
| `--force`, `-f` | boolean | Supprimer directement sans confirmation |
| `--verbose` | boolean | Afficher la progression détaillée |

## Exemples

```bash
nb env remove staging
nb env remove staging -f
```

## Commandes connexes

- [`nb app down`](../app/down.md)
- [`nb env list`](./list.md)
