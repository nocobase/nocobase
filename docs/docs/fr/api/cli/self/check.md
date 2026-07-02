---
title: "nb self check"
description: "Référence de la commande nb self check : vérifier la version du NocoBase CLI installé et la prise en charge de la mise à jour automatique."
keywords: "nb self check,NocoBase CLI,vérification de version"
---

# nb self check

Vérifier l'installation courante du NocoBase CLI, résoudre la dernière version du channel sélectionné et indiquer si la mise à jour automatique est prise en charge.

## Utilisation

```bash
nb self check [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--channel` | string | Channel de release à comparer, par défaut `auto` ; valeurs possibles : `auto`, `latest`, `test`, `beta`, `alpha` |
| `--json` | boolean | Sortie au format JSON |

## Méthode d'installation

`nb self check` détecte la méthode d'installation courante au moment de l'exécution. Il n'utilise pas l'ancien cache `self-install-methods.json`.

La commande peut afficher ces méthodes d'installation :

| Méthode d'installation | Signification |
| --- | --- |
| `npm-global` | La CLI est installée sous le `npm prefix -g` courant. |
| `pnpm-global` | La CLI est installée dans un arbre global `node_modules` de pnpm. |
| `yarn-global` | La CLI est lancée depuis `yarn global bin` ou installée sous `yarn global dir`. |
| `package-local` | La CLI est installée dans l'arbre de dépendances d'un projet local. |
| `source` | La CLI s'exécute depuis un checkout du dépôt. |
| `unknown` | L'installation de la CLI n'a pas pu être associée à une méthode d'installation prise en charge. |

La mise à jour automatique est prise en charge pour `npm-global`, `pnpm-global` et `yarn-global`. Pour `package-local` ou `source`, mets plutôt à jour le projet parent ou le checkout du dépôt.

## Exemples

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Commandes connexes

- [`nb self update`](./update.md)
