---
title: "nb env remove"
description: "Référence de la commande nb env remove : arrêter le runtime géré avant de supprimer la configuration de l'env, ou nettoyer les ressources locales du CLI si nécessaire."
keywords: "nb env remove,NocoBase CLI,supprimer un environnement,supprimer la configuration,purge"
---

# nb env remove

Supprime un env configuré. Pour les env locaux et Docker, cette commande arrête d’abord sur cette machine le runtime applicatif et le runtime de base de données intégrée gérés par le CLI, puis supprime la configuration env enregistrée. Pour les env HTTP et SSH, elle supprime uniquement la configuration env enregistrée.

Si l’env supprimé est aussi l’env courant, le CLI sélectionne automatiquement un nouvel env courant parmi les env restants. S’il n’en reste aucun, l’env courant est effacé.

Par défaut, la commande demande une confirmation. En mode non interactif, `--force` est obligatoire avant l’exécution.

Passez `--purge` pour nettoyer également les ressources gérées par le CLI sur cette machine. Pour les env locaux et Docker, `--purge` applique le même nettoyage que [`nb app destroy`](../app/destroy.md). Pour les env HTTP et SSH, `--purge` ne touche aucun service externe et supprime uniquement la configuration env enregistrée.

## Utilisation

```bash
nb env remove <name> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<name>` | string | Nom de l'environnement configuré à supprimer |
| `--force`, `-f` | boolean | Ignorer la confirmation pour le mode de suppression sélectionné ; obligatoire en mode non interactif |
| `--purge` | boolean | Supprime aussi les ressources locales gérées par le CLI, les données de storage et, si nécessaire, les fichiers locaux d’application téléchargés. Pour les env d’API distants, seule la configuration env enregistrée est supprimée |
| `--verbose` | boolean | Afficher la progression détaillée |

## Exemples

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Commandes connexes

- [`nb app stop`](../app/stop.md)
- [`nb app destroy`](../app/destroy.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
