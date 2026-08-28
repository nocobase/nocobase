---
title: "Nano ID"
description: "Le champ Nano ID sert à générer des identifiants uniques aléatoires plus courts."
keywords: "Nano ID,nanoid,identifiant unique,NocoBase"
---

# Nano ID

## Présentation

Dans NocoBase, **Nano ID (Nano ID)** sert à générer des identifiants uniques aléatoires courts.

Nano ID convient aux scénarios nécessitant des identifiants sous forme de chaînes courtes, tels que les liens courts, les numéros publics et les identifiants de référence externes.

Pour une clé primaire interne par défaut, l’ID Snowflake est généralement plus direct. Pour un numéro métier lisible, choisissez la [séquence](../../../field-sequence/index.md).

## Scénarios d’utilisation

Nano ID convient aux scénarios métier suivants :

- Identifiants de liens courts
- Identifiants de partage publics
- Numéros de référence externes
- Chaînes aléatoires uniques plus courtes

## Créer une configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Nano ID » pour créer un champ Nano ID.

![20240512173225](https://static-docs.nocobase.com/20240512173225.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Nano ID correspond à `nanoId`, qui détermine la manière dont le champ est saisi et affiché dans l’interface. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « ID de partage », « ID public » ou « Identifiant court ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les API, les champs de relation, les permissions, les workflows et autres références internes. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les underscores, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Nano ID utilise par défaut `string`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’a rien saisi. |
| Validation rules | Généralement générées automatiquement par le système ; aucune validation manuelle n’est nécessaire. |
| Description | Description du champ. Elle peut préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les permissions, les workflows et les API. Vérifiez la nomenclature avant la création afin d’éviter des coûts de reconfiguration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Nano ID est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `nanoId`. |
| Field type par défaut | `string`. |
| Field type disponible en option | `string`. |
| Composant de page | Généralement généré automatiquement, aucune saisie manuelle n’est nécessaire. |
| Filtrage | Prend en charge la recherche exacte par Nano ID. |
| Tri | Le Nano ID n’est généralement pas utilisé pour le tri métier. |
| Validation | Généralement générée automatiquement et maintenue comme unique. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Nano ID. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou ses paramètres spécifiques.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer un mappage de champ, c’est-à-dire à mapper le champ de la base de données vers un Field type et un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifier le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | L’interface des champs de la base de données principale ou des champs synchronisés peut être ajustée lors du mappage. Cette modification affecte les méthodes de saisie, d’affichage et de validation sur la page. |
| Field type | Selon les conditions | Le type des champs de la base de données principale ou des champs synchronisés peut être ajusté lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Ajuster la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Ajuster les règles de validation du champ. |
| Description | Oui | Compléter la signification du champ, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas simplement à modifier un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables de workflow. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer le champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Nano ID. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en lot.

Lors de la suppression d’un champ Nano ID créé dans la base de données principale, la colonne réelle correspondante de la base de données ainsi que les données qu’elle contient sont généralement supprimées simultanément. Lors de la suppression d’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les permissions, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez que le champ n’est plus utilisé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ Nano ID convient aux identifiants courts publics et aux références externes.
![20260710151321](https://static-docs.nocobase.com/20260710151321.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Généralement non modifié manuellement, il est généré par le système. |
| Bloc de détails | Afficher l’identifiant court. |
| API | Servir d’identifiant public de l’enregistrement. |
| Lien externe | Servir de partie d’un lien court ou d’un lien de partage. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Snowflake ID](./snowflake-id.md) — Utiliser l’ID interne par défaut
- [UUID](./uuid.md) — Utiliser un UUID
- [Séquence](../../../field-sequence/index.md) — Générer un numéro métier lisible
