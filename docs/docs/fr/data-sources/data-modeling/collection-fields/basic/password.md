---
title: "Mot de passe"
description: "Le champ Mot de passe sert à enregistrer des saisies de type mot de passe, affichées sous forme masquée lors de la saisie dans la page."
keywords: "mot de passe,password,saisie sensible,NocoBase"
---

# Mot de passe

## Présentation

Dans NocoBase, le **mot de passe (Password)** sert à saisir des informations de type mot de passe.

Le champ Mot de passe convient pour enregistrer des informations dont la saisie doit rester masquée, comme les mots de passe de services externes ou les codes d’accès temporaires. Il concerne principalement le mode de saisie et d’affichage, et ne constitue pas une solution complète de gestion des clés.

Pour enregistrer des clés hautement sensibles ou des identifiants persistants, privilégiez l’évaluation de solutions dédiées de chiffrement, de gestion des clés ou de variables d’environnement.

## Cas d’utilisation

Le champ Mot de passe convient aux scénarios métier suivants :

- Mot de passe temporaire d’un système externe
- Code d’accès dans une configuration de connexion
- Texte sensible nécessitant uniquement une saisie masquée
- Code de vérification ou mot de passe temporaire dans un processus interne

## Créer une configuration

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Mot de passe » pour créer un champ Mot de passe.

![20240512175917](https://static-docs.nocobase.com/20240512175917.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Le mot de passe correspond à `password`, qui détermine la manière dont il est saisi et affiché dans la page. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Mot de passe d’accès », « Code de connexion » ou « Code temporaire ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Les champs Mot de passe utilisent généralement `password` ou `string`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, elle peut être renseignée automatiquement si l’utilisateur ne saisit aucune valeur. |
| Validation rules | Règles de validation. Il est possible de configurer une longueur, une expression régulière ou le caractère obligatoire du champ. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Le nom du champ sera utilisé par les blocs de page, les autorisations, les workflows et les API. Vérifiez sa convention de nommage avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Mot de passe est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `password`. |
| Field type par défaut | `password`. |
| Field type disponibles | `password` et `string`. |
| Composant de page | Le mode édition utilise un champ de saisie de mot de passe. |
| Filtrage | Il est généralement déconseillé de l’utiliser comme critère de filtrage. |
| Tri | Il est généralement déconseillé de l’utiliser pour le tri. |
| Validation | Les validations de longueur, d’expression régulière et de caractère obligatoire sont prises en charge. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Mot de passe. La modification d’un champ sert principalement à ajuster sa manière d’être affiché et utilisé dans NocoBase, par exemple en modifiant son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte le mode de saisie, d’affichage et de validation dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas simplement à modifier un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les critères de filtrage et la manière dont il est utilisé comme variable dans les workflows. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Mot de passe. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en bloc.

Lors de la suppression d’un champ Mot de passe créé dans la base de données principale, la colonne correspondante de la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Pour les champs synchronisés depuis une base de données ou mappés depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus utilisé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ Mot de passe convient à la saisie de textes sensibles dans les formulaires de configuration.
![20260709225244](https://static-docs.nocobase.com/20260709225244.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Saisir un code d’accès à l’aide d’un champ de mot de passe. |
| Bloc de détails | Afficher la valeur sous forme masquée ou avec un accès restreint. |
| Autorisations | Limiter les personnes autorisées à consulter ou à modifier le champ Mot de passe. |
| Workflow | Utiliser avec prudence comme paramètre de requête externe. |

## Liens associés

- [Champ](../index.md) — En savoir plus sur le rôle, les catégories et la logique de mappage des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Texte sur une ligne](./input.md) — Enregistrer un texte court standard