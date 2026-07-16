---
title: "Source de données REST API"
description: "Connectez des données provenant d’une API REST, mappez des ressources RESTful vers des Collections, configurez le mappage des interfaces List/Get/Create/Update/Destroy et prenez en charge les opérations CRUD."
keywords: "Source de données REST API, API externe, mappage d’interfaces, mappage de Collection, NocoBase"
---

# Source de données REST API

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## Présentation

Permet de connecter des données provenant d’une API REST.

## Installation

Ce plugin est un plugin commercial. Pour plus d’informations sur son activation, consultez le [guide d’activation des plugins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajouter une source REST API

Après avoir activé le plugin, sélectionnez REST API dans le menu déroulant Add new de la gestion des sources de données.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Configurer la source REST API

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Ajouter une Collection

Les ressources RESTful correspondent aux Collections de NocoBase, comme la ressource Users.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

La configuration correspondante dans l’API NocoBase est la suivante

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Consultez la documentation de l’API pour connaître les spécifications complètes de conception de l’API NocoBase.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Consultez la section « NocoBase API - Core »

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

La configuration de la Collection de la source de données REST API est la suivante

### List

Configurez le mappage de l’interface permettant d’afficher la liste des ressources.

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

### Get

Configurez le mappage de l’interface permettant d’afficher les détails d’une ressource.

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

### Create

Configurez le mappage de l’interface permettant de créer une ressource.

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

### Update

Configurez le mappage de l’interface permettant de mettre à jour une ressource.
![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

Configurez le mappage de l’interface permettant de supprimer une ressource.

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

Les interfaces List et Get sont les deux interfaces obligatoires à configurer.
## Déboguer l’API

### Correspondance des paramètres de requête

Exemple : configurer les paramètres de pagination pour l’interface List (si l’API tierce ne prend pas elle-même en charge la pagination, la pagination est effectuée à partir des données de la liste obtenue).

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

Notez que seules les variables déjà ajoutées dans l’interface prennent effet.

| Nom du paramètre d’accès à l’API tierce | Paramètre NocoBase          |
| -------------------------------------- | --------------------------- |
| page                                   | {{request.params.page}}     |
| limit                                  | {{request.params.pageSize}} |

Vous pouvez cliquer sur Try it out pour effectuer un test et afficher le résultat de la réponse.

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Conversion du format de réponse

Le format de réponse de l’API tierce peut ne pas être conforme au standard NocoBase. Il doit être converti pour pouvoir être affiché correctement dans l’interface.

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

Ajustez les règles de conversion en fonction du format de réponse de l’API tierce afin de respecter le standard de sortie de NocoBase.

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

Description du processus de débogage

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

### Conversion des informations d’erreur

En cas d’erreur de l’API tierce, le format des informations d’erreur renvoyées peut ne pas être conforme au standard NocoBase. Il doit être converti pour pouvoir être affiché correctement dans l’interface.

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

Lorsque la conversion des informations d’erreur n’est pas configurée, elles sont converties par défaut en informations d’erreur contenant le code d’état HTTP.

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

Après avoir configuré la conversion des informations d’erreur, celles-ci sont conformes au standard de sortie de NocoBase et l’interface peut afficher correctement les informations d’erreur de l’API tierce.

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## Variables

La source de données REST API fournit trois catégories de variables pour l’intégration des interfaces.

- Variables personnalisées de la source de données
- Requête NocoBase
- Réponse tierce

### Variables personnalisées de la source de données

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Requête NocoBase

- Params : paramètres de requête URL (Search Params), les Params varient selon les interfaces ;
- Headers : corps de la requête, fournissant principalement certaines informations X- personnalisées de NocoBase ;
- Body : corps de la requête ;
- Token : jeton d’API de la requête NocoBase actuelle.

![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### Réponse tierce

Pour le moment, seul le Body de la réponse est fourni.

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

Les variables disponibles pour l’intégration de chaque interface sont les suivantes :

### List

| Paramètre               | Description                                      |
| ----------------------- | ------------------------------------------------ |
| request.params.page     | Numéro de la page actuelle                       |
| request.params.pageSize | Nombre d’éléments par page                       |
| request.params.filter   | Condition de filtrage (doit respecter le format Filter de NocoBase) |
| request.params.sort     | Règle de tri (doit respecter le format Sort de NocoBase) |
| request.params.appends  | Champs chargés à la demande, généralement utilisés pour le chargement à la demande des champs relationnels |
| request.params.fields   | Champs que l’interface doit uniquement renvoyer (liste blanche) |
| request.params.except   | Champs à exclure (liste noire)                    |

### Get

| Paramètre                 | Description                                      |
| ------------------------- | ------------------------------------------------ |
| request.params.filterByTk | Obligatoire, il s’agit généralement de l’ID de la donnée actuelle |
| request.params.filter     | Condition de filtrage (doit respecter le format Filter de NocoBase) |
| request.params.appends    | Champs chargés à la demande, généralement utilisés pour le chargement à la demande des champs relationnels |
| request.params.fields     | Champs que l’interface doit uniquement renvoyer (liste blanche) |
| request.params.except     | Champs à exclure (liste noire)                    |

### Create

| Paramètre                | Description        |
| ------------------------ | ------------------ |
| request.params.whiteList | Liste blanche       |
| request.params.blacklist | Liste noire        |
| request.body             | Données initiales à créer |

### Update

| Paramètre                 | Description                                      |
| ------------------------- | ------------------------------------------------ |
| request.params.filterByTk | Obligatoire, il s’agit généralement de l’ID de la donnée actuelle |
| request.params.filter     | Condition de filtrage (doit respecter le format Filter de NocoBase) |
| request.params.whiteList  | Liste blanche                                    |
| request.params.blacklist  | Liste noire                                     |
| request.body              | Données à mettre à jour                         |

### Destroy

| Paramètre                 | Description                                      |
| ------------------------- | ------------------------------------------------ |
| request.params.filterByTk | Obligatoire, il s’agit généralement de l’ID de la donnée actuelle |
| request.params.filter     | Condition de filtrage (doit respecter le format Filter de NocoBase) |

## Configurer les champs

Extrayez les métadonnées des champs (Fields) à partir des données des interfaces CRUD de la ressource adaptée afin de les utiliser comme champs de la Collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Extraire les métadonnées des champs.

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

Champs et aperçu.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Modifier les champs (de manière similaire aux autres sources de données).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Ajouter un bloc de source de données REST API

Une fois la Collection configurée, vous pouvez ajouter des blocs dans l’interface.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)
