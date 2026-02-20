---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Source de données REST API

## Introduction

Ce plugin vous permet d'intégrer facilement des données issues de sources REST API.

## Installation

Étant un plugin commercial, vous devez le télécharger et l'activer via le gestionnaire de plugins.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Ajout d'une source de données REST API

Après avoir activé le plugin, vous pouvez ajouter une source de données REST API en la sélectionnant dans le menu déroulant « Ajouter nouveau » de la section de gestion des sources de données.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Configurez la source de données REST API.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Ajout d'une collection

Dans NocoBase, une ressource RESTful est mappée à une collection, comme par exemple une ressource Utilisateurs.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Ces points d'API sont mappés dans NocoBase comme suit :

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Pour un guide complet sur les spécifications de conception de l'API NocoBase, veuillez consulter la documentation de l'API.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Consultez le chapitre « NocoBase API - Core » pour des informations détaillées.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

La configuration de la collection pour une source de données REST API comprend les éléments suivants :

### List

Mappez l'interface pour afficher une liste de ressources.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Get

Mappez l'interface pour afficher les détails d'une ressource.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Create

Mappez l'interface pour créer une ressource.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Update

Mappez l'interface pour mettre à jour une ressource.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Destroy

Mappez l'interface pour supprimer une ressource.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

Les interfaces List et Get sont toutes deux obligatoires et doivent être configurées.

## Débogage de l'API

### Intégration des paramètres de requête

Exemple : Configurez les paramètres de pagination pour l'API List. Si l'API tierce ne prend pas en charge la pagination nativement, NocoBase paginera en fonction des données de liste récupérées.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Veuillez noter que seules les variables ajoutées dans l'interface prendront effet.

| Nom du paramètre de l'API tierce | Paramètre NocoBase          |
| -------------------------------- | --------------------------- |
| page                             | {{request.params.page}}     |
| limit                            | {{request.params.pageSize}} |

Vous pouvez cliquer sur « Essayer » (Try it out) pour déboguer et visualiser la réponse.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Transformation du format de réponse

Le format de réponse de l'API tierce peut ne pas être conforme au standard NocoBase ; il doit être transformé pour s'afficher correctement sur le frontend.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Ajustez les règles de conversion en fonction du format de réponse de l'API tierce pour vous assurer que la sortie est conforme au standard NocoBase.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Description du processus de débogage

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Variables

La source de données REST API prend en charge trois types de variables pour l'intégration d'API :

- Variables personnalisées de la source de données
- Variables de requête NocoBase
- Variables de réponse tierces

### Variables personnalisées de la source de données

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Requête NocoBase

- Params : Paramètres de requête URL (Search Params), qui varient selon l'interface.
- Headers : En-têtes de requête personnalisés, fournissant principalement des informations X- spécifiques de NocoBase.
- Body : Le corps de la requête.
- Token : Le jeton API pour la requête NocoBase actuelle.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Réponses tierces

Actuellement, seul le corps de la réponse est disponible.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Voici les variables disponibles pour chaque interface :

### List

| Paramètre               | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| request.params.page     | Page actuelle                                              |
| request.params.pageSize | Nombre d'éléments par page                                 |
| request.params.filter   | Critères de filtrage (doit respecter le format de filtre NocoBase) |
| request.params.sort     | Critères de tri (doit respecter le format de tri NocoBase) |
| request.params.appends  | Champs à charger à la demande, généralement pour les champs d'association |
| request.params.fields   | Champs à inclure (liste blanche)                           |
| request.params.except   | Champs à exclure (liste noire)                             |

### Get

| Paramètre                 | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Obligatoire, généralement l'ID de l'enregistrement actuel  |
| request.params.filter     | Critères de filtrage (doit respecter le format de filtre NocoBase) |
| request.params.appends    | Champs à charger à la demande, généralement pour les champs d'association |
| request.params.fields     | Champs à inclure (liste blanche)                           |
| request.params.except     | Champs à exclure (liste noire)                             |

### Create

| Paramètre                | Description                       |
| ------------------------ | --------------------------------- |
| request.params.whiteList | Liste blanche                     |
| request.params.blacklist | Liste noire                       |
| request.body             | Données initiales pour la création |

### Update

| Paramètre                 | Description                                        |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Obligatoire, généralement l'ID de l'enregistrement actuel |
| request.params.filter     | Critères de filtrage (doit respecter le format de filtre NocoBase) |
| request.params.whiteList  | Liste blanche                                      |
| request.params.blacklist  | Liste noire                                        |
| request.body              | Données pour la mise à jour                        |

### Destroy

| Paramètre                 | Description                                        |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Obligatoire, généralement l'ID de l'enregistrement actuel |
| request.params.filter     | Critères de filtrage (doit respecter le format de filtre NocoBase) |

## Configuration des champs

Les métadonnées des champs (Fields) sont extraites des données de l'interface CRUD de la ressource adaptée pour servir de champs à la collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Extrayez les métadonnées des champs.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Champs et aperçu.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Modifiez les champs (de manière similaire aux autres sources de données).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Ajout de blocs de source de données REST API

Une fois la collection configurée, vous pouvez ajouter des blocs à l'interface.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)