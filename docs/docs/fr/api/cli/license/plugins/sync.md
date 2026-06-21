---
title: "nb license plugins sync"
description: "Référence de la commande nb license plugins sync : synchroniser les plugins commerciaux autorisés par la licence actuelle pour un env sélectionné."
keywords: "nb license plugins sync,NocoBase CLI,commercial plugins"
---

# nb license plugins sync

Synchronise les plugins commerciaux autorisés par la licence actuelle.

## Utilisation

```bash
nb license plugins sync [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI ; utilise l'env courant si omis |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--dry-run` | boolean | Prévisualiser les changements sans installer, mettre à jour ni supprimer de plugins |
| `--version` | string | Version du registry ou dist-tag à synchroniser ; par défaut, utilise la version actuelle du workspace |
| `--skip-if-no-license` | boolean | Ignorer sans erreur si l'env actuelle n'a pas encore de clé de licence enregistrée |
| `--verbose` | boolean | Afficher les logs détaillés pour chaque plugin |
| `--json` | boolean | Sortie JSON |

## Exemples

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --skip-if-no-license
nb license plugins sync --env app1 --json
```

## Notes

Lorsque `--version` est omis, la CLI détecte automatiquement la version actuelle de l'application et l'utilise pour déterminer quelle version du registry des plugins commerciaux doit être téléchargée.

`--skip-if-no-license` n'ignore qu'un seul cas : l'env actuelle n'a pas encore de clé de licence enregistrée. Les autres erreurs, comme des identifiants de registry manquants dans la clé, un échec de connexion au registry ou un échec du téléchargement des plugins, restent affichées normalement.

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

## Commandes connexes

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
