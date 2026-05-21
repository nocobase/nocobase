---
title: "nb license plugins clean"
description: "Référence de la commande nb license plugins clean : supprimer les plugins commerciaux téléchargés pour un env sélectionné."
keywords: "nb license plugins clean,NocoBase CLI,commercial plugins"
---

# nb license plugins clean

Supprime les plugins commerciaux téléchargés pour l'env sélectionné sans modifier l'activation de la licence.

## Utilisation

```bash
nb license plugins clean [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI ; si omis, l'env courant est utilisé |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--dry-run` | boolean | Prévisualiser les plugins qui seraient supprimés sans rien effacer |
| `--verbose` | boolean | Afficher des logs détaillés par plugin |
| `--json` | boolean | Sortie JSON |

## Exemples

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --yes
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

## Commandes connexes

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
