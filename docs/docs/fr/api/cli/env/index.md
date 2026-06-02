---
title: "nb env"
description: "Référence de la commande nb env : gérer les env du NocoBase CLI, dont l’ajout, la consultation de l’env courant, la vérification d’état, le changement, l’authentification et la suppression."
keywords: "nb env,NocoBase CLI,gestion des environnements,env,env courant,authentification,OpenAPI"
---

# nb env

Gère les env NocoBase CLI enregistrés. Un env mémorise l’adresse de l’API, les informations d’authentification, les chemins de l’application locale, la configuration de la base de données et le cache des commandes runtime.

Dans le modèle actuel, le CLI sépare deux concepts :

- `current env` : l’env utilisé par le shell ou le runtime d’agent actif, isolé par `NB_SESSION_ID` lorsque disponible
- `last env` : le dernier env utilisé globalement, utilisé comme repli lorsque le mode session n’est pas activé

## Utilisation


nb env <command>

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb env add`](./add.md) | Enregistre un endpoint d’API NocoBase et bascule vers cet env |
| [`nb env current`](./current.md) | Affiche l’env effectivement utilisé |
| [`nb env update`](./update.md) | Rafraîchir le schéma OpenAPI et le cache des commandes runtime depuis l'application |
| [`nb env list`](./list.md) | Liste les env configurés |
| [`nb env status`](./status.md) | Affiche l’état de l’env courant, d’un env ou de tous les env |
| [`nb env info`](./info.md) | Consulter les détails d'un env |
| [`nb env remove`](./remove.md) | Arrête le runtime géré s'il existe, puis supprime la configuration de l'env |
| [`nb env auth`](./auth.md) | Effectuer la connexion OAuth pour un env enregistré |
| [`nb env use`](./use.md) | Change l’env courant |

## Exemples


nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1

## Mode session

Le mode session est la recommandation par défaut. Il garde `current env` isolé entre différents terminaux, shells et runtimes d’agent, afin que le travail en parallèle ne se perturbe pas.

Lorsque le mode session n’est pas activé, `nb env use` met à jour le `last env` global, et d’autres sessions non isolées peuvent aussi être affectées.

Activez-le avec [`nb session setup`](../session/setup.md).

## Commandes connexes

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
