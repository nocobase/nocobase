---
title: "nb portal registry"
description: "Référence de nb portal registry : gérer les éléments Portal Registry fournis par les plugins dans un espace de travail AI Portal."
keywords: "nb portal registry,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry

Gère les éléments NocoBase Portal Registry dans un espace de travail AI Portal. Les plugins activés côté serveur peuvent publier des intégrations frontend réutilisables, telles que des composants, hooks, adaptateurs et pages de démonstration. Les commandes Registry installent ces intégrations dans le code source du Portal.

## Utilisation

```bash
nb portal registry <commande>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb portal registry sync`](./sync.md) | Installer ou mettre à jour les éléments Registry publiés par les plugins NocoBase activés |

## Prérequis

- L'espace de travail du Portal doit déjà exister et contenir `package.json` et `components.json`.
- L'environnement NocoBase sélectionné doit exposer l'API Portal Registry.
- Seuls les éléments fournis par des plugins activés sont disponibles.

## Exemples

Installer tous les éléments disponibles dans le Portal `customer` :

```bash
nb portal registry sync customer
```

Installer uniquement certains éléments :

```bash
nb portal registry sync customer ai acl auth-sms
```

## Commandes associées

- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
