---
title: "nb license plugins list"
description: "Référence de la commande nb license plugins list : afficher les plugins commerciaux associés à la licence actuelle pour un env sélectionné."
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

Affiche les plugins commerciaux associés au license key enregistré pour l'env sélectionné.

## Utilisation

```bash
nb license plugins list [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI ; si omis, l'env courant est utilisé |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--json` | boolean | Sortie JSON |

## Exemples

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --yes
nb license plugins list --env app1 --json
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

## Commandes connexes

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
