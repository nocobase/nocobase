---
title: 'nb env'
description: 'Référence de la commande nb env : gérez les env de NocoBase CLI, y compris l’ajout, l’affichage du current env, la vérification de l’état, le changement, la mise à jour, la génération de configurations proxy, l’authentification et la suppression.'
keywords: 'nb env,NocoBase CLI,gestion d'environnement,env,current env,proxy,authentification,OpenAPI'
---

# nb env

Gérez les env enregistrés de NocoBase CLI. Un env enregistre les informations de connexion et d’exécution locale, comme l’adresse API, les informations d’authentification, le chemin de l’application locale et la configuration de la base de données.

À partir de cette version, la CLI sépare deux concepts :

- `current env` : l’env actuellement utilisé par le shell ou l’agent runtime en cours, isolé via `NB_SESSION_ID` lorsque c’est possible
- `last env` : le dernier env utilisé globalement, utilisé comme valeur de secours lorsque le mode session n’est pas activé

## Utilisation

```bash
nb env <command>
```

## Sous-commandes

| Commande                         | Description                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`nb env add`](./add.md)         | Enregistre un endpoint API NocoBase et bascule vers cet env                                                      |
| [`nb env current`](./current.md) | Afficher l’env actuellement effectif                                                                             |
| [`nb env update`](./update.md)   | Met à jour la configuration d’un env enregistré et gère automatiquement la synchronisation suivante selon le cas |
| [`nb env list`](./list.md)       | Lister les env configurés                                                                                        |
| [`nb env status`](./status.md)   | Afficher l’état de l’env actuel, d’un env spécifié ou de tous les env                                            |
| [`nb env info`](./info.md)       | Afficher les informations détaillées d’un seul env                                                               |
| [`nb env proxy`](./proxy.md)   | Génère une configuration proxy Nginx ou Caddy pour un env géré                                                    |
| [`nb env remove`](./remove.md)   | Supprime la configuration de l’env après avoir arrêté le runtime géré                                            |
| [`nb env auth`](./auth.md)       | Exécute une connexion OAuth pour un env enregistré                                                               |
| [`nb env use`](./use.md)         | Basculer l’env actuel                                                                                            |

## Exemples

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env proxy app1
nb env update app1
nb env use app1
nb env auth app1
```

## session mode

Il est recommandé d’activer le session mode par défaut. Ainsi, le `current env` dans différents terminaux, différents shells ou différents agent runtimes peut être isolé sans s’influencer mutuellement en parallèle.

Si le session mode n’est pas activé, `nb env use` mettra à jour le `last env` global, et les autres sessions sans isolation de session seront également affectées.

Consultez [`nb session setup`](../session/setup.md) pour savoir comment l’activer.

## Commandes associées

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
