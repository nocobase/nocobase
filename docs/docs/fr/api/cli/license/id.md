---
title: "nb license id"
description: "Référence de la commande nb license id : afficher ou régénérer l'ID d'instance de licence commerciale pour un env sélectionné."
keywords: "nb license id,NocoBase CLI,instance id"
---

# nb license id

Affiche l'ID d'instance de la licence commerciale pour l'env sélectionné. Si aucun ID d'instance enregistré n'existe encore, le CLI en génère un et l'enregistre automatiquement.

## Utilisation

```bash
nb license id [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI ; si omis, l'env courant est utilisé |
| `--force` | boolean | Régénérer l'ID d'instance même si un ID est déjà enregistré |
| `--json` | boolean | Sortie JSON |

## Exemples

```bash
nb license id
nb license id --env app1
nb license id --env app1 --force
nb license id --env app1 --json
```

## Commandes connexes

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
