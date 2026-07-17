---
title: "Pièce jointe"
description: "Le champ Pièce jointe permet de téléverser et d'associer des fichiers, dont les métadonnées sont enregistrées dans la table des fichiers."
keywords: "Pièce jointe,attachment,téléversement de fichiers,table des fichiers,NocoBase"
---

# Pièce jointe (obsolète)

## Présentation

:::warning Attention

Le champ Pièce jointe est obsolète. Il est recommandé d'utiliser le champ [Table des fichiers](./file-collection.md) ou [URL de pièce jointe](../field-attachment-url/index.md).

:::

Dans NocoBase, **Pièce jointe (Attachment)** permet de téléverser des fichiers et d'associer leurs enregistrements à l'enregistrement métier courant.

Le champ Pièce jointe est généralement associé à une table des fichiers. Le fichier lui-même est conservé par le moteur de stockage des fichiers, tandis que son nom, sa taille, son URL, son type MIME et autres métadonnées sont enregistrés dans la table des fichiers.

Pour enregistrer uniquement un lien vers un fichier externe, choisissez [URL de pièce jointe](../field-attachment-url/index.md) ou [URL](../data-modeling/collection-fields/basic/url.md).

## Cas d'utilisation

Le champ Pièce jointe convient aux scénarios métier suivants :

- Pièces jointes de contrats, factures et justificatifs de remboursement
- Images de produits, pièces d'identité des employés et documents de projet
- Captures d'écran de tickets et pièces jointes liées aux problèmes
- Plusieurs fichiers associés à un enregistrement métier

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Pièce jointe » pour créer un champ Pièce jointe.

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d'interface du champ. Le champ Pièce jointe correspond à `attachment`, qui détermine la manière dont les données sont saisies et affichées dans la page. |
| Field display name | Nom affiché du champ dans l'interface, par exemple « Pièces jointes du contrat », « Fichier de facture » ou « Image du produit ». Il est recommandé d'utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d'identification du champ, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il n'est généralement plus modifié après sa création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Un champ Pièce jointe est généralement un champ de relation associé aux enregistrements de fichiers de la table des fichiers. |
| Default value | Valeur par défaut. Lors de la création d'un enregistrement, si l'utilisateur ne renseigne aucune valeur, une valeur par défaut peut être ajoutée automatiquement. |
| Validation rules | Règles de validation. Elles peuvent définir si le champ est obligatoire ; le nombre, la taille et le type des fichiers sont généralement contrôlés par le composant de téléversement ou la configuration du stockage des fichiers. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez le nom avant la création afin d'éviter des coûts d'ajustement de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Pièce jointe est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `attachment`. |
| Field type par défaut | `belongsToMany`. |
| Field type disponible | `belongsToMany` et autres types de relation, selon la configuration du champ de fichier. |
| Composant de page | Le mode édition utilise le composant de téléversement de pièces jointes. |
| Filtrage | Le filtrage s'effectue généralement selon que le champ est vide ou qu'il contient des fichiers associés. |
| Tri | Généralement non utilisé pour le tri. |
| Validation | Les validations de base, comme le caractère obligatoire, sont prises en charge ; les limites de téléversement dépendent de la configuration du composant. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Pièce jointe. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration dédiée.

Si le champ provient d'une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est mappé vers un Field type et un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l'interface sans changer son nom d'identification. |
| Field name | Non | Le nom d'identification du champ ne peut généralement pas être modifié dans le formulaire d'édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage des champs. La modification affecte la manière dont les données sont saisies, affichées et validées dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage des champs. Avant toute modification, il faut vérifier que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables sont utilisées dans les workflows. Lorsque les données existantes sont nombreuses, vérifiez d'abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Pièce jointe. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs, puis les supprimer en bloc.

Lors de la suppression d'un champ Pièce jointe créé dans la base de données principale, la colonne réelle correspondante ainsi que les données qu'elle contient sont généralement supprimées de la base de données. Lors de la suppression d'un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l'étendue des répercussions dépend de la source de données et de l'origine du champ concernés.

:::danger Avertissement

La suppression d'un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de supprimer un champ, vérifiez qu'il n'est plus référencé par les configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ Pièce jointe convient aux formulaires, aux détails et aux scénarios de gestion de fichiers.
![20260709231642](https://static-docs.nocobase.com/20260709231642.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Téléverser un ou plusieurs fichiers. |
| Bloc de détails | Consulter, prévisualiser ou télécharger des pièces jointes. |
| Bloc de tableau | Afficher le nombre de pièces jointes ou un point d'accès aux pièces jointes. |
| Workflow | Utiliser les pièces jointes comme fichiers associés à une approbation, une notification ou une exportation. |

## Liens associés

- [Champ](../index.md) — découvrir le rôle, la classification et la logique de mappage des champs
- [Table standard](../data-source-main/general-collection.md) — créer et gérer des champs dans une table standard
- [Table des fichiers](./file-collection.md) — découvrir comment les métadonnées des fichiers sont enregistrées
- [URL de pièce jointe](../field-attachment-url/index.md) — enregistrer l'adresse d'un fichier externe
- [URL](../data-modeling/collection-fields/basic/url.md) — enregistrer un lien standard
