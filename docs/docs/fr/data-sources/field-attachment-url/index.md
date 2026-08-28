---
title: "URL de pièce jointe"
description: "Le champ URL de pièce jointe sert à enregistrer l’adresse d’un fichier externe, lorsque le fichier lui-même n’est pas téléversé."
keywords: "URL de pièce jointe,attachment url,fichier externe,URL,NocoBase"
---

# URL de pièce jointe

## Présentation

Dans NocoBase, **l’URL de pièce jointe (Attachment URL)** sert à enregistrer l’adresse d’accès à un fichier externe.

Le champ URL de pièce jointe convient lorsque le fichier est déjà stocké dans un système externe, un stockage d’objets ou un CDN, et qu’il suffit d’enregistrer son adresse d’accès dans NocoBase.

Si vous devez téléverser et gérer des fichiers avec NocoBase, choisissez [Pièce jointe](../file-manager/field-attachment.md). S’il s’agit simplement d’une adresse web classique, choisissez [URL](../data-modeling/collection-fields/basic/url.md).

## Cas d’utilisation

L’URL de pièce jointe convient notamment aux scénarios suivants :

- Adresses de fichiers stockés dans un stockage d’objets externe
- Adresses d’images sur un CDN
- Adresses de documents dans des systèmes tiers
- Liens vers des fichiers après migration de données historiques

## Créer une configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « URL de pièce jointe » pour créer un champ URL de pièce jointe.

![20241017092323](https://static-docs.nocobase.com/20241017092323.png)

![20241017092456](https://static-docs.nocobase.com/20241017092456.png)

![20241017092759](https://static-docs.nocobase.com/20241017092759.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. L’URL de pièce jointe correspond à `attachmentUrl` et détermine la manière dont la valeur est saisie et affichée sur la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Adresse du fichier », « URL de l’image » ou « Pièce jointe externe ». Il est recommandé d’utiliser un nom facilement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs relationnels, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Une URL de pièce jointe est généralement enregistrée avec `string` ou `text`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être automatiquement renseignée si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Vous pouvez configurer le format de l’URL, sa longueur ou son caractère obligatoire. |
| Description | Description du champ. Vous pouvez y préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera utilisé par les blocs de page, les autorisations, les workflows et les API. Vérifiez sa nomenclature avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ URL de pièce jointe est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `attachmentUrl`. |
| Field type par défaut | `string`. |
| Field type disponibles | `string` et `text`, selon la configuration réelle du champ. |
| Composant de page | En mode édition, un composant de saisie d’URL ou d’adresse de pièce jointe est utilisé. |
| Filtrage | Les filtres textuels et la vérification des valeurs vides sont pris en charge. |
| Tri | Généralement non utilisé pour le tri. |
| Validation | Les validations du format de l’URL, de la longueur et du caractère obligatoire sont prises en charge. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ URL de pièce jointe. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer une mise en correspondance : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Cette modification affecte la manière dont le champ est saisi, affiché et validé sur la page. |
| Field type | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Ajoute des précisions sur la signification du champ, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et l’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ URL de pièce jointe. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs pour les supprimer en bloc.

Lors de la suppression d’un champ URL de pièce jointe créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées simultanément. Pour un champ synchronisé depuis une base de données ou mis en correspondance avec une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Vérifiez avant la suppression que le champ n’est plus référencé par des configurations métier.

:::

## Utiliser le champ dans la configuration des pages

Le champ URL de pièce jointe convient à l’affichage et à l’accès à des fichiers externes.
![20260709231803](https://static-docs.nocobase.com/20260709231803.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Saisir l’adresse d’un fichier externe. |
| Bloc de détails | Afficher le lien vers le fichier. |
| Bloc de tableau | Afficher le lien ou un accès sous forme de miniature. |
| Workflow | Insérer l’adresse du fichier dans une notification ou une requête externe. |

## Liens associés

- [Champ](../index.md) — comprendre le rôle, la classification et la logique de mise en correspondance des champs
- [Table classique](../data-source-main/general-collection.md) — créer et gérer des champs dans une table classique
- [Pièce jointe](../file-manager/field-attachment.md) — téléverser et associer des fichiers NocoBase
- [URL](../data-modeling/collection-fields/basic/url.md) — enregistrer un lien classique.