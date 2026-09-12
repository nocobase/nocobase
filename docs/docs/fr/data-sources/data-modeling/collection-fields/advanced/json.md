---
title: "JSON"
description: "Le champ JSON sert à enregistrer des objets structurés, des tableaux, des extraits de réponses d’API et d’autres données semi-structurées."
keywords: "JSON,json,données structurées,NocoBase"
---

# JSON

## Présentation

Dans NocoBase, **JSON（JSON）** sert à enregistrer des données structurées ou semi-structurées.

Les champs JSON sont adaptés à l’enregistrement d’extraits de réponses d’API externes, de configurations étendues, de propriétés dynamiques et d’autres données dont la structure n’est pas fixe. Ils sont flexibles, mais moins faciles à filtrer, valider et afficher que les champs ordinaires.

Si la structure du champ est stable, il est préférable de la répartir dans des champs explicites afin de faciliter la configuration des pages, la gestion des autorisations, le filtrage et l’utilisation dans les workflows.

## Cas d’utilisation

Le JSON convient notamment aux scénarios métier suivants :

- Réponses brutes d’API externes
- Propriétés d’extension dynamiques
- Objets de configuration complexes
- Enregistrement temporaire de données impossibles à structurer

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « JSON » pour créer un champ JSON.

![20240512173905](https://static-docs.nocobase.com/20240512173905.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. JSON correspond à `json` et détermine la manière dont le champ est saisi et affiché dans les pages. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Informations supplémentaires », « Réponse d’API » ou « Configuration ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Les champs JSON utilisent généralement `json` ou `jsonb`. |
| Default value | Valeur par défaut. Lors de l’ajout d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’en saisit aucune. |
| Validation rules | Règles de validation. Elles vérifient généralement si le JSON est valide ou si le champ est obligatoire. |
| Description | Description du champ. Elle peut préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez sa dénomination avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut des champs JSON est le suivant :

| Caractéristique | Description |
| --- | --- |
| Default Field interface | `json`. |
| Default Field type | `json`. |
| Field type disponibles | `json` et `jsonb`, selon les capacités de la base de données. |
| Composant de page | Le mode édition utilise un composant d’édition JSON ou un composant de saisie de texte. |
| Filtrage | Les capacités de filtrage dépendent de la base de données et de la correspondance des champs ; ce champ n’est généralement pas utilisé comme champ de filtrage principal. |
| Tri | Il n’est généralement pas utilisé pour le tri. |
| Validation | Les validations du JSON, l’obligation de saisie et d’autres règles sont prises en charge. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ JSON. La modification d’un champ sert principalement à ajuster son affichage et son mode d’utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer une correspondance de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la correspondance des champs. Cette modification affecte la saisie, l’affichage et la validation dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la correspondance des champs. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas simplement à modifier un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Si le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Suppression d’un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ JSON. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs afin de les supprimer en lot.

Lors de la suppression d’un champ JSON créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées simultanément. Lorsqu’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe est supprimé, l’étendue des conséquences dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus utilisé dans une configuration métier.

:::

## Utilisation dans la configuration des pages

Les champs JSON sont adaptés aux scénarios d’intégration et de configuration étendue.
![20260710151854](https://static-docs.nocobase.com/20260710151854.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Saisir ou modifier des données JSON. |
| Bloc de détails | Afficher du contenu structuré. |
| Workflow | Enregistrer ou lire des extraits renvoyés par une API externe. |
| API | Transmettre ou renvoyer un objet étendu. |

## Liens associés

- [Champs](../index.md) — découvrir le rôle, les catégories et la logique de correspondance des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — créer et gérer des champs dans une table ordinaire
- [Texte multiligne](../basic/textarea.md) — enregistrer de longs contenus en texte brut
- [Formule](../../../field-formula/index.md) — calculer un résultat à partir de champs