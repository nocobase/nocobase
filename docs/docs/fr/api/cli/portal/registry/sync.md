---
title: "nb portal registry sync"
description: "Référence de nb portal registry sync : installer, comparer ou mettre à jour les éléments Registry fournis par les plugins dans un AI Portal."
keywords: "nb portal registry sync,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry sync

Installe les éléments NocoBase Portal Registry dans un espace de travail AI Portal existant. La commande lit l'index Registry du service NocoBase sélectionné : les plugins nouvellement activés deviennent donc disponibles sans inscrire leurs éléments en dur dans le modèle du Portal.

## Utilisation

```bash
nb portal registry sync <portal> [éléments...] [options]
```

## Arguments et options

| Argument ou option | Type | Description |
| --- | --- | --- |
| `<portal>` | string | Nom ou slug obligatoire de l'AI Portal |
| `[éléments...]` | string[] | Noms facultatifs des éléments Registry. S'ils sont omis, tous les éléments des plugins activés sont installés. Les formes `ai` et `@nocobase/ai` sont acceptées |
| `--env`, `-e` | string | Nom de l'environnement CLI ; l'environnement courant est utilisé par défaut |
| `--yes`, `-y` | boolean | Ignorer la confirmation lorsque `--env` cible un autre environnement |
| `--overwrite` | boolean | Remplacer les fichiers Registry installés tout en préservant les fichiers existants de `src/components/ui` |
| `--overwrite-ui` | boolean | Autoriser `--overwrite` à remplacer également `src/components/ui` ; nécessite `--overwrite` |
| `--diff` | boolean | Afficher les différences sans modifier le Portal |
| `--build` | boolean | Exécuter `pnpm build` et `pnpm build:html` après l'installation |

## Exemples

Installer tous les éléments disponibles qui ne sont pas encore installés :

```bash
nb portal registry sync customer
```

Installer certains éléments :

```bash
nb portal registry sync customer ai acl auth-sms
```

Comparer un élément installé avec la version du service :

```bash
nb portal registry sync customer ai --diff
```

Actualiser un élément en préservant les composants UI de base :

```bash
nb portal registry sync customer ai --overwrite
```

Écraser les fichiers Registry et les composants UI de base :

```bash
nb portal registry sync customer --overwrite --overwrite-ui
```

Installer puis compiler le Portal :

```bash
nb portal registry sync customer --build
```

Utiliser un autre environnement dans un processus non interactif :

```bash
nb portal registry sync customer --env dev --yes
```

## Fonctionnement

La commande demande d'abord l'index Registry au service NocoBase sélectionné. Le serveur ne renvoie que les éléments fournis par des plugins activés. Elle configure ensuite le Registry `@nocobase` dans le fichier `components.json` du Portal et installe les éléments avec la CLI shadcn locale du Portal.

Par défaut, les éléments dont les fichiers cibles existent déjà sont ignorés. Lors de l'ajout d'éléments ou de dépendances manquants, les fichiers existants de `src/extensions` et `src/components/ui` sont protégés.

Utilisez `--overwrite` uniquement pour actualiser volontairement des fichiers Registry déjà installés. Les composants UI de base restent protégés sauf si `--overwrite-ui` est également fourni. Vérifiez les personnalisations locales avant tout écrasement.

`--diff` est en lecture seule et ne peut pas être combiné avec `--overwrite`, `--overwrite-ui` ou `--build`.

Si le Portal ne contient pas `node_modules`, la commande exécute `pnpm install --frozen-lockfile` avant d'appeler shadcn.

## Commandes associées

- [`nb portal registry`](./index.md)
- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
