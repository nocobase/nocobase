---
title: "nb env"
description: "Référence de la commande nb env : gérer les envs enregistrés de NocoBase CLI, y compris l’ajout, l’affichage de l’env courant, la vérification de l’état, le changement, la mise à jour, l’authentification et la suppression."
keywords: "nb env,NocoBase CLI,gestion des environnements,env,current env,authentification,OpenAPI"
---

# nb env

Gère les envs enregistrés de NocoBase CLI. Un env stocke des informations de connexion et d’exécution locale, comme l’adresse de l’API, les informations d’authentification, le chemin de l’application locale et la configuration de la base de données.

À partir de cette version, la CLI sépare deux concepts :

- `current env` : l’env actuellement utilisé par le shell ou le runtime d’agent actif, isolé via `NB_SESSION_ID` lorsque c’est possible
- `last env` : le dernier env utilisé globalement, utilisé comme valeur de repli lorsque le mode session n’est pas activé

## Utilisation

```bash
nb env <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb env add`](./add.md) | Enregistrer un endpoint API NocoBase et basculer vers cet env |
| [`nb env current`](./current.md) | Afficher l’env actuellement effectif |
| [`nb env update`](./update.md) | Mettre à jour la configuration d’un env enregistré et gérer automatiquement la synchronisation de suivi si nécessaire |
| [`nb env list`](./list.md) | Lister les envs configurés |
| [`nb env status`](./status.md) | Afficher l’état de l’env courant, d’un env donné ou de tous les envs |
| [`nb env info`](./info.md) | Afficher les informations détaillées d’un seul env |
| [`nb env remove`](./remove.md) | Supprimer la configuration de l’env après l’arrêt du runtime géré |
| [`nb env auth`](./auth.md) | Effectuer une connexion OAuth pour un env enregistré |
| [`nb env use`](./use.md) | Changer l’env courant |

## Exemples

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Mode session

Il est recommandé d’activer le mode session par défaut. Cela permet à `current env` dans différents terminaux, shells ou runtimes d’agent de rester isolés les uns des autres au lieu d’interférer en parallèle.

Si le mode session n’est pas activé, `nb env use` met à jour le `last env` global, et les autres sessions sans isolation de session sont elles aussi affectées.

Consultez [`nb session setup`](../session/setup.md) pour savoir comment l’activer.

## Commandes associées

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb proxy`](../proxy/index.md)
- [`nb session`](../session/index.md)
