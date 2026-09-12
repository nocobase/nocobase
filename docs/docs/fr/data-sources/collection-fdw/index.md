---
pkg: "@nocobase/plugin-collection-fdw"
title: "Connecter des tables de données externes (FDW)"
description: "Un Foreign Data Wrapper permet de se connecter à des tables de données distantes ; les moteurs federated de MySQL et postgres_fdw de PostgreSQL permettent de mapper les tables distantes afin de les utiliser comme des tables locales."
keywords: "FDW,Foreign Data Wrapper,federated,postgres_fdw,table externe,table distante,NocoBase"
---
# Connecter des tables de données externes (FDW)

## Présentation

Ce plugin permet de connecter des tables de données distantes grâce à l'implémentation d'un foreign data wrapper au niveau de la base de données. Les bases de données MySQL et PostgreSQL sont actuellement prises en charge.

:::info{title="Connecter une source de données vs connecter une table de données externe"}
- **Connecter une source de données** consiste à établir une connexion avec une base de données ou un service API spécifique, afin d'utiliser pleinement les fonctionnalités de la base de données ou les services fournis par l'API ;
- **Connecter une table de données externe** consiste à récupérer des données externes et à les mapper pour les utiliser localement. Dans une base de données, on parle de FDW (Foreign Data Wrapper), une technologie qui permet principalement d'utiliser une table distante comme une table locale, avec une connexion table par table. Comme l'accès est distant, son utilisation s'accompagne de diverses contraintes et limitations.

Les deux approches peuvent également être combinées : la première sert à établir une connexion avec une source de données, tandis que la seconde permet d'accéder à des données provenant de différentes sources. Par exemple, une source de données PostgreSQL peut contenir une table externe créée à l'aide d'un FDW.
:::

### MySQL

MySQL utilise le moteur `federated`, qui doit être activé. Il prend en charge la connexion à des bases de données MySQL distantes ainsi qu'aux bases de données compatibles avec son protocole, comme MariaDB. Pour plus de détails, consultez la documentation [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Dans PostgreSQL, différents types d'extensions `fdw` permettent de prendre en charge différents types de données distantes. Les extensions actuellement prises en charge sont les suivantes :

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html) : connecter une base de données PostgreSQL distante dans PostgreSQL.
- [mysql_fdw (en cours de développement)](https://github.com/EnterpriseDB/mysql_fdw) : connecter une base de données MySQL distante dans PostgreSQL.
- Pour les autres types d'extensions fdw, consultez [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Pour les intégrer à NocoBase, il est nécessaire d'implémenter l'interface d'adaptation correspondante dans le code.

## Installation

Prérequis

- Si la base de données principale de NocoBase est MySQL, vous devez activer `federated`. Consultez [Comment activer le moteur federated dans MySQL](./enable-federated.md).

Ensuite, installez et activez le plugin via le gestionnaire de plugins.

![Installer et activer le plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Guide d'utilisation

Dans le menu déroulant « Gestion des tables de données > Créer une table de données », sélectionnez « Connecter des données externes ».

![Connecter des données externes](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Dans le menu déroulant « Service de base de données », sélectionnez un service de base de données existant ou choisissez « Créer un service de base de données ».

![Service de base de données](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Créer un service de base de données

![Créer un service de base de données](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Après avoir sélectionné le service de base de données, choisissez dans le menu déroulant « Table distante » la table de données à connecter.

![Sélectionner la table de données à connecter](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configurer les informations des champs

![Configurer les informations des champs](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Si la structure de la table distante a changé, vous pouvez également choisir « Synchroniser depuis la table distante ».

![Synchroniser depuis la table distante](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronisation de la table distante

![Synchronisation de la table distante](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Enfin, la table s'affiche dans l'interface.

![Afficher dans l'interface](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)