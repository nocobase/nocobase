---
title: 'nb backup create'
description: 'Référence de la commande nb backup create : crée une sauvegarde via l’env sélectionné et télécharge le fichier de sauvegarde en local.'
keywords: 'nb backup create,NocoBase CLI,créer une sauvegarde,télécharger une sauvegarde,nbdata'
---

# nb backup create

Crée une sauvegarde via l’env sélectionné et télécharge le fichier de sauvegarde en local. Lorsque `--output` est omis, le CLI enregistre le fichier dans le répertoire de travail courant et réutilise le nom de fichier de sauvegarde renvoyé par le distant — généralement `backup_*.nbdata`.

## Utilisation

```bash
nb backup create [flags]
```

## Paramètres

| Paramètre             | Type    | Description                                                                                                                                                                                       |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`         | string  | Nom de l’env CLI pour lequel créer la sauvegarde ; utilise l’env courant s’il est omis                                                                                                            |
| `--yes`, `-y`         | boolean | Ignore la confirmation interactive lorsque l’env explicitement pointé par `--env` diffère de l’env courant                                                                                        |
| `--output`, `-o`      | string  | Chemin cible du téléchargement. Enregistre dans le répertoire courant s’il est omis ; s’il pointe vers un répertoire existant, le nom de fichier de sauvegarde distant est ajouté automatiquement |
| `--json-output`, `-j` | boolean | Affiche le résultat final au format JSON, avec les champs `env`, `name` et `output`                                                                                                               |

## Exemples

```bash
nb backup create
nb backup create --output ./backups
nb backup create --output ./backups/base.nbdata
nb backup create --env e2e --output ./backups --yes
nb backup create --env e2e --json-output
```

## Remarques

Le CLI vérifie si `--env` correspond à l’env courant uniquement lorsque vous passez `--env` explicitement. Si un env différent est explicitement spécifié, un terminal interactif demandera d’abord une confirmation ; dans un terminal non interactif ou dans un scénario d’AI agent, vous devez ajouter vous-même explicitement `--yes`, ou exécuter d’abord `nb env use <name>` puis réessayer.

Le processus de création est divisé en deux étapes : il appelle d’abord l’API backup de l’env cible pour créer une sauvegarde distante, puis interroge l’état toutes les 2 secondes ; une fois la sauvegarde terminée, il télécharge le fichier en local. Si après 600 secondes le distant renvoie toujours `inProgress: true`, la commande se termine par expiration du délai.

`--output` peut être soit un chemin de fichier, soit un chemin de répertoire existant. Le CLI ne reconnaît comme répertoire qu’un chemin existant ; si le chemin n’existe pas, il sera traité comme un chemin de fichier cible.

Après avoir passé `--json-output`, le CLI n’affiche plus de texte de progression et imprime directement le résultat JSON final. Ce mode est mieux adapté à une consommation ultérieure par des scripts et des workflows d’agent.

## Commandes associées

- [`nb backup restore`](./restore.md)
- [`nb env update`](../env/update.md)
