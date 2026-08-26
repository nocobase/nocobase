---
title: 'nb backup restore'
description: "Référence de la commande nb backup restore : restaure un fichier de sauvegarde local vers l'env cible."
keywords: 'nb backup restore,NocoBase CLI,restaurer une sauvegarde,restaurer,nbdata'
---

# nb backup restore

Restaure un fichier de sauvegarde local vers l'env cible. En général, on utilise ici un fichier `*.nbdata`. La restauration écrase les données de l'application cible, donc la CLI demande une confirmation supplémentaire par défaut.

## Utilisation

```bash
nb backup restore --file <path> [flags]
```

## Paramètres

| Paramètre      | Type    | Description                                                                                                                                       |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`  | string  | Nom de l'env CLI vers lequel restaurer ; utilise l'env actuel si omis                                                                             |
| `--yes`, `-y`  | boolean | Ignore la confirmation interactive lorsque l'env explicitement indiqué par `--env` est différent de l'env actuel                                  |
| `--file`, `-f` | string  | Chemin du fichier de sauvegarde local ; obligatoire                                                                                               |
| `--force`      | boolean | Confirme l'écrasement des données de l'application ; doit être fourni explicitement dans les terminaux non interactifs et les sessions d'AI agent |

## Exemples

```bash
nb backup restore --file ./backups/base.nbdata --force
nb backup restore --env e2e --file ./backups/base.nbdata --yes --force
```

## Remarques

La CLI ne vérifie si `--env` correspond à l'env actuel que lorsque vous fournissez explicitement `--env`. Si un env différent est explicitement indiqué, un terminal interactif demandera d'abord une confirmation ; dans les terminaux non interactifs ou les scénarios d'AI agent, vous devez ajouter vous-même `--yes` explicitement, ou exécuter d'abord `nb env use <name>` puis réessayer.

Avant l'exécution, la CLI vérifie d'abord si le chemin indiqué par `--file` existe et confirme qu'il s'agit d'un fichier ordinaire. Si le chemin n'existe pas ou pointe vers un répertoire, la commande échoue immédiatement.

Si `--force` n'est pas fourni, un terminal interactif affichera une seconde confirmation, indiquant clairement que cette restauration écrasera les données de l'application. Dans les terminaux non interactifs et les sessions d'AI agent, si `--force` est absent, la CLI refusera directement l'exécution et fournira une indication de relance pouvant être copiée telle quelle. S'il s'agit en même temps d'une opération entre envs différents, il faut généralement fournir à la fois `--yes` et `--force`.

Une fois le téléversement réussi, la CLI continue d'attendre que l'application cible repasse `__health_check`. Autrement dit, lorsque la commande se termine avec succès, l'application a généralement déjà été restaurée dans un état accessible.

## Commandes associées

- [`nb backup create`](./create.md)
- [`nb app restart`](../app/restart.md)
