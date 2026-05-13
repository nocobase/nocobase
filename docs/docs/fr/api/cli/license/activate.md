---
title: "nb license activate"
description: "Référence de la commande nb license activate : activer la licence commerciale de NocoBase pour un env sélectionné."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Active la licence commerciale pour un env sélectionné. Vous pouvez fournir directement un license key existant, ou demander et activer une licence en ligne.

## Utilisation

```bash
nb license activate [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI ; si omis, l'env courant est utilisé |
| `--key` | string | Fournir directement un license key existant |
| `--key-file` | string | Lire le license key depuis un fichier |
| `--online` | boolean | Demander une licence en ligne et l'activer |
| `--account` | string | Compte du service de licences pour l'activation en ligne |
| `--password` | string | Mot de passe du service de licences pour l'activation en ligne |
| `--desc` | string | Nom de l'application pour l'activation en ligne |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--json` | boolean | Sortie JSON |

## Exemples

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## Remarques

Lorsqu'une activation en ligne est utilisée, le CLI demande un license key au service de licences avec l'ID d'instance et l'URL de l'application de l'env courant.

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

## Commandes connexes

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
