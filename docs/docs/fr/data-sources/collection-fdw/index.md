---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Connecter des collections externes (FDW)

## Introduction

Ce plugin permet de connecter des collections de données distantes en s'appuyant sur la fonctionnalité de "Foreign Data Wrapper" (FDW) des bases de données. Actuellement, il prend en charge les bases de données MySQL et PostgreSQL.

:::info{title="Connecter des sources de données vs Connecter des collections externes"}
- **Connecter des sources de données** signifie établir une connexion avec une base de données ou un service API spécifique, vous permettant d'utiliser pleinement les fonctionnalités de la base de données ou les services fournis par l'API.
- **Connecter des collections externes** consiste à récupérer des données de l'extérieur et à les mapper pour une utilisation locale. Dans le monde des bases de données, on parle de FDW (Foreign Data Wrapper), une technologie qui permet de considérer des tables distantes comme des tables locales. La connexion se fait collection par collection. Étant donné qu'il s'agit d'un accès distant, son utilisation est soumise à diverses contraintes et limitations.

Les deux approches peuvent également être utilisées conjointement : la première pour établir une connexion avec une source de données, et la seconde pour accéder à des données entre différentes sources. Par exemple, vous pourriez être connecté à une source de données PostgreSQL, et cette source contiendrait une collection externe créée via FDW.
:::

### MySQL

MySQL utilise le moteur `federated`, qui doit être activé. Il permet de connecter des bases de données MySQL distantes ainsi que des bases de données compatibles avec son protocole, comme MariaDB. Pour plus de détails, veuillez consulter la documentation du [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Dans PostgreSQL, différents types d'extensions `fdw` peuvent être utilisés pour prendre en charge divers types de données distantes. Les extensions actuellement prises en charge sont les suivantes :

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html) : Permet de connecter une base de données PostgreSQL distante depuis PostgreSQL.
- [mysql_fdw (en développement)](https://github.com/EnterpriseDB/mysql_fdw) : Permet de connecter une base de données MySQL distante depuis PostgreSQL.
- Pour les autres types d'extensions fdw, vous pouvez consulter les [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). L'intégration avec NocoBase nécessite l'implémentation des interfaces d'adaptation correspondantes dans le code.

## Installation

Prérequis

- Si la base de données principale de NocoBase est MySQL, vous devez activer le moteur `federated`. Référez-vous à [Comment activer le moteur federated dans MySQL](./enable-federated.md).

Ensuite, installez et activez le plugin via le gestionnaire de plugins.

![Installer et activer le plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Manuel d'utilisation

Dans le menu déroulant « Gestion des collections > Créer une collection », sélectionnez « Connecter des données externes ».

![Connecter des données externes](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Dans le menu déroulant « Service de base de données », choisissez un service de base de données existant ou sélectionnez « Créer un service de base de données ».

![Service de base de données](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Créer un service de base de données

![Créer un service de base de données](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Après avoir sélectionné le service de base de données, dans le menu déroulant « Collection distante », choisissez la collection à laquelle vous souhaitez vous connecter.

![Sélectionner la collection à laquelle vous souhaitez vous connecter](https://static-docs.nocobase.com/e915b2b4fc01b3808053cc8dc4.png)

Configurer les informations des champs

![Configurer les informations des champs](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Si la structure de la collection distante a changé, vous pouvez également « Synchroniser depuis la collection distante ».

![Synchroniser depuis la collection distante](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronisation de la collection distante

![Synchronisation de la collection distante](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Enfin, l'affichage dans l'interface

![Affichage dans l'interface](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)