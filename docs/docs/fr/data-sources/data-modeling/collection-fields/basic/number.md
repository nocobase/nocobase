---
title: "Nombre"
description: "Le champ numérique sert à enregistrer des valeurs numériques pouvant comporter des décimales, comme des montants, des poids, des notes ou des superficies."
keywords: "nombre,number,double,decimal,NocoBase"
---

# Nombre

## Présentation

Dans NocoBase, **le nombre (Number)** sert à enregistrer des valeurs numériques pouvant comporter des décimales.

Le champ numérique convient aux données métier telles que les montants, les poids, les superficies, les notes et les prix unitaires. Il peut être utilisé pour le filtrage, le tri, les statistiques, les formules et les conditions des workflows.

Si la valeur doit obligatoirement être un entier, choisissez [Entier](./integer.md). Si vous souhaitez l'afficher sous forme de ratio ou de pourcentage, choisissez [Pourcentage](./percent.md).

## Cas d'utilisation

Le champ numérique convient notamment aux cas suivants :

- Montants de commandes, montants de contrats, prix unitaires
- Poids, superficies, volumes, distances
- Notes, coefficients, valeurs avant remise
- Valeurs décimales devant être utilisées dans des statistiques ou des calculs de formules

## Configuration de la création

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Nombre » pour créer un champ numérique.

![20240512175752](https://static-docs.nocobase.com/20240512175752.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d'interface du champ. Nombre correspond à `number` et détermine la manière dont la valeur est saisie et affichée dans la page. |
| Field display name | Nom affiché pour le champ dans l'interface, par exemple « Montant de la commande », « Note » ou « Poids ». Il est recommandé d'utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d'identification du champ, utilisé pour les références internes dans l'API, les champs relationnels, les autorisations, les workflows, etc. Il n'est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Le type par défaut d'un champ numérique est `double` ; pour les cas nécessitant des décimales précises, comme les montants, vous pouvez choisir `decimal`. |
| Default value | Valeur par défaut. Lors de la création d'un enregistrement, cette valeur peut être renseignée automatiquement si l'utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Elles peuvent limiter la valeur minimale, la valeur maximale, la précision ou indiquer si le champ est obligatoire. |
| Description | Description du champ. Elle peut préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l'API. Vérifiez le nom avant la création afin d'éviter des coûts de configuration ultérieurs liés à sa modification.

:::

## Caractéristiques du champ

Le comportement par défaut du champ numérique est le suivant :

| Caractéristique | Description |
| --- | --- |
| Default Field interface | `number`. |
| Default Field type | `double`. |
| Field type disponibles | `float`, `double`, `decimal`. |
| Composant de page | En mode édition, utilise un champ de saisie numérique. |
| Filtrage | Prend en charge les filtres numériques égal à, différent de, supérieur à, inférieur à, par intervalle, vide, non vide, etc. |
| Tri | Permet le tri dans les blocs de tableau. |
| Validation | Prend en charge la plage de valeurs, l'obligation de saisie et d'autres règles de validation. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification d'un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d'une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est mappé vers un Field type et un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l'interface sans modifier son nom d'identification. |
| Field name | Non | Le nom d'identification du champ ne peut généralement pas être modifié dans le formulaire d'édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage des champs. Cela affecte la saisie, l'affichage et la validation sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage des champs. Avant tout changement, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création d'un nouvel enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d'utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d'abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer un champ numérique. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d'un champ numérique créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu'elle contient sont généralement supprimées simultanément. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l'étendue des effets dépend de la source de données et de l'origine du champ correspondantes.

:::danger Avertissement

La suppression d'un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l'API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu'il n'est plus référencé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ numérique convient à la saisie, aux statistiques, aux graphiques et aux décisions dans les workflows.
![20260709225103](https://static-docs.nocobase.com/20260709225103.png)

| Cas d'utilisation | Utilisation |
| --- | --- |
| Bloc de formulaire | Saisir des valeurs telles que des montants, des notes ou des poids. |
| Bloc de tableau | Afficher, trier et filtrer des valeurs numériques. |
| Bloc de graphique | Regrouper, additionner ou calculer la moyenne à partir d'un champ numérique. |
| Champ de formule | Servir de champ d'entrée pour un calcul de formule. |

## Liens associés

- [Champ](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Entier](./integer.md) — Enregistrer des valeurs sans décimales
- [Pourcentage](./percent.md) — Enregistrer un ratio ou un taux d'achèvement
- [Formule](../../../field-formula/index.md) — Calculer un résultat à partir d'un champ numérique
