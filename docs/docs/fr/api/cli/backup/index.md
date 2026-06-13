---
title: 'nb backup'
description: 'Référence de la commande nb backup : créez une sauvegarde NocoBase et téléchargez-la en local, ou restaurez un fichier de sauvegarde local vers l’env cible.'
keywords: 'nb backup,NocoBase CLI,sauvegarde,restauration,nbdata'
---

# nb backup

Crée ou restaure une sauvegarde NocoBase. `nb backup create` crée une sauvegarde distante dans l’env cible, puis télécharge le fichier de sauvegarde en local ; `nb backup restore` téléverse un fichier de sauvegarde local vers l’env cible et attend que l’application soit de nouveau prête.

## Utilisation

```bash
nb backup <command>
```

## Sous-commandes

| Commande                            | Description                                               |
| ----------------------------------- | --------------------------------------------------------- |
| [`nb backup create`](./create.md)   | Créer une sauvegarde et la télécharger en local           |
| [`nb backup restore`](./restore.md) | Restaurer un fichier de sauvegarde local vers l’env cible |

## Exemples

```bash
nb backup create
nb backup create --env app1 --output ./backups
nb backup create --env app1 --output ./backups/result.nbdata
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Remarques

Avant l’exécution, la CLI vérifie d’abord si l’env cible expose les commandes d’exécution liées à la sauvegarde. Si des commandes sont absentes, elle actualise automatiquement le cache runtime une fois ; si la capacité `nb api backup ...` est toujours absente après l’actualisation, cela signifie que l’env cible n’a pas encore activé ou synchronisé la capacité de sauvegarde/restauration. Dans ce cas, vous devez d’abord traiter l’application cible elle-même.

Plus précisément :

- `nb backup create` dépend de `nb api backup create`, `nb api backup status` et `nb api backup download`
- `nb backup restore` dépend de `nb api backup restore-upload`

## Commandes associées

- [`nb env update`](../env/update.md)
- [`nb app restart`](../app/restart.md)
- [`nb api`](../api/index.md)
