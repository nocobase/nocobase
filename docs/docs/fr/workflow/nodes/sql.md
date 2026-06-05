---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Action SQL

## Introduction

Dans certains scénarios spécifiques, les nœuds d'action de collection simples mentionnés précédemment peuvent ne pas suffire pour des opérations complexes. Dans de tels cas, vous pouvez utiliser directement le nœud SQL pour que la base de données exécute des instructions SQL complexes afin de manipuler les données.

La différence avec une connexion directe à la base de données pour des opérations SQL en dehors de l'application est que, au sein d'un flux de travail, vous pouvez utiliser les variables du contexte du processus comme paramètres dans l'instruction SQL.

## Installation

Plugin intégré, aucune installation n'est requise.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Action SQL » :

![Ajouter une action SQL](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Configuration du nœud

![Nœud SQL_Configuration du nœud](https://static-docs.nocobase.com/20260414235136.png)

### Source de données

Sélectionnez la source de données sur laquelle exécuter la requête SQL.

La source de données doit être de type base de données, comme la source de données principale, PostgreSQL, ou toute autre source de données compatible avec Sequelize.

### Contenu SQL

Modifiez l'instruction SQL. Actuellement, une seule instruction SQL est prise en charge.

:::info
Depuis la version `v2.0.30`, pour des raisons de sécurité, la substitution directe de variables par texte dans les instructions SQL n'est plus prise en charge. Les requêtes paramétrées doivent être utilisées à la place.
:::

Les variables du contexte du processus peuvent être utilisées dans les instructions SQL, mais doivent être indiquées au format `:variableName`, par exemple :

```sql
SELECT * FROM users WHERE id = :userId;
```

### Liste de paramètres

Dans l'instruction SQL ci-dessus, `:userId` est un espace réservé. Le remplacement des espaces réservés doit être configuré dans la « Liste de paramètres ». Le nom de la variable utilise le nom de l'espace réservé, par exemple `userId`, et la valeur peut être sélectionnée depuis le contexte du processus à l'aide du sélecteur de variables.

## Résultat de l'exécution du nœud

Depuis la version `v1.3.15-beta`, le résultat de l'exécution d'un nœud SQL est un tableau de données pures. Auparavant, il s'agissait de la structure de retour native de Sequelize contenant les métadonnées de la requête (voir : [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Par exemple, la requête suivante :

```sql
select count(id) from posts;
```

Résultat avant `v1.3.15-beta` :

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Résultat après `v1.3.15-beta` :

```json
[
    { "count": 1 }
]
```

## Questions fréquentes

### Comment utiliser le résultat d'un nœud SQL ?

Si une instruction `SELECT` est utilisée, le résultat de la requête sera enregistré dans le nœud au format JSON de Sequelize. Vous pouvez l'analyser et l'utiliser avec le plugin [JSON-query](./json-query.md).

### L'action SQL déclenche-t-elle des événements de collection ?

**Non**. L'action SQL envoie directement l'instruction SQL à la base de données pour traitement. Les opérations `CREATE` / `UPDATE` / `DELETE` associées se produisent dans la base de données, tandis que les événements de collection se produisent au niveau de la couche application de Node.js (gérée par l'ORM). Par conséquent, les événements de collection ne seront pas déclenchés.