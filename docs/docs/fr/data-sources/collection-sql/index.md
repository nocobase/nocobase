---
pkg: "@nocobase/plugin-collection-sql"
title: "Table SQL"
description: "Créez une table de données à partir des résultats d’une requête SQL, configurez la source des champs, leur mappage et l’identifiant unique des enregistrements, pour les requêtes associées, les statistiques et l’affichage de rapports."
keywords: "Table SQL,collection SQL,requête SQL,mappage des champs,rapport,NocoBase"
---

#  Table SQL

## Présentation

Rédigez une requête SQL pour former une table SQL. Cela ne crée pas de véritable table dans la base de données : les résultats de la requête sont lus afin de pouvoir être utilisés dans les tableaux, les vues détaillées, les graphiques et les workflows. Cas d’utilisation : données agrégées et rapports statistiques.

:::warning Attention

 Les tables SQL prennent uniquement en charge les instructions `SELECT` ou les instructions `WITH ... SELECT`. Elles permettent uniquement d’afficher les résultats des requêtes et ne prennent pas en charge la création, la modification ni la suppression de données.

:::

## Créer une table SQL

1. Dans les fonctionnalités système, cliquez sur le menu des sources de données pour accéder à la page d’accueil des sources de données.
2. Sélectionnez la source de données **Main** dans la liste, puis cliquez sur l’action « Configure » pour accéder à la base de données principale.
3. Dés la gestion de la base de données principale, cliquez sur « Create collection », puis sélectionnez « SQL collection ».

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![create_sql_collection](https://static-docs.nocobase.com/create_sql_collection.png)
![create_sql_collection_configure](https://static-docs.nocobase.com/create_sql_collection_configure.png)

| Configuration | Description |
| --- | --- |
| Collection display name | Nom sous lequel la table SQL s’affiche dans l’interface, par exemple « Synthèse des ventes » ou « Alerte de stock ». Il est recommandé d’utiliser un nom qui décrit la signification des résultats de la requête. |
| Collection name | Nom d’identification de la table SQL dans NocoBase, utilisé pour les références internes telles que les API, les champs de relation, les permissions et les workflows. Il est généré automatiquement, mais peut être modifié manuellement ; seuls les lettres, les chiffres et les traits de soulignement sont acceptés, et le nom doit commencer par une lettre. |
| Categories | Catégorie de la table de données. Elle affecte uniquement l’organisation de l’interface de gestion des tables de données et ne modifie pas la requête SQL. |
| Description | Description de la table de données. Il est recommandé d’indiquer clairement quelles données cette requête SQL récupère, qui la maintient et dans quelle page ou quel rapport elle est utilisée. |
| Record unique key | Identifiant unique des enregistrements. Les résultats d’une requête SQL ne possèdent pas de véritable clé primaire ; vous devez sélectionner un champ ou une combinaison de champs permettant d’identifier chaque enregistrement de manière unique, faute de quoi l’affichage des enregistrements dans les blocs peut être incorrect. |
| SQL | Requête utilisée par la table SQL. NocoBase exécute cette requête SQL, configure les champs à partir des résultats, puis utilise ces résultats comme une table de données. |
| Source collections | Source des champs des résultats de la requête SQL. Elle permet d’associer les champs des résultats aux champs des tables de données existantes et aide NocoBase à identifier leur origine et leur type d’interface. |
| Fields | Configuration du mappage des champs. Elle permet de confirmer le nom, la source, le type d’interface et le nom d’affichage de chaque champ. |
| Preview | Aperçu des résultats de la requête SQL. Avant de soumettre la configuration, vous pouvez vérifier que le mappage des champs et l’affichage correspondent à vos attentes. |

### Rédiger une requête SQL

Saisissez une requête SQL, puis cliquez sur « Execute » pour l’exécuter et tenter d’analyser les champs renvoyés ainsi que les tables de données sources.
Le bouton « Execute » sert uniquement à exécuter l’aperçu et à analyser les champs. Après avoir vérifié que la requête SQL est valide, cliquez sur « Confirm » pour que le formulaire puisse soumettre cette requête comme requête confirmée.

![execute_sql_statement](https://static-docs.nocobase.com/202405191453556.png)

:::tip Conseil

`Source collections` correspond aux tables de données sources déduites de la requête SQL. Les principales tables de données existantes dont proviennent les champs des résultats sont identifiées, ce qui limite les choix disponibles de `Field source` lors du mappage des champs.

Le résultat de cette déduction sert à accélérer la configuration. En présence d’alias, de sous-requêtes, de champs calculés, de fonctions d’agrégation ou de jointures complexes dans la requête SQL, le résultat peut être partiellement inexact ou impossible à déduire. Vous pouvez alors spécifier manuellement `Source collections`.

:::

### Mappage des champs

Le mappage des champs est une configuration qui doit être confirmée après la création d’une table SQL. Les résultats de la requête SQL indiquent uniquement à NocoBase quelles colonnes ont été renvoyées. Pour que ces colonnes puissent être utilisées comme des champs ordinaires dans l’interface, vous devez également confirmer `Field source` ou configurer `Field interface` ainsi que le nom d’affichage du champ.
[En savoir plus sur la configuration des champs](../data-modeling/collection-fields/index.md)

![configure_sql_field_source](https://static-docs.nocobase.com/202405191453579.png)
![configure_sql_field_interface](https://static-docs.nocobase.com/202405191454703.png)

| Configuration | Description |
| --- | --- |
| Field source | Sélectionnez la table de données et le champ existants dont provient le champ des résultats de la requête SQL. Une fois la source sélectionnée, NocoBase peut réutiliser le Field interface du champ d’origine. |
| Field interface | Confirmez la manière dont le champ s’affiche et accepte les saisies dans la page, par exemple sous forme de texte sur une ligne, de nombre, de date ou d’option déroulante. |
| Field display name | Nom sous lequel le champ s’affiche dans l’interface. Il est recommandé d’utiliser un nom compréhensible par les utilisateurs métier. |

Par exemple, si la requête SQL renvoie `customers.name as customer_name`, provenant du champ « Nom du client » de la table des clients, vous pouvez le mapper au champ correspondant de la table des clients. NocoBase pourra ainsi réutiliser le titre et la configuration d’interface du champ d’origine.

Si un champ provient d’un résultat calculé, comme `count(*) as total` ou `sum(amount) as amount_total`, il n’a généralement pas de champ source clairement défini. Vous devez alors sélectionner manuellement un Field interface approprié.

:::tip Conseil

`Field source` dépend de `Source collections`. La sélection préalable de la table de données source est nécessaire pour que les champs sources disponibles dans cette table apparaissent dans le tableau de mappage.

Lorsque la déduction des champs contient `Field source`, NocoBase réutilise en priorité le Field interface du champ source. Si le champ source ne peut pas être déduit, vous pouvez spécifier manuellement `Field source` ; si le résultat de la déduction ne correspond pas à la signification métier, vous devez supprimer `Field source`, puis spécifier manuellement `Field source`, ou sélectionner manuellement `Field interface` et configurer `Field display name`.

:::

### Identifiant unique des enregistrements

Une table SQL doit être configurée avec un Record unique key. Sinon, il est impossible de créer des blocs dans les pages et d’afficher correctement les enregistrements. Vous pouvez sélectionner un champ ou une combinaison de plusieurs champs comme identifiant unique. Les champs adaptés au rôle de Record unique key remplissent généralement les conditions suivantes :

- Chaque ligne des résultats de la requête est unique
- La valeur du champ est stable et ne change pas en fonction de la pagination, du tri ou de l’évolution du périmètre statistique
- Le champ n’est pas vide
- Le champ est toujours renvoyé dans les résultats de la requête

Si les résultats proviennent d’une seule table, il est préférable de renvoyer la clé primaire de la table d’origine. S’ils proviennent de jointures entre plusieurs tables ou d’agrégations, vous pouvez conserver dans la requête SQL un identifiant métier stable, ou renvoyer plusieurs champs permettant d’identifier conjointement l’enregistrement.

:::warning Attention

N’utilisez pas des valeurs telles que `row_number()`, qui varient en fonction du tri, des filtres ou du périmètre statistique, comme Record unique key stable à long terme. Une modification de l’identifiant unique peut empêcher les blocs de page, les permissions, les workflows et les API externes de retrouver le même enregistrement.

:::

### Aperçu des résultats de la requête

Avant de soumettre la configuration, utilisez Preview pour consulter les résultats de la requête SQL. Lors de l’aperçu, vérifiez notamment :

- La requête SQL s’exécute correctement
- Les champs renvoyés sont complets
- Le Field interface et le nom d’affichage correspondent à la signification métier
- Le Record unique key existe et les données sont uniques
- Les résultats de la requête conviennent à l’affichage dans la page

![preview_sql_collection](https://static-docs.nocobase.com/202405191455439.png)

## Configurer les champs

Après la création de la table SQL, cliquez sur « Configure fields » à droite de la table SQL dans la liste des tables de données pour accéder à la page de configuration des champs. Cette configuration sert à gérer les champs de la table SQL, leur affichage dans l’interface et le mappage des résultats de la requête SQL vers le Field interface de NocoBase.
[En savoir plus sur la configuration des champs](../data-modeling/collection-fields/index.md)

### Changer le type d’interface

Après la création de la table SQL, vous pouvez toujours ajuster la configuration d’interface des champs. La page de configuration des champs sert principalement à changer le Field interface, à modifier le nom d’affichage et la description, ainsi que la configuration propre au champ.
![configure_field_sql](https://static-docs.nocobase.com/configure_field_sql.png)

Cette page est particulièrement adaptée aux situations suivantes :

- Lors de la création de la table SQL, le Field interface défini n’est pas correct
- Le nom d’affichage du champ ne correspond pas aux habitudes métier et doit être remplacé par un nom plus compréhensible
- La signification métier du champ renvoyé par la requête a changé et le mode d’affichage doit être confirmé à nouveau
- La description ou la configuration propre au champ doit être ajustée, par exemple les options déroulantes

### Synchroniser depuis la base de données

Si la requête SQL n’a pas changé, mais que la structure de la table de données sous-jacente ou ses champs ont été modifiés, accédez à « Configure fields », puis cliquez sur « Sync from database » pour réexécuter la requête SQL et synchroniser les champs. Pour le mappage des champs, consultez [« Créer une table SQL »](#字段映射).

![sync_sql_collection_fields](https://static-docs.nocobase.com/202405191456216.png)

### Modifier un champ

Cliquez sur « Edit » à droite d’un champ pour modifier sa configuration. La modification d’un champ permet d’ajuster sa présentation et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, ses règles de validation ou sa configuration propre.
[En savoir plus sur la configuration des champs](../data-modeling/collection-fields/index.md)

:::warning Attention

La modification de la configuration d’un champ ne change ni la requête SQL, ni le nom du champ de la table source, ni la définition du champ source, ni les index de la base de données. Si vous devez modifier les colonnes réelles renvoyées par la requête, modifiez d’abord la requête SQL, puis réexécutez-la et synchronisez les champs.

:::

### Supprimer un champ

Cliquez sur « Delete » à droite d’un champ pour supprimer ce champ. La suppression d’un champ retire uniquement le champ enregistré dans NocoBase ; elle ne supprime ni la requête SQL ni la colonne réelle de la table de données source.
[En savoir plus sur la configuration des champs](../data-modeling/collection-fields/index.md)

:::warning Attention

La suppression d’un champ peut affecter les blocs de page, les conditions de filtrage, le tri, les permissions, les workflows, les API et les configurations existantes. Avant de le supprimer, vérifiez qu’il n’est plus utilisé. Si la requête SQL renvoie toujours cette colonne, NocoBase peut l’identifier à nouveau lors de l’exécution ultérieure de « Sync from database ».

:::

## Modifier une table SQL

Dans la liste des tables de données, cliquez sur « Edit » à droite d’une table SQL pour modifier ses métadonnées et sa configuration d’exécution dans NocoBase. Les options de configuration sont pour l’essentiel les mêmes que lors de la création d’une table SQL, à l’exception de `Collection name` qui ne peut pas être modifié.

Si la requête SQL est modifiée, cliquez à nouveau sur « Execute », puis confirmez le mappage des champs, le Record unique key et les résultats de l’aperçu.

![edit_sql_collection](https://static-docs.nocobase.com/202405191455302.png)

:::warning Attention

La modification de la requête SQL peut entraîner des changements dans les noms de champs, le mappage des champs ou le Record unique key. Après la modification, vérifiez à nouveau que les blocs de page, les graphiques, les permissions et les workflows fonctionnent toujours correctement.

:::

## Supprimer une table SQL

Dans la liste des tables de données, cliquez sur « Delete » à droite d’une table SQL. Cette action supprime uniquement la configuration et les champs de la table SQL dans NocoBase ; elle ne supprime ni la table source sous-jacente ni les données qu’elle contient.
Vous pouvez également sélectionner plusieurs tables et les supprimer simultanément. Avant la suppression, vérifiez que les blocs de page, les graphiques, les permissions, les workflows et les API externes n’utilisent plus cette table SQL.