:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/integration/fdw/index).
:::

# Connecter des tables de données externes (FDW)

## Introduction

Cette fonctionnalité permet de se connecter à des tables de données distantes en s'appuyant sur le Foreign Data Wrapper (FDW) de la base de données. Elle prend actuellement en charge les bases de données MySQL et PostgreSQL.

:::info{title="Connexion aux sources de données vs Connexion aux tables de données externes"}
- **La connexion aux sources de données** consiste à établir une connexion avec une base de données spécifique ou un service API, vous permettant d'utiliser pleinement les fonctionnalités de la base de données ou les services fournis par l'API ;
- **La connexion aux tables de données externes** consiste à récupérer des données de l'extérieur et à les mapper pour une utilisation locale. Dans le domaine des bases de données, cela s'appelle FDW (Foreign Data Wrapper). C'est une technologie de base de données qui se concentre sur l'utilisation de tables distantes comme s'il s'agissait de tables locales, et elle ne peut connecter qu'une seule table à la fois. S'agissant d'un accès distant, son utilisation comporte diverses contraintes et limitations.

Les deux peuvent également être utilisés en combinaison. Le premier sert à établir une connexion avec la source de données, tandis que le second est utilisé pour l'accès entre différentes sources de données. Par exemple, si une source de données PostgreSQL est connectée, une table spécifique au sein de cette source peut être une table externe créée via FDW.
:::

### MySQL

MySQL utilise le moteur `federated`, qui doit être activé. Il permet la connexion à des instances MySQL distantes et à des bases de données compatibles avec son protocole, comme MariaDB. Pour plus de détails, consultez la documentation du [moteur de stockage Federated](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Dans PostgreSQL, différents types d'extensions `fdw` peuvent être utilisés pour prendre en charge divers types de données distantes. Les extensions actuellement supportées incluent :

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html) : Connecter une base de données PostgreSQL distante dans PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw) : Connecter une base de données MySQL distante dans PostgreSQL.
- Pour les autres types d'extensions fdw, veuillez vous référer à [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). L'intégration dans NocoBase nécessite l'implémentation de l'interface d'adaptation correspondante dans le code.

## Prérequis

- Si la base de données principale de NocoBase est MySQL, vous devez activer `federated`. Consultez [Comment activer le moteur federated dans MySQL](./enable-federated).

Ensuite, installez et activez le plugin via le gestionnaire de plugins.

![Installer et activer le plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Manuel d'utilisation

Dans le menu déroulant « Gestion des collections > Créer une collection », sélectionnez « Connecter à des données externes ».

![Connecter des données externes](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Dans le menu déroulant « Serveur de base de données », sélectionnez un service de base de données existant ou « Créer un serveur de base de données ».

![Service de base de données](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Créer un serveur de base de données

![Créer un serveur de base de données](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Après avoir sélectionné le serveur de base de données, choisissez la table de données que vous souhaitez connecter dans le menu déroulant « Table distante ».

![Sélectionner la table de données à connecter](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configurer les informations des champs

![Configurer les informations des champs](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Si la structure de la table distante change, vous pouvez également cliquer sur « Synchroniser depuis la table distante ».

![Synchroniser depuis la table distante](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronisation de la table distante

![Synchronisation de la table distante](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Enfin, affichage dans l'interface

![Affichage dans l'interface](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)