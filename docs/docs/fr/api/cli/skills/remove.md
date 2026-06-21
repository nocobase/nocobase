---
title: "nb skills remove"
description: "Référence de la commande nb skills remove : supprimer les NocoBase AI coding skills globaux."
keywords: "nb skills remove,NocoBase CLI,supprimer les skills"
---

# nb skills remove

Supprimer les NocoBase AI coding skills globaux gérés par `nb`.

## Utilisation

```bash
nb skills remove [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Ignorer la confirmation de suppression |
| `--json` | boolean | Sortie au format JSON |
| `--verbose` | boolean | Afficher la sortie détaillée de la suppression |

## Exemples

```bash
nb skills remove
nb skills remove --yes
nb skills remove --json
```

## Commandes connexes

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
