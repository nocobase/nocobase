---
title: "Markdown"
description: "Le champ Markdown sert à enregistrer du contenu textuel utilisant la syntaxe Markdown."
keywords: "Markdown,markdown,champ de contenu,NocoBase"
---

# Markdown

## Présentation

Dans NocoBase, **Markdown（Markdown）** sert à enregistrer du contenu au format Markdown.

Le champ Markdown convient aux documents explicatifs, aux procédures de résolution, au contenu principal d’une base de connaissances, aux journaux de modifications, etc. Il enregistre du texte, qui est rendu en Markdown lors de l’affichage de la page.

Si vous avez besoin d’une expérience d’édition WYSIWYG, vous pouvez choisir le [texte enrichi](./rich-text.md) ou [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Cas d’utilisation

Le champ Markdown convient aux scénarios métier suivants :

- Contenu principal d’une base de connaissances, documents explicatifs
- Procédures de résolution, journaux de dépannage
- Notes de publication, journaux de modifications
- Contenu textuel long nécessitant une mise en forme légère

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Markdown » pour créer un champ Markdown.

![20240512181311](https://static-docs.nocobase.com/20240512181311.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Markdown correspond à `markdown` et détermine la manière dont le champ est saisi et affiché sur la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Document explicatif », « Procédure de résolution » ou « Contenu principal ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Les champs Markdown utilisent généralement `text` pour enregistrer le contenu. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être automatiquement renseignée si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Elles peuvent limiter la longueur ou rendre le champ obligatoire. |
| Description | Description du champ. Elle peut préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Remarque

Une fois créé, le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez la convention de nommage avant la création afin d’éviter des coûts de reconfiguration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Markdown est le suivant :

| Caractéristique | Description |
| --- | --- |
| Default Field interface | `markdown`. |
| Default Field type | `text`. |
| Field type disponibles | `text`, `string`, selon la configuration réelle du champ. |
| Composant de page | Le mode édition utilise le composant d’édition Markdown. |
| Filtrage | Les filtres textuels sont pris en charge, notamment contient, est vide et n’est pas vide. |
| Tri | Généralement non utilisé pour le tri. |
| Validation | Les validations textuelles, telles que la longueur et le caractère obligatoire, sont prises en charge. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Markdown. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée avec la base de données principale, sa modification consiste généralement à effectuer une correspondance de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | L’interface des champs de la base de données principale ou des champs synchronisés peut être ajustée lors de la correspondance des champs. Cette modification affecte la saisie, l’affichage et la validation sur la page. |
| Field type | Selon les conditions | Le type des champs de la base de données principale ou des champs synchronisés peut être ajusté lors de la correspondance des champs. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Remarque

Changer le Field type ou le Field interface ne revient pas simplement à modifier un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Markdown. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d’un champ Markdown créé dans la base de données principale, la colonne réelle correspondante de la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Pour un champ synchronisé depuis une base de données ou issu de la correspondance d’une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant toute suppression, vérifiez que le champ n’est plus utilisé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ Markdown convient à l’édition de contenu et à l’affichage des détails.
![20260709230801](https://static-docs.nocobase.com/20260709230801.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Modifier le contenu Markdown. |
| Bloc de détails | Afficher le contenu rendu en Markdown. |
| Bloc de tableau | Afficher un résumé du contenu. |
| Workflow | Utiliser le contenu principal pour générer des notifications ou des documents. |

## Liens associés

- [Champs](../index.md) — Découvrir le rôle, les catégories et la logique de correspondance des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Utiliser Vditor pour modifier du Markdown
- [Texte enrichi](./rich-text.md) — Modifier du contenu avec l’éditeur de texte enrichi
- [Texte multiligne](../basic/textarea.md) — Enregistrer de longs contenus en texte brut
