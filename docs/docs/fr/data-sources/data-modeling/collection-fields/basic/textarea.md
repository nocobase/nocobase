---
title: "Texte multiligne"
description: "Le champ de texte multiligne sert à enregistrer des remarques, des explications, des adresses, des avis de traitement et d’autres contenus textuels plus longs. Il utilise par défaut le type text et une zone de saisie multiligne."
keywords: "texte multiligne,textarea,champ texte,text,NocoBase"
---

# Texte multiligne

## Introduction

Dans NocoBase, le **texte multiligne (Multi-line text)** sert à enregistrer des contenus textuels nécessitant des sauts de ligne ou relativement longs.

Le texte multiligne utilise par défaut une zone de saisie multiligne et convient aux remarques, explications, avis de traitement, etc. Il peut être utilisé dans les filtres, les autorisations, les conditions de workflow et les requêtes API.

Si le contenu ne comporte généralement qu’une seule ligne, comme un nom, un numéro ou un titre, il est préférable de choisir par défaut le [texte sur une ligne](./input.md). Si le contenu nécessite une mise en page, des images ou des fonctionnalités de texte enrichi, choisissez un champ de texte enrichi ou Markdown.

## Cas d’utilisation

Le texte multiligne convient aux scénarios métier suivants :

- Remarques sur les clients, remarques sur les commandes, avis de traitement des tickets
- Adresses détaillées, descriptions des problèmes, spécifications des besoins
- Résumés de clauses contractuelles, présentation du contexte d’un projet
- Contenus textuels nécessitant une saisie avec des sauts de ligne

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Texte multiligne » pour créer un champ de texte multiligne.

![20240512165017](https://static-docs.nocobase.com/20240512165017.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Le texte multiligne correspond à `textarea`, qui détermine la manière dont le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Remarques client », « Avis de traitement » ou « Adresse détaillée ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les API, les champs de relation, les autorisations, les workflows et autres références internes. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Le texte multiligne utilise par défaut `text` et peut également être mappé vers `string` ou `json` selon le champ source. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’en saisit aucune. |
| Validation rules | Règles de validation. Elles peuvent limiter la longueur minimale, la longueur maximale, la longueur fixe, la casse ou l’utilisation d’expressions régulières. |
| Description | Description du champ. Elle peut préciser la signification du champ, les consignes de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez la nomenclature avant la création afin d’éviter des coûts d’ajustement de configuration par la suite.

:::

## Caractéristiques du champ

Le comportement par défaut d’un champ de texte multiligne est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `textarea`. |
| Field type par défaut | `text`. |
| Field type disponibles | `text`, `json`, `string`. |
| Composant de page | Le mode édition utilise une zone de saisie multiligne. |
| Filtrage | Prend en charge les filtres textuels, comme contient, ne contient pas, est vide, n’est pas vide, etc. |
| Tri | Il n’est généralement pas recommandé de l’utiliser pour le tri. La possibilité de trier dépend de la base de données et du type de champ concernés. |
| Validation | Prend en charge la longueur minimale, la longueur maximale, la longueur fixe, la casse, les expressions régulières et autres règles de validation. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ de texte multiligne. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est mappé vers un Field type et un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans modifier son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après la création. |
| Field interface | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte la saisie, l’affichage et la validation sur les pages. |
| Field type | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables de workflow. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ de texte multiligne. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs, puis les supprimer en bloc.

Lors de la suppression d’un champ de texte multiligne créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernés.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant la suppression, vérifiez que le champ n’est plus référencé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Les champs de texte multiligne conviennent à l’affichage de contenus longs dans les formulaires et les vues détaillées.

![20260709224428](https://static-docs.nocobase.com/20260709224428.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Saisir ou modifier des remarques, explications, avis de traitement et autres contenus. |
| Bloc de détails | Afficher des contenus textuels longs. |
| Bloc de tableau | Afficher un résumé ; les contenus longs sont généralement tronqués. |
| Workflows et autorisations | Utiliser le champ comme condition, par exemple pour déterminer si une remarque est vide. |

## Liens associés

- [Champ](../index.md) — Comprendre le rôle, les catégories et la logique de mappage des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Texte sur une ligne](./input.md) — Enregistrer des contenus textuels courts d’une seule ligne
- [Markdown](../media/markdown.md) — Enregistrer des contenus au format Markdown
- [Texte enrichi](../media/rich-text.md) — Enregistrer des contenus avec une mise en page complexe
