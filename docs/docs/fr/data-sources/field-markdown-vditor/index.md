---
title: "Markdown Vditor"
description: "Le champ Markdown Vditor permet d’enregistrer du contenu Markdown à l’aide de l’éditeur Vditor."
keywords: "Markdown Vditor,Vditor,markdown,NocoBase"
---

# Markdown Vditor

## Présentation

Dans NocoBase, **Markdown Vditor (Markdown Vditor)** permet de modifier du contenu Markdown avec l’éditeur Vditor.

Markdown Vditor convient aux contenus nécessitant une expérience d’édition Markdown plus complète, comme le corps des commentaires, le contenu d’une base de connaissances ou la présentation d’une solution.

Si vous avez seulement besoin d’un éditeur Markdown simple, vous pouvez choisir [Markdown](../data-modeling/collection-fields/media/markdown.md). Si vous souhaitez une expérience de texte enrichi WYSIWYG, choisissez le [texte enrichi](../data-modeling/collection-fields/media/rich-text.md).

## Cas d’utilisation

Markdown Vditor convient aux scénarios métier suivants :

- Contenu des commentaires et des discussions
- Contenu d’une base de connaissances et présentation d’une solution
- Textes longs avec mise en forme Markdown
- Contenus nécessitant des fonctions de prévisualisation et d’édition

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Markdown Vditor » pour créer un champ Markdown Vditor.

![20240512180647](https://static-docs.nocobase.com/20240512180647.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Markdown Vditor correspond à `vditor` et détermine la manière dont les données sont saisies et affichées dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Contenu du commentaire », « Contenu de la base de connaissances » ou « Présentation de la solution ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Les champs Markdown Vditor utilisent généralement `text` pour enregistrer le contenu. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être automatiquement renseignée si l’utilisateur n’a rien saisi. |
| Validation rules | Règles de validation. Elles permettent de limiter la longueur ou de rendre le champ obligatoire. |
| Description | Description du champ. Elle peut préciser la signification du champ, les consignes de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Le nom du champ sera utilisé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez son nom avant la création afin d’éviter des coûts de configuration supplémentaires en cas de modification ultérieure.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Markdown Vditor est le suivant :

| Caractéristique | Description |
| --- | --- |
| Default Field interface | `vditor`. |
| Default Field type | `text`. |
| Field type disponible | `text`. |
| Composant de page | En mode édition, l’éditeur MarkdownVditor est utilisé. |
| Filtrage | Les filtres de type texte sont pris en charge, notamment contient, est vide et n’est pas vide. |
| Tri | Généralement non utilisé pour le tri. |
| Validation | Les validations de texte telles que la longueur et le caractère obligatoire sont prises en charge. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Markdown Vditor. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer une mise en correspondance des champs : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans modifier son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Cette modification affecte la manière dont les données sont saisies, affichées et validées sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas simplement à modifier un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables sont utilisées dans les workflows. Si le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Markdown Vditor. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en bloc.

Lors de la suppression d’un champ Markdown Vditor créé dans la base de données principale, la colonne réelle correspondante ainsi que les données qu’elle contient sont généralement supprimées de la base de données. Lorsqu’un champ issu d’une synchronisation avec une base de données ou d’une source de données externe est supprimé, l’étendue des effets dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus utilisé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Les champs Markdown Vditor conviennent aux contenus et aux commentaires nécessitant une expérience d’édition.
![20260709230930](https://static-docs.nocobase.com/20260709230930.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Utiliser Vditor pour modifier du contenu Markdown. |
| Bloc de détails | Afficher le contenu Markdown rendu. |
| Bloc de commentaires | Enregistrer le contenu du corps d’un commentaire. |
| Workflow | Utiliser le corps du contenu pour générer des notifications ou des documents. |

## Liens associés

- [Champs](../index.md) — Découvrir le rôle, la classification et la logique de mise en correspondance des champs
- [Table standard](../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Markdown](../data-modeling/collection-fields/media/markdown.md) — Enregistrer du contenu Markdown
- [Texte enrichi](../data-modeling/collection-fields/media/rich-text.md) — Enregistrer du contenu en texte enrichi
