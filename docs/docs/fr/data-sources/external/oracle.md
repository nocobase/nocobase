---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "Source de données externe - Oracle"
description: "Découvrez comment connecter Oracle à NocoBase en tant que base de données externe, notamment les versions prises en charge, l’installation du plug-in, les modes de connexion Thin/Thick, le répertoire Client, les autorisations et la correspondance des champs."
keywords: "source de données externe,Oracle,base de données externe,Thin,Thick,répertoire Client,correspondance des champs,NocoBase"
---

# Oracle

## Présentation

Oracle peut être connecté à NocoBase en tant que base de données externe. Une fois la connexion établie, NocoBase lit les tables, les champs et les vues d’Oracle et les utilise comme tables de données dans la source de données externe.

Contrairement à la [base de données principale](../main/index.md), la structure réelle des tables Oracle externes reste gérée par le système métier d’origine, le client de base de données ou les scripts de migration. NocoBase se charge de lire la structure, d’enregistrer les métadonnées des champs et de configurer les blocs de page, les autorisations, les workflows et les API.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | Oracle >= 11g. |
| Version commerciale | Prise en charge par l’édition Enterprise. |
| Plug-in correspondant | `@nocobase/plugin-data-source-external-oracle`. |
| Mode de connexion | Les versions Oracle Database 12.1 et ultérieures utilisent généralement le mode Thin ; les versions antérieures à 12.1 utilisent le mode Thick. |

Les scénarios adaptés à l’utilisation d’Oracle comme source externe sont les suivants :

- Connecter la base de données Oracle de systèmes métier existants tels que ERP, MES, WMS ou CRM
- Créer une interface de gestion avec NocoBase sans migrer les données historiques
- Appliquer des autorisations, des processus, des corrections de données ou des rapports aux tables existantes
- Continuer à faire gérer la structure de la base de données par le DBA, les scripts de migration ou le système d’origine

:::warning Attention

Oracle externe n’est pas la base de données système de NocoBase. NocoBase ne prend pas en charge ses sauvegardes, restaurations, migrations ni modifications de structure de tables.

:::

## Installation du plug-in

