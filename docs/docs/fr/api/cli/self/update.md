---
title: "nb self update"
description: "Référence de la commande nb self update : mettre à jour le NocoBase CLI installé globalement via npm, pnpm ou yarn."
keywords: "nb self update,NocoBase CLI,mise à jour,mise à jour automatique"
---

# nb self update

Mettre à jour le NocoBase CLI installé lorsque l'installation est gérée par une installation globale standard npm, pnpm ou yarn.

## Utilisation

```bash
nb self update [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--channel` | string | Channel de release pour la mise à jour, par défaut `auto` ; valeurs possibles : `auto`, `latest`, `test`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Ignorer la confirmation de mise à jour |
| `--json` | boolean | Sortie au format JSON |
| `--skills` | boolean | Mettre aussi à jour les NocoBase AI coding skills installées globalement |
| `--verbose` | boolean | Afficher la sortie détaillée de la mise à jour |

## Comportement de mise à jour

`nb self update` commence par détecter la méthode d'installation courante au moment de l'exécution. Il n'utilise pas l'ancien cache `self-install-methods.json`.

Lorsqu'une mise à jour est disponible, la commande utilise le même package manager que celui qui gère l'installation globale courante de la CLI :

| Méthode d'installation | Commande de mise à jour |
| --- | --- |
| `npm-global` | `npm install -g @nocobase/cli@<channel>` |
| `pnpm-global` | `pnpm add -g @nocobase/cli@<channel>` |
| `yarn-global` | `yarn global add @nocobase/cli@<channel>` |

La confirmation interactive est yes par défaut. Utilise `--yes` pour ignorer le prompt dans les scripts.

## Exemples

```bash
nb self update
nb self update --yes
nb self update --skills
nb self update --channel alpha --json
```

## Commandes connexes

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
