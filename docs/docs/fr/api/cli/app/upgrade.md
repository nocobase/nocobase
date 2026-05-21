---
title: "nb app upgrade"
description: "Référence de la commande nb app upgrade : mettre à jour les sources ou l'image puis redémarrer l'application NocoBase indiquée."
keywords: "nb app upgrade,NocoBase CLI,mise à niveau,mise à jour,image Docker"
---

# nb app upgrade

Mettre à niveau l'application NocoBase indiquée. Pour une installation npm/Git, le CLI rafraîchit les sources locales enregistrées et redémarre via quickstart ; pour une installation Docker, il rafraîchit l'image enregistrée et reconstruit le conteneur d'application.

## Utilisation

```bash
nb app upgrade [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à mettre à niveau ; utilise l'env courant si omis |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--skip-code-update`, `-s` | boolean | Redémarrer avec les sources locales ou l'image Docker déjà enregistrées, sans téléchargement |
| `--version` | string | Remplace la `downloadVersion` enregistrée ; lorsque la mise à niveau réussit, la nouvelle version est réécrite dans la configuration de l'env |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes de mise à jour et de redémarrage sous-jacentes |

## Exemples

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

## Commandes connexes

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
