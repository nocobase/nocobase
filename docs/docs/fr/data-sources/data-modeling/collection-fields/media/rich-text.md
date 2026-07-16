---
title: "Texte enrichi"
description: "Le champ de texte enrichi sert à enregistrer du contenu mis en forme, avec des images, des liens et d’autres formats."
keywords: "Texte enrichi,rich text,champs de contenu,NocoBase"
---

# Texte enrichi

## Présentation

Dans NocoBase, le **texte enrichi (Rich text)** sert à enregistrer du contenu mis en forme.

Le champ de texte enrichi convient au corps des annonces, des articles, des modèles d’e-mails, des documents d说明, etc. Il offre une expérience proche de l’édition WYSIWYG.

Si votre équipe utilise habituellement Markdown ou a besoin d’un formatage contrôlable en texte brut, choisissez [Markdown](./markdown.md) ou [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Cas d’utilisation

Le texte enrichi convient aux scénarios métier suivants :

- Corps des annonces et des articles
- Modèles d’e-mails et de notifications
- Descriptions de produits et modes d’emploi
- Contenu nécessitant des images, des liens et une mise en forme

## Configuration lors de la création

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Texte enrichi » pour créer un champ de texte enrichi.

![20240512181002](https://static-docs.nocobase.com/20240512181002.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Le texte enrichi correspond à `richText` et détermine la manière dont le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Corps de l’annonce », « Modèle d’e-mail » ou « Description du produit ». Il est recommandé d’utiliser un nom immédiatement compréhensible par les équipes métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il est généralement impossible de le modifier après la création. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Les champs de texte enrichi utilisent généralement `text` pour enregistrer le contenu. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Elles peuvent limiter la longueur ou rendre le champ obligatoire. |
| Description | Description du champ. Elle peut préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Le nom du champ est référencé par les blocs de page, les autorisations, les workflows et les API après sa création. Vérifiez son nommage avant la création afin d’éviter des coûts d’ajustement ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ de texte enrichi est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `richText`. |
| Field type par défaut | `text`. |
| Field type disponible | `text`. |
| Composant de page | Le mode édition utilise un éditeur de texte enrichi. |
| Filtrage | Prend en charge les filtres de type texte, comme contient, est vide et n’est pas vide. |
| Tri | N’est généralement pas utilisé pour le tri. |
| Validation | Prend en charge les validations de texte, comme la longueur et le caractère obligatoire. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cela affecte la manière dont le champ est saisi, affiché et validé dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant tout changement, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables de workflow sont utilisées. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Suppression d’un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ de texte enrichi. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en bloc.

Lors de la suppression d’un champ de texte enrichi créé dans la base de données principale, la colonne réelle correspondante de la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ de texte enrichi convient aux scénarios d’édition et de présentation de contenu.
![20260709231418](https://static-docs.nocobase.com/20260709231418.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Modifier le contenu en texte enrichi. |
| Bloc de détails | Afficher le contenu selon le format du texte enrichi. |
| Modèle d’e-mail ou de notification | Servir de source au corps du modèle. |
| Bloc de tableau | Afficher un résumé ou une version simplifiée du contenu. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Markdown](./markdown.md) — Enregistrer du contenu Markdown
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Utiliser Vditor pour modifier du Markdown