Ce plug-in est un plug-in commercial. Pour connaître la procédure d’activation, consultez le [guide d’activation des plug-ins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

Si vous sélectionnez le mode Thick, vous devez installer les bibliothèques Oracle Client dans l’environnement d’exécution de NocoBase et renseigner le « répertoire Client » dans la configuration de la source de données.

## Installation du client Oracle

Les versions Oracle Database 12.1 et ultérieures utilisent généralement le mode Thin et ne nécessitent pas l’installation supplémentaire d’Oracle Client. L’installation d’Oracle Client dans l’environnement d’exécution de NocoBase est nécessaire uniquement lorsque vous vous connectez à une version antérieure à Oracle Database 12.1 ou lorsque le mode Thick doit être utilisé.

Après avoir sélectionné le mode « Thick » dans la configuration de la source de données, vérifiez que la machine hébergeant le service NocoBase peut charger Oracle Client.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Dans un environnement Linux, vous pouvez installer Oracle Instant Client de la manière suivante :

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Si Oracle Client n’est pas installé dans un emplacement que le système peut charger par défaut, indiquez le répertoire des bibliothèques clientes dans le « répertoire Client ». Par exemple, avec la méthode d’installation ci-dessus, le répertoire correspondant est `/opt/instantclient_19_25`.

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

:::tip Conseil

`Client directory` doit être configuré uniquement en mode Thick. Le mode Thin n’utilise pas cette configuration. Pour plus d’informations sur les règles d’initialisation, consultez la [documentation d’initialisation de node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html).

:::

## Ajouter une source de données

Dans « Gestion des sources de données », cliquez sur « Add new », sélectionnez Oracle, puis renseignez les informations de connexion.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Voici les configurations de connexion courantes :

| Configuration | Description |
| --- | --- |
| Data source name | Nom d’identification de la source de données, utilisé pour la référencer dans les blocs de page, les autorisations, les workflows et les API. Il ne peut plus être modifié après la création. |
| Data source display name | Nom affiché dans l’interface pour la source de données. Il est recommandé d’utiliser un nom compréhensible par les utilisateurs métier, comme « ERP Oracle » ou « Base financière ». |
| Host / Port | Adresse et port de l’hôte Oracle. Le port par défaut est généralement `1521`. |
| ServerName | Nom du service Oracle. Renseignez le nom de service configuré dans l’écouteur de la base de données. |
| Username / Password | Nom d’utilisateur et mot de passe utilisés pour se connecter à Oracle. NocoBase lit les tables et les vues appartenant à cet Owner, sans autoriser ni lire les objets appartenant à d’autres Owner. |
| Connection mode | Mode de connexion Oracle. Les versions Oracle Database 12.1 et ultérieures utilisent généralement le mode Thin ; les versions antérieures à 12.1 utilisent le mode Thick. |
| Client directory | Répertoire des bibliothèques Oracle Client en mode Oracle Thick. Il doit être configuré uniquement lorsque le mode Thick est sélectionné. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables et les vues correspondant à ce préfixe et génère dans NocoBase des noms de tables sans préfixe. |
| Collections / Add all collections | Contrôle l’étendue de la connexion. Lorsque « Add all collections » est activé, NocoBase connecte toutes les tables et vues correspondant à l’Owner et au préfixe actuels ; lorsqu’il est désactivé, seuls les objets sélectionnés dans « Collections » sont connectés. |
| Enabled the data source | Indique si cette source de données est activée. Lorsqu’elle est désactivée, sa configuration est conservée, mais les blocs de page, les autorisations, les workflows et les API ne peuvent plus lire ses données. |

:::tip Conseil

Dans Oracle, l’étendue des objets connectés dépend principalement de l’Owner du compte de connexion, de `Table prefix` et de « Collections ». Si l’instance contient de nombreux objets, il est recommandé d’utiliser un compte dédié pour se connecter au schéma nécessaire aux activités, afin de limiter l’importation d’objets inutiles dans NocoBase.

:::

## Sélectionner les tables de données

Après avoir renseigné les informations de connexion, vous pouvez cliquer sur « Load Collections » pour charger les tables de données et les vues disponibles dans Oracle. Les résultats dépendent de l’Owner du compte de connexion, de `Table prefix` et de la configuration de « Collections ».

« Add all collections » est activé par défaut, ce qui signifie que toutes les tables et vues comprises dans l’étendue actuelle seront connectées. Pour ne connecter qu’une partie des objets, désactivez « Add all collections », puis sélectionnez les tables ou les vues nécessaires dans la liste.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Attention

Une source de données externe peut connecter au maximum 500 tables ou vues à la fois. Si Oracle contient de nombreux objets, il est recommandé de réduire d’abord l’étendue au moyen de l’Owner du compte de connexion, de `Table prefix` ou de « Collections ».

:::

## Synchroniser et configurer les champs

La structure des tables Oracle externes est gérée côté base de données. NocoBase ne crée pas de champs, ne modifie pas leur type et ne supprime pas les champs réels dans Oracle externe.

Lorsque la structure d’une table Oracle est modifiée, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour les informations enregistrées dans NocoBase concernant les tables de données, les champs, les clés primaires, les clés uniques et la correspondance des types de champs, mais elle ne supprime ni les tables ni les données réelles dans Oracle.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le libellé du champ, son type (Field type) et son composant (Field interface). Si vous devez créer des champs de relation NocoBase, les métadonnées de relation sont également enregistrées dans NocoBase ; aucun champ de clé étrangère réel n’est automatiquement ajouté aux tables Oracle.

## Correspondance des types de champs

NocoBase associe automatiquement les types de champs Oracle au Field type et au Field interface appropriés. Vous pouvez modifier le mode d’affichage dans la configuration du champ.

Les correspondances courantes sont les suivantes :

| Type de champ Oracle | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `NUMBER` | `integer`、`float`、`boolean`、`bigInt`、`unixTimestamp`、`sort` | Integer、Number、Sort、Checkbox、Switch、Select、Radio group. |
| `BINARY_FLOAT`、`BINARY_DOUBLE`、`FLOAT` | `float` | Number、Percent. |
| `INTEGER`、`SMALLINT`、`PLSQL_INTEGER` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group. |
| `CHAR`、`NCHAR`、`VARCHAR2`、`NVARCHAR2` | `string`、`uuid`、`nanoid`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `LONG`、`NCLOB` | `string`、`text` | Input、Textarea、Markdown、Vditor、Rich text。 |
| `CLOB` | `string` | Input、Textarea、Rich text。 |
| `DATE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE`、`TIMESTAMP WITH LOCAL TIME ZONE` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `ROWID`、`UROWID` | `string`、`text`、`integer` | Input、Textarea、Integer。 |
| `JSON` | `json` | JSON。 |

:::warning Attention

`BLOB`、`BFILE` et les autres types d’objets binaires ne sont pas automatiquement utilisés comme champs de fichiers ordinaires. Si vous devez gérer des pièces jointes dans les pages, il est généralement recommandé d’utiliser dans NocoBase une table de fichiers ou un champ de pièces jointes pour enregistrer les métadonnées des fichiers.

:::

## Clé primaire et identifiant unique des enregistrements

Pour les tables de données utilisées dans les blocs de page pour l’affichage et la modification, il est recommandé de disposer d’une clé primaire ou d’un champ unique. NocoBase utilise en priorité la clé primaire comme identifiant unique de l’enregistrement.

Si la source connectée est une vue, une table sans clé primaire ou une table avec une clé primaire composite, vous devez définir manuellement le « Record unique key » dans la configuration de la table de données. En l’absence d’identifiant unique disponible, les blocs de page peuvent ne pas permettre d’afficher, de modifier ou de supprimer correctement les enregistrements.

![20260709210948](https://static-docs.nocobase.com/20260709210948.png)
![20260709211004](https://static-docs.nocobase.com/20260709211004.png)

## Liens associés

- [Base de données externe](./index.md) — Consulter les informations générales sur la configuration et la gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consulter l’accès aux sources de données et leur mode de gestion
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consulter les informations sur les types de champs et leur correspondance
- [Documentation d’initialisation de node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) — Consulter le mode de chargement des bibliothèques Oracle Client