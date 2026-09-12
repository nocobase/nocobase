---
title: "URL"
description: "Le champ URL sert à enregistrer des adresses web, des liens vers des systèmes externes, des liens vers des documents et autres informations d’adresse."
keywords: "URL, lien, adresse web, url, NocoBase"
---

# URL

## Présentation

Dans NocoBase, **URL (URL)** sert à enregistrer des adresses web ou des liens.

Le champ URL convient aux adresses de systèmes externes, aux liens vers des documents, aux adresses de sites officiels, aux adresses de rappel, etc. Par rapport au texte ordinaire, il exprime plus clairement la sémantique d’un lien.

Pour téléverser un fichier, choisissez [Pièce jointe](../media/field-attachment.md). S’il s’agit simplement d’un texte descriptif ordinaire, choisissez [Texte sur une ligne](./input.md) ou [Texte multiligne](./textarea.md).

## Cas d’utilisation

Le champ URL convient aux cas d’utilisation suivants :

- Site officiel d’un client ou d’un fournisseur
- Lien vers la page de détails d’un système externe
- Lien vers un document contractuel ou une page de base de connaissances
- Adresse Webhook ou adresse de rappel

## Créer et configurer

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « URL » pour créer un champ URL.

![20240512175641](https://static-docs.nocobase.com/20240512175641.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. URL correspond à `url` et détermine la manière dont le champ est saisi et affiché sur la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Site officiel », « Lien vers le document » ou « Adresse externe ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les permissions, les workflows, etc. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Par défaut, le champ URL est de type `string`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Vous pouvez configurer le format, la longueur ou le caractère obligatoire de l’URL. |
| Description | Description du champ. Vous pouvez y indiquer sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Une fois créé, le nom du champ est référencé par les blocs de page, les permissions, les workflows et l’API. Vérifiez donc le nom avant la création afin d’éviter des coûts de reconfiguration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ URL est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `url`. |
| Field type par défaut | `string`. |
| Field type disponible | `string`. |
| Composant de page | En mode édition, un champ de saisie est utilisé ; en mode lecture, le contenu est généralement affiché sous forme de lien. |
| Filtrage | Prend en charge les filtres textuels, tels que contient, égal à, est vide ou n’est pas vide. |
| Tri | Le tri est pris en charge dans les blocs de tableau. |
| Validation | Prend en charge la validation du format et de la longueur de l’URL, ainsi que du caractère obligatoire. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou ses paramètres spécifiques.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est mappé vers un Field type et un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans modifier son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après la création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage des champs. Cette modification affecte la manière dont le champ est saisi, affiché et validé sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage des champs. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas simplement à modifier un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables de workflow sont utilisées. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ URL. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer par lot.

Lors de la suppression d’un champ URL créé dans la base de données principale, la colonne réelle correspondante dans la base de données ainsi que les données déjà présentes dans cette colonne sont généralement supprimées simultanément. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les permissions, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus utilisé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ URL convient aux pages de détails, aux tableaux et aux scénarios de redirection externe.
![20260709224747](https://static-docs.nocobase.com/20260709224747.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Saisir une adresse de lien. |
| Bloc de détails | Afficher et ouvrir un lien. |
| Bloc de tableau | Afficher un résumé du lien ou un lien cliquable. |
| Workflow | Utiliser le lien comme contenu d’une notification ou comme paramètre d’une requête externe. |

## Liens associés

- [Champ](../index.md) — découvrir le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — créer et gérer des champs dans une table ordinaire
- [Texte sur une ligne](./input.md) — enregistrer un texte court ordinaire
- [Pièce jointe](../media/field-attachment.md) — téléverser et associer des fichiers