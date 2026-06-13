---
title: 'nb env remove'
description: "Référence de la commande nb env remove : arrête les runtimes gérés avant de supprimer la configuration de l'env, ou nettoie complètement les ressources locales gérées si nécessaire."
keywords: "nb env remove,NocoBase CLI,supprimer l'environnement,supprimer la configuration,purge"
---

# nb env remove

Supprime un env configuré. Pour les env local/docker, cette commande arrête d'abord le runtime d'application et le runtime de base de données intégrée gérés par la CLI sur la machine actuelle, puis supprime la configuration d'env CLI enregistrée. Pour les env http/ssh, cette commande supprime uniquement la configuration d'env CLI enregistrée.

Si l'env supprimé est l'env actuel, la CLI sélectionne automatiquement un nouvel env actuel parmi les env restants ; s'il n'y a plus d'env disponible, l'env actuel est vidé.

Par défaut, la commande demande une confirmation. En mode non interactif, vous devez explicitement passer `--force` pour l'exécuter.

Si vous devez nettoyer autant que possible les ressources gérées par la CLI sur la machine actuelle, vous pouvez passer `--purge`. Pour les env local/docker, `--purge` nettoie également les ressources d'exécution gérées, les données de storage et, le cas échéant, les fichiers de l'app locale téléchargés ; pour les env http/ssh, `--purge` ne touche pas aux services externes et supprime uniquement la configuration d'env CLI enregistrée.

## Utilisation

```bash
nb env remove <name> [flags]
```

## Paramètres

| Paramètre       | Type    | Description                                                                                                                                                                                                                                         |
| --------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<name>`        | string  | Nom de l'environnement configuré à supprimer                                                                                                                                                                                                        |
| `--force`, `-f` | boolean | Ignore la confirmation dans le mode remove actuel ; requis en mode non interactif                                                                                                                                                                   |
| `--purge`       | boolean | Nettoie en plus les ressources gérées par la CLI, les données de storage et, le cas échéant, les fichiers de l'app locale téléchargés sur la machine actuelle ; pour les env d'API distante, seule la configuration d'env enregistrée est supprimée |
| `--verbose`     | boolean | Affiche la progression détaillée                                                                                                                                                                                                                    |

## Exemples

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Commandes associées

- [`nb app stop`](../app/stop.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
