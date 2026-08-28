---
pkg: "@nocobase/plugin-data-source-main"
title: "Vues de base de données"
description: "Connecter des vues déjà existantes dans une base de données comme sources de données, puis configurer les champs et leur affichage dans NocoBase, pour gérer visuellement les résultats de requêtes complexes."
keywords: "Vue de base de données,Collection View,vue"
---
# Connexion à une vue de base de données

## Présentation

Connectez des vues présentes dans la base de données, par exemple une vue de rapports financiers maintenue par le DBA, une vue de clients filtrée ou une vue agrégée issue d'une synchronisation entre plusieurs systèmes. Cette fonctionnalité permet de réutiliser la logique de requête déjà définie dans la base de données.

:::tip Conseil

Les vues ordinaires appartenant au périmètre du propriétaire du compte de connexion à la base de données principale sont prises en charge, mais pas les vues matérialisées. Même si ce compte dispose d'un droit de lecture sur les vues d'autres propriétaires, celles-ci n'apparaîtront pas dans la liste des vues pouvant être connectées. Avant la connexion, vérifiez que les champs de la vue possèdent des noms de colonnes stables et que leurs types peuvent être identifiés par NocoBase.

:::

## Connexion à une vue de base de données

1. Dans le menu des sources de données des fonctionnalités système, accédez à la page d'accueil des sources de données.
2. Sélectionnez la source de données **Main** dans la liste, cliquez sur l'action « Configure » pour accéder à la base de données principale.
3. Dès la gestion de la base de données principale, cliquez sur « Create collection », puis sélectionnez « Connect to database view »

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![connect_view](https://static-docs.nocobase.com/connect_view.png)
![connect_view_configure](https://static-docs.nocobase.com/connect_view_configure.png)

| Configuration | Description |
| --- | --- |
| Collection display name | Nom sous lequel la vue de base de données s'affiche dans l'interface, par exemple « Vue des rapports financiers » ou « Vue des statistiques clients ». Il est recommandé d'utiliser un nom indiquant clairement l'objectif de la vue. |
| Collection name | Nom d'identification de la vue de base de données dans NocoBase, utilisé pour les références internes des API, des champs de relation, des autorisations, des workflows, etc. Il est généré automatiquement, mais peut être modifié manuellement ; seuls les lettres, les chiffres et les traits de soulignement sont acceptés, et le nom doit commencer par une lettre. |
| Database view | Sélectionnez la vue de base de données à connecter. La structure des champs et les résultats de la requête sont lus depuis la vue. Lors de la modification, vous pouvez consulter la view actuellement connectée, mais vous ne pouvez pas la remplacer par une autre view. |
| Categories | Catégorie de la table de données. Elle affecte uniquement l'organisation de l'interface de gestion des tables de données et ne modifie pas la vue de base de données elle-même. |
| Description | Description de la table de données. Il est recommandé d'indiquer clairement qui maintient cette view, quelles données sont interrogées et dans quelles pages ou quels rapports elle est utilisée. |
| Use simple pagination mode | Mode de pagination simple. Une fois activé, la pagination des blocs de tableau ignore le comptage du nombre total d'enregistrements. Ce mode convient aux vues contenant de grandes quantités de données et permet de réduire la charge des requêtes. |
| Record unique key | Identifiant unique de l'enregistrement. Les vues de base de données n'ont généralement pas de clé primaire ; vous devez sélectionner un champ permettant d'identifier chaque enregistrement de manière unique, faute de quoi leur consultation ou leur modification dans les blocs pourrait être incorrecte. |
| Source collections | Sources des champs de la vue de base de données. Cette option permet d'associer les champs de la vue à ceux des tables de données existantes, afin d'aider NocoBase à identifier les types de champs et les types d'interface. |
| Fields | Configuration de la correspondance des champs. Elle permet de confirmer, pour chaque champ de la vue, son nom, son titre, son type de données et son type d'interface. |
| Preview | Aperçu des résultats de la vue de base de données. Avant l'envoi, vous pouvez vérifier que la correspondance des champs et le rendu correspondent aux attentes. |
| Allow add new, update and delete actions | Indique s'il est possible d'effectuer des opérations d'ajout, de mise à jour et de suppression sur la vue de base de données. Une fois cette option activée, NocoBase affiche les points d'entrée correspondants dans les pages ; la réussite de l'écriture dépend toutefois du fait que la view soit inscriptible et que le compte de base de données dispose des autorisations insert, update et delete. |

:::tip Conseil

`Source collections` est la table de données source déduite à partir de la vue de base de données. Elle sert à identifier les tables de données existantes dont proviennent principalement les champs de la view et à limiter les choix disponibles de `Field source` lors de la correspondance des champs.

Le résultat de cette déduction sert à accélérer la configuration. Si la view contient des renommages de champs, des calculs, des agrégations ou des join complexes, le résultat peut être partiellement incorrect ou impossible à déduire. Il faudra alors effectuer une vérification manuelle dans `Fields`.

:::

### Correspondance des champs

La correspondance des champs est une configuration qui doit être confirmée après la connexion à une vue de base de données. Après la connexion de la view, NocoBase déduit d'abord la source et le type de base de données de chaque champ de la vue : lorsque le champ source peut être déduit, le Field type, le Field interface et le Field display name du champ existant sont automatiquement repris ; dans le cas contraire, un Field type initial est proposé en fonction du type de champ de la base de données, et le type de champ ainsi que la configuration de l'interface doivent être confirmés manuellement.
[En savoir plus sur la configuration des champs](../data-modeling/collection-fields/index.md)

![connect_view_configure_field_source](https://static-docs.nocobase.com/connect_view_configure_field_source.png)
![connect_view_configure_field_interface](https://static-docs.nocobase.com/connect_view_configure_field_interface.png)

| Configuration | Description |
| --- | --- |
| Field source | Sélectionnez la table de données et le champ existants dont provient le champ de la vue. Une fois la source sélectionnée, NocoBase peut réutiliser le Field type et le Field interface du champ d'origine. |
| Field type | Si le champ de la vue n'a pas de source clairement identifiée, vous devez confirmer manuellement son type de données. |
| Field interface | Confirmez la manière dont le champ sera affiché et saisi dans les pages, par exemple comme texte sur une ligne, nombre, date ou option de liste déroulante. |
| Field display name | Nom sous lequel le champ s'affiche dans l'interface. Il est recommandé d'utiliser un nom compréhensible par les utilisateurs métier. |

Par exemple, si la vue renvoie `customer_name` et que celui-ci provient du champ « Nom du client » de la table des clients, vous pouvez l'associer au champ correspondant de cette table. NocoBase pourra ainsi réutiliser le titre, le type et la configuration d'interface du champ d'origine.

Si le champ de la vue provient d'un résultat agrégé ou calculé, par exemple `count(*) as total` ou `sum(amount) as amount_total`, il faut généralement sélectionner manuellement le Field type et un Field interface approprié.

:::tip Conseil

`Field source` provient de la déduction effectuée par NocoBase sur la vue de base de données et indique à quel champ existant un champ de la vue pourrait correspondre. Lorsqu'un champ possède `Field source`, NocoBase réutilise en priorité le Field type et le Field interface du champ source.

Si le champ source ne peut pas être déduit ou si le résultat ne correspond pas à la signification métier, supprimez `Field source`, puis sélectionnez manuellement `Field type` ainsi que `Field interface` et `Field display name`.

:::

### Identifiant unique de l'enregistrement

Une vue de base de données doit être configurée avec un Record unique key ; sinon, il sera impossible de créer des blocs dans les pages et de consulter ou de modifier correctement les enregistrements. Vous pouvez sélectionner un seul champ ou une combinaison de plusieurs champs comme identifiant unique. Les champs adaptés comme Record unique key remplissent généralement les conditions suivantes :

- La valeur du champ est unique
- La valeur du champ est stable et ne change pas en fonction du tri, de la pagination ou de la méthode de calcul
- Le champ n'est pas vide
- Le champ est toujours renvoyé par la view

Si la view provient d'une requête sur une seule table, il est préférable de renvoyer la clé primaire de la table d'origine. Si la view provient d'un join entre plusieurs tables ou d'une agrégation, vous pouvez conserver dans la vue de base de données un ID métier stable ou faire générer par la base de données un champ unique stable.

### Autoriser les opérations d'ajout, de mise à jour et de suppression

Si la database view prend en charge les écritures, vous pouvez activer « Allow add new, update and delete actions ». NocoBase autorisera alors l'ajout, la mise à jour et la suppression d'enregistrements dans cette vue depuis les pages.

Les vues de base de données sont davantage destinées à être utilisées comme résultats de requêtes et sont traitées en lecture seule par défaut. Il est recommandé d'activer cette option uniquement après avoir confirmé que la database view prend en charge les opérations d'écriture correspondantes et que les autorisations de la base de données permettent également ces écritures.

### Aperçu des résultats de la vue

Avant l'envoi, utilisez Preview pour consulter les résultats de la requête de la vue. Lors de l'aperçu, vérifiez en particulier :

- que la view peut être interrogée correctement
- que tous les champs sont présents
- que les types de champs et d'interfaces correspondent à leur signification métier
- que le Record unique key existe et que les données sont uniques
- si les types de champs non pris en charge doivent être ajustés côté base de données

![connect_view_configure_preview](https://static-docs.nocobase.com/connect_view_configure_preview.png)

## Configurer les champs

Après la création de la vue de base de données, cliquez sur « Configure fields » à droite de la vue dans la liste des tables de données pour accéder à la page de configuration des champs. Cette configuration sert à gérer les champs présents dans la vue, leur affichage dans l'interface et la correspondance entre les champs de la database view et le Field type et le Field interface de NocoBase.

Les champs ordinaires d'une vue de base de données proviennent de la database view. NocoBase ne crée, ne modifie et ne supprime pas directement de colonnes réelles dans la view. Dans la page de configuration des champs, seuls les champs de relation plusieurs-à-un peuvent être ajoutés afin de compléter les relations métier dans NocoBase. Une vue de base de données ne peut pas être utilisée comme table de données cible d'un champ de relation ; il n'est généralement pas nécessaire de configurer un champ titre.

[En savoir plus sur la configuration des champs](../data-modeling/collection-fields/index.md)

![configure_view](https://static-docs.nocobase.com/configure_view.png)

### Ajouter un champ de relation

Une vue de base de données permet uniquement d'ajouter des champs de relation plusieurs-à-un. Ceux-ci peuvent associer des champs existants de la view à la clé primaire ou à un champ unique de la table de données cible. Ils servent à afficher les enregistrements associés dans les pages, mais ne créent ni champ réel ni contrainte de clé étrangère dans la database view.

Cliquez sur « Add field » pour ajouter un champ de relation plusieurs-à-un.

[En savoir plus sur la configuration des champs](../data-modeling/collection-fields/index.md)

![add_view_field](https://static-docs.nocobase.com/add_view_field.png)
![add_view_field_configure](https://static-docs.nocobase.com/add_view_field_configure.png)

| Configuration | Description |
| --- | --- |
| Field display name | Nom sous lequel le champ de relation plusieurs-à-un s'affiche dans l'interface. Il est recommandé d'utiliser un nom compréhensible par les utilisateurs métier, par exemple « Client associé » ou « Commande associée ». |
| Field name | Nom d'identification sous lequel le champ de relation plusieurs-à-un est enregistré dans NocoBase, utilisé pour les références internes des API, des autorisations, des workflows, etc. |
| Source collection | Table de données source, c'est-à-dire la table de données de la vue de base de données actuelle. Elle sert à déterminer à partir de quel champ de table de données sélectionner `Foreign key` ; lors de l'ajout d'un champ de relation plusieurs-à-un à une vue de base de données, elle reste généralement la view actuelle. |
| Target collection | Table de données cible à associer. Il s'agit généralement d'une table de données ordinaire, d'une table d'une base de données externe ou d'une autre table réelle ; une vue de base de données ne peut pas être sélectionnée. |
| Foreign key | Champ de la vue de base de données actuelle utilisé pour enregistrer l'identifiant de l'enregistrement cible. Ce champ doit être renvoyé de manière stable dans les résultats de la requête de la view. |
| Target key | Champ de la table de données cible mis en correspondance avec `Foreign key`, généralement la clé primaire ou un champ unique. |
| Description | Description du champ. Vous pouvez y indiquer la signification de la relation, la source des données, le mode de maintenance ou les précautions particulières. |

### Correspondance des champs

Après la connexion de la vue de base de données, NocoBase déduit le Field type à partir des champs de la view et de leurs champs sources, puis lui associe un Field interface par défaut. Si la source du champ, son mode d'affichage ou sa signification métier ne correspondent pas aux attentes, vous pouvez ajuster la correspondance dans la configuration du champ.

[En savoir plus sur la configuration des champs](../data-modeling/collection-fields/index.md)

![edit_view_field_configure](https://static-docs.nocobase.com/edit_view_field_configure.png)

:::tip Conseil

- Field interface (type d'interface / type d'UI) : détermine la manière dont le champ est affiché et utilisé dans l'interface. Il peut s'agir, par exemple, d'un « texte sur une ligne », d'un « nombre », d'un « menu déroulant » ou d'une « date et heure ». Il correspond à la classification du champ du point de vue de l'utilisateur.
- Field type (type de données) : détermine la manière dont NocoBase identifie le type de données du champ. Pour les champs de view sans champ source, le type est généralement déduit du type de champ de la base de données, par exemple `string`, `integer`, `decimal`, `boolean`, `datetime`, etc.

:::

:::warning Attention

Modifier le Field source, le Field type ou le Field interface ne revient pas à modifier le type de champ de la database view. Ces paramètres influencent principalement le mode d'affichage dans les pages, les règles de validation et la manière dont NocoBase identifie le champ.

:::

### Synchroniser depuis la base de données

Si la structure des champs de la view est modifiée côté base de données, accédez à « Configure fields », puis cliquez sur « Sync from database » pour relire la structure des champs. Après la synchronisation, NocoBase met à jour les champs : il ajoute les nouveaux champs apparus dans la view, supprime ceux qui ont été supprimés de la view et reconfirme les types et les sources des champs.

![edit_view_sync_from_database](https://static-docs.nocobase.com/edit_view_sync_from_database.png)
![edit_view_sync_from_database_configure](https://static-docs.nocobase.com/edit_view_sync_from_database_configure.png)

:::warning Attention

Lors de la synchronisation, le renommage d'un champ se traduit généralement par la « suppression de l'ancien champ + l'ajout du nouveau champ ». Avant la synchronisation, vérifiez si l'ancien champ est utilisé par des pages, des autorisations, des workflows ou des API externes, afin d'éviter une perte de configuration. Après la synchronisation, vérifiez également le Field type et le Field interface.

:::

### Modifier un champ

Cliquez sur « Edit » à droite d'un champ pour modifier sa configuration. La modification d'un champ permet d'ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom d'affichage, sa description, ses règles de validation ou sa configuration spécifique.
[En savoir plus sur la configuration des champs](../data-modeling/collection-fields/index.md)

![edit_field](https://static-docs.nocobase.com/edit_field.png)
![edit_field_configure](https://static-docs.nocobase.com/edit_field_configure.png)

:::warning Attention

La modification de la configuration d'un champ ne change ni le nom réel de la colonne, ni le type de champ, ni l'expression SQL, ni l'index dans la database view. Si vous devez modifier la structure réelle de la view, commencez par la modifier côté base de données, puis utilisez « Sync from database » pour la synchroniser.

:::

### Supprimer un champ

Cliquez sur « Delete » à droite d'un champ pour le supprimer. Cette action supprime uniquement le champ enregistré dans NocoBase et ne supprime pas la colonne réelle de la database view.

[En savoir plus sur la configuration des champs](../data-modeling/collection-fields/index.md)

![delete_field](https://static-docs.nocobase.com/delete_field.png)

:::warning Attention

La suppression d'un champ peut affecter les blocs de page, les conditions de filtrage, le tri, les autorisations, les workflows, les API et les configurations existantes. Avant de le supprimer, vérifiez qu'il n'est plus utilisé. Si la database view renvoie toujours cette colonne, NocoBase pourra de nouveau détecter ce champ lors d'une prochaine exécution de « Sync from database ».

:::

## Modifier une vue

La définition SQL d'une vue de base de données est gérée côté base de données. Dans la liste des tables de données, cliquez sur « Edit » à droite d'une vue de base de données pour modifier ses métadonnées et sa configuration d'exécution dans NocoBase ; cette action ne modifie pas la view dans la base de données. Si vous devez connecter une autre database view, il est recommandé de créer une nouvelle table de données de vue de base de données.

![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

| Configuration | Description |
| --- | --- |
| Collection display name | Nom sous lequel la vue de base de données s'affiche dans l'interface. Vous pouvez le remplacer par un nom compréhensible par les utilisateurs métier, par exemple « Vue des rapports financiers » ou « Vue des statistiques clients ». |
| Collection name | Nom d'identification de la vue de base de données dans NocoBase. Il ne peut pas être modifié lors de l'édition. |
| Database view | Database view actuellement connectée. Ce champ est en lecture seule lors de l'édition et ne peut pas être remplacé par une autre view. |
| Categories | Catégorie de la table de données. Elle affecte uniquement l'organisation de l'interface de gestion des sources de données et ne modifie pas la database view. |
| Description | Description de la table de données. Vous pouvez y indiquer le responsable de la view, la source de la requête, ainsi que les pages ou les rapports qui l'utilisent. |
| Use simple pagination mode | Mode de pagination simple. Une fois activé, la pagination des blocs de tableau ignore le comptage du nombre total d'enregistrements. Ce mode convient aux view contenant de grandes quantités de données. |
| Record unique key | Identifiant unique de l'enregistrement. Il sert à localiser un enregistrement ; on sélectionne généralement un champ ou une combinaison de champs dont les valeurs sont stables et uniques dans la view. |
| Allow add new, update and delete actions | Indique s'il est possible d'ajouter, de mettre à jour et de supprimer des enregistrements. Cette option est recommandée uniquement si la database view prend elle-même en charge les écritures et si le compte de base de données dispose des autorisations correspondantes. |

:::warning Attention

Après avoir modifié le Record unique key ou Allow add new, update and delete actions, vérifiez à nouveau que les blocs de page, les autorisations et les workflows correspondent toujours aux attentes.

:::

## Supprimer une vue

Dans la liste des tables de données, cliquez sur « Delete » à droite d'une vue de base de données pour supprimer la table de données correspondante. Cette action supprime uniquement la configuration de connexion et les champs dans NocoBase ; elle ne supprime pas la view dans la base de données.

Les vues de base de données de la base de données principale peuvent également être sélectionnées en lot, puis supprimées en une seule fois. Avant la suppression, vérifiez que les blocs de page, les graphiques, les autorisations, les workflows et les API externes n'utilisent plus cette table de données de vue de base de données.
![delete_view](https://static-docs.nocobase.com/delete_view.png)
![delete_view_second_confirmation](https://static-docs.nocobase.com/delete_view_second_confirmation.png)