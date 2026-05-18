---
title: "nb env remove"
description: "Référence de la commande nb env remove : supprimer la configuration d'un env NocoBase CLI."
keywords: "nb env remove,NocoBase CLI,supprimer un environnement,supprimer la configuration"
---

# nb env remove

Supprime un env configuré. Cette commande supprime uniquement la configuration env CLI enregistrée et ne nettoie pas les répertoires d’application locaux, les conteneurs ni les données de storage ; utilisez [`nb app down`](../app/down.md) si vous devez nettoyer les ressources d’exécution locales.

Si l’env supprimé est aussi l’env courant, le CLI sélectionne automatiquement un nouvel env courant parmi les env restants. S’il n’en reste aucun, l’env courant est effacé.

Par défaut, la commande demande une confirmation. Pour l’ignorer, passez `--yes`. En mode non interactif, `--yes` est obligatoire avant de pouvoir supprimer l’env.

## Utilisation

```bash
nb env remove <name> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<name>` | string | Nom de l'environnement configuré à supprimer |
| `--yes`, `-y` | boolean | Ignorer la confirmation et supprimer la configuration env CLI enregistrée |
| `--verbose` | boolean | Afficher la progression détaillée |

## Exemples

```bash
nb env remove staging
nb env remove staging --yes
```

## Commandes connexes

- [`nb app down`](../app/down.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
