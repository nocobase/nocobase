---
title: "Numéro de téléphone"
description: "Le champ Numéro de téléphone sert à enregistrer des numéros de téléphone, des coordonnées téléphoniques et d’autres textes liés au téléphone, avec validation du format."
keywords: "Numéro de téléphone,phone,téléphone,coordonnées,NocoBase"
---

# Numéro de téléphone

## Présentation

Dans NocoBase, le **Numéro de téléphone (Phone)** sert à enregistrer des numéros de téléphone ou des coordonnées téléphoniques.

Le champ Numéro de téléphone convient aux numéros de clients, de contacts, d’employés et autres coordonnées. Il est mieux adapté que le texte ordinaire pour représenter des données téléphoniques.

Si vous devez enregistrer plusieurs numéros ou des informations de contact complexes, vous pouvez utiliser le [texte multiligne](./textarea.md) ou créer une table de contacts séparée.

## Cas d’utilisation

Le champ Numéro de téléphone convient notamment aux scénarios suivants :

- Numéros de téléphone des clients et des contacts
- Numéros de téléphone des employés et numéros secondaires
- Numéros des magasins et lignes d’assistance
- Numéros destinés aux notifications par SMS

## Configuration lors de la création

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Numéro de téléphone » pour créer un champ de numéro de téléphone.

![20240512175526](https://static-docs.nocobase.com/20240512175526.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour un numéro de téléphone, il correspond à `phone` et détermine la manière dont la valeur est saisie et affichée dans la page. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Numéro de téléphone », « Coordonnées téléphoniques » ou « Ligne d’assistance ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les API, les champs de relation, les autorisations, les workflows et autres références internes. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Par défaut, le champ Numéro de téléphone est de type `string`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne remplit pas le champ. |
| Validation rules | Règles de validation. Vous pouvez configurer la longueur, une expression régulière ou rendre le champ obligatoire. |
| Description | Description du champ. Elle peut préciser la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ est référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez donc le nom avant la création afin d’éviter des coûts de reconfiguration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Numéro de téléphone est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `phone`. |
| Field type par défaut | `string`. |
| Field type disponibles | `string`. |
| Composant de page | En mode édition, un champ de saisie est utilisé et la validation du format du numéro peut être configurée. |
| Filtrage | Prend en charge les filtres de type texte, notamment contient, égal à, est vide et n’est pas vide. |
| Tri | Permet le tri dans les blocs de tableau. |
| Validation | Prend en charge la validation de la longueur, des expressions régulières, du caractère obligatoire, etc. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Numéro de téléphone. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte la manière dont les données sont saisies, affichées et validées dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables sont utilisées dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Numéro de téléphone. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer par lot.

Lors de la suppression d’un champ Numéro de téléphone créé dans la base de données principale, la colonne réelle correspondante et les données qu’elle contient sont généralement supprimées simultanément. Lorsqu’un champ provenant d’une synchronisation de base de données ou du mappage d’une source de données externe est supprimé, l’étendue des effets dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Vérifiez avant la suppression que le champ n’est plus référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ Numéro de téléphone convient aux formulaires, aux détails, aux filtres et aux notifications.
![20260709224555](https://static-docs.nocobase.com/20260709224555.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Saisir un numéro de téléphone ou des coordonnées téléphoniques. |
| Bloc de détails | Afficher les coordonnées. |
| Bloc de filtrage | Filtrer les enregistrements par numéro de téléphone ou par fragment de numéro. |
| Workflows et notifications | Servir de source de numéros pour les notifications par SMS ou par téléphone. |

## Liens associés

- [Champs](../index.md) — découvrir le rôle, les catégories et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — créer et gérer des champs dans une table ordinaire
- [Texte sur une ligne](./input.md) — enregistrer un texte court ordinaire
- [Adresse e-mail](./email.md) — enregistrer des adresses e-mail
