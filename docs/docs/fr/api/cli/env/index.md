---
title: "nb env"
description: "Référence de la commande nb env : gérer les env du NocoBase CLI, dont l'ajout, le rafraîchissement, la consultation, le changement, l'authentification et la suppression."
keywords: "nb env,NocoBase CLI,gestion des environnements,env,authentification,OpenAPI"
---

# nb env

Gérer les env NocoBase CLI enregistrés. Un env mémorise l'adresse de l'API, les informations d'authentification, le chemin de l'application locale, la configuration de la base de données et le cache des commandes runtime.

## Utilisation

```bash
nb env <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb env add`](./add.md) | Enregistrer un endpoint d'API NocoBase et le définir comme env courant |
| [`nb env update`](./update.md) | Rafraîchir le schéma OpenAPI et le cache des commandes runtime depuis l'application |
| [`nb env list`](./list.md) | Lister les env configurés et leur état d'authentification API |
| [`nb env info`](./info.md) | Consulter les détails d'un env |
| [`nb env remove`](./remove.md) | Supprimer la configuration d'un env |
| [`nb env auth`](./auth.md) | Effectuer la connexion OAuth pour un env enregistré |
| [`nb env use`](./use.md) | Changer l'env courant |

## Exemples

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env list
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Commandes connexes

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
