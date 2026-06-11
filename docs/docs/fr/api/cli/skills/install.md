---
title: "nb skills install"
description: "Référence de la commande nb skills install : installer globalement les NocoBase AI coding skills."
keywords: "nb skills install,NocoBase CLI,installer les skills"
---

# nb skills install

Installer globalement les NocoBase AI coding skills. Si les skills sont déjà installés, la commande n'effectue aucune mise à jour.

## Utilisation

```bash
nb skills install [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Ignorer la confirmation d'installation |
| `--json` | boolean | Sortie au format JSON |
| `--verbose` | boolean | Afficher la sortie détaillée de l'installation |

## Exemples

```bash
nb skills install
nb skills install --yes
nb skills install --json
```

## Commandes connexes

- [`nb skills check`](./check.md)
- [`nb skills update`](./update.md)
