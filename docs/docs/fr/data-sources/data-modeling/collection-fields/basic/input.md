---
title: "Texte sur une seule ligne"
description: "Le champ de texte sur une seule ligne sert à enregistrer des contenus courts tels que des noms, des numéros, des titres ou des contacts. Il utilise par défaut le type string et le composant Input."
keywords: "Texte sur une seule ligne,input,champ de texte,string,Field interface,NocoBase"
---

# Texte sur une seule ligne

## Introduction

Dans NocoBase, le **texte sur une seule ligne (Single line text)** est le champ texte le plus couramment utilisé. Il convient à l’enregistrement de contenus courts ne dépassant généralement pas une ligne, comme le nom d’un client, un numéro de commande, un contact, un résumé d’adresse ou un identifiant provenant d’un système externe.

Le champ de texte sur une seule ligne utilise par défaut le composant `Input` et le Field type par défaut est `string`. Il peut être utilisé comme champ de titre et participer aux filtres, au tri, aux autorisations, aux conditions des workflows et aux requêtes API.

Si le contenu doit pouvoir contenir des retours à la ligne ou être plus long, il est préférable de choisir par défaut le [texte multiligne](./textarea.md). Si le contenu suit un format fixe, comme une adresse e-mail, un numéro de téléphone ou une URL, privilégiez le champ spécialisé correspondant.

## Cas d’utilisation

Le texte sur une seule ligne convient notamment aux cas suivants :

- Nom du client, nom de l’entreprise, nom du contact
- Numéro de commande, numéro de contrat, numéro de projet
- Titre de tâche, titre de ticket, titre d’article
- ID d’un système externe, numéro de synchronisation, code métier
- Ville, résumé d’adresse, nom de magasin et autres informations textuelles courtes

## Créer la configuration

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Single line text » pour créer un champ de texte sur une seule ligne.

![20240512163555](https://static-docs.nocobase.com/20240512163555.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Le texte sur une seule ligne correspond à `input` ; la saisie et l’affichage s’effectuent par défaut dans un champ de saisie. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Nom du client », « Numéro de commande » ou « Titre de tâche ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les underscores, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Le texte sur une seule ligne utilise par défaut `string`, mais il est également possible de choisir `uid`. Pour un texte court ordinaire, `string` suffit généralement. |
| Automatically remove heading and tailing spaces | Supprime automatiquement les espaces en début et en fin de texte. Convient aux contenus tels que les noms de clients, les numéros et les titres, pour lesquels ces espaces ne doivent pas être conservés. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, un texte par défaut peut être renseigné automatiquement si l’utilisateur ne saisit aucune valeur. |
| Primary | Définit le champ comme clé primaire. Disponible uniquement lors de la création d’un champ dans la base de données principale ; il n’est pas recommandé d’utiliser un texte métier ordinaire comme clé primaire. |
| Unique | Contrainte d’unicité. Convient aux textes qui ne doivent pas être dupliqués, comme les numéros de commande, les numéros de contrat ou les ID de systèmes externes. |
| Validation rules | Règles de validation. Elles permettent de limiter la longueur minimale, la longueur maximale, la longueur fixe ou d’appliquer une expression régulière. |
| Description | Description du champ. Elle peut préciser la signification du champ, les exigences de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez donc le nom avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ de texte sur une seule ligne est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `input`. |
| Field type par défaut | `string`. |
| Field type disponibles | `string`, `uid`. |
| Composant de page | En mode édition, le champ de saisie `Input` est utilisé. |
| Champ de titre | Peut être utilisé comme champ de titre de la table de données. Il convient notamment de définir « Nom du client », « Numéro de commande » ou « Titre de tâche » comme champ de titre. |
| Tri | Permet le tri dans les blocs de tableau. |
| Filtrage | Prend en charge les filtres textuels, tels que contient, ne contient pas, égal à, différent de, est vide ou n’est pas vide. |
| Validation | Prend en charge la validation de la longueur minimale, de la longueur maximale, de la longueur fixe, des expressions régulières, etc. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ de texte sur une seule ligne. La modification sert principalement à ajuster la manière dont le champ est affiché et utilisé dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou la suppression automatique des espaces en début et en fin.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase. Par exemple, des colonnes de texte court telles que `varchar` et `char` dans la base de données peuvent être mappées sur un champ de texte sur une seule ligne.

| Configuration | Modification autorisée | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte la saisie, l’affichage et la validation dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Automatically remove heading and tailing spaces | Oui | Contrôle la suppression ou non des espaces en début et en fin lors de l’enregistrement. |
| Default value | Oui | Modifie le texte par défaut des nouveaux enregistrements. |
| Unique | Selon les conditions | Peut être configuré pour les champs nouvellement créés dans la base de données principale. Si des valeurs en double existent déjà, l’ajout d’une contrainte d’unicité peut échouer. |
| Validation rules | Oui | Modifie les règles de validation de la longueur, du format ou des expressions régulières. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables de workflow. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer le champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ de texte sur une seule ligne. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs pour les supprimer en une seule opération.

Lors de la suppression d’un champ de texte sur une seule ligne créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’impact dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus utilisé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ de texte sur une seule ligne peut être utilisé dans la plupart des blocs de données et des formulaires.

| Cas d’utilisation | Fonction |
| --- | --- |
| Bloc de formulaire | Saisir ou modifier des contenus textuels courts, comme un nom de client, un numéro de commande ou un titre de tâche. |
| Bloc de tableau | Afficher, trier et filtrer des contenus textuels courts. Lorsque le contenu est plus long, il est tronqué dans le tableau selon la configuration de l’interface. |
| Bloc de détails | Afficher les informations textuelles d’un enregistrement. |
| Bloc de filtrage | Utiliser le champ comme condition de recherche pour filtrer les enregistrements, par exemple par nom de client, numéro ou titre. |
| Affichage d’un champ de relation | Lorsque le champ de texte sur une seule ligne est défini comme champ de titre, ce texte est affiché en priorité lors de la sélection d’un enregistrement dans un champ de relation. |
| Workflows et autorisations | Utiliser le champ comme condition, par exemple pour déterminer si un numéro de commande est vide ou si un nom de client contient un mot-clé donné. |

### Mode édition

En mode édition, le champ de texte sur une seule ligne utilise un champ de saisie pour entrer le contenu.

![20240512164001](https://static-docs.nocobase.com/20240512164001.png)

### Mode lecture

En mode lecture, le champ de texte sur une seule ligne est affiché sous forme de texte ordinaire.

![20240512164138](https://static-docs.nocobase.com/20240512164138.png)