---
title: "nb license status"
description: "Référence de la commande nb license status : afficher l'état de la licence commerciale pour un env sélectionné."
keywords: "nb license status,NocoBase CLI,license status"
---

# nb license status

Affiche l'état de la licence commerciale pour l'env sélectionné.

## Utilisation

```bash
nb license status [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI ; si omis, l'env courant est utilisé |
| `--doctor` | boolean | Exécuter des vérifications et suggestions de diagnostic supplémentaires |
| `--json` | boolean | Sortie JSON |

## Exemples

```bash
nb license status
nb license status --env app1
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Remarques

Le nouveau CLI n'implémente pas encore complètement les vérifications backend de l'état de la licence. La commande peut toujours renvoyer un contexte de base et des espaces réservés de diagnostic, mais pas un verdict complet sur la licence.

## Commandes connexes

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
