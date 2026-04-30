---
title: "nb self update"
description: "Référence de la commande nb self update : mettre à jour le NocoBase CLI installé globalement via npm."
keywords: "nb self update,NocoBase CLI,mise à jour,mise à jour automatique"
---

# nb self update

Mettre à jour le NocoBase CLI installé lorsque l'installation est gérée par une installation globale npm standard.

## Utilisation

```bash
nb self update [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--channel` | string | Channel de release pour la mise à jour, par défaut `auto` ; valeurs possibles : `auto`, `latest`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Ignorer la confirmation de mise à jour |
| `--json` | boolean | Sortie au format JSON |
| `--verbose` | boolean | Afficher la sortie détaillée de la mise à jour |

## Exemples

```bash
nb self update
nb self update --yes
nb self update --channel alpha --json
```

## Commandes connexes

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
