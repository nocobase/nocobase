---
title: "Champ relation"
description: "Les champs relation servent à établir des associations entre les tables de données et prennent en charge les types de relations un-à-un, un-à-plusieurs, plusieurs-à-un, plusieurs-à-plusieurs et plusieurs-à-plusieurs par tableau."
keywords: "Champ relation,BelongsTo,HasMany,O2O,O2M,M2O,M2M,Champ associé,NocoBase"
---

# Champ relation

Dans NocoBase, les **champs relation** servent à établir des associations entre différentes tables de données. Ils permettent à un enregistrement de référencer un enregistrement d’une autre table, ou plusieurs enregistrements, par exemple pour associer une commande à un client, une tâche à un responsable ou un étudiant à des cours.

Les champs relation ne fonctionnent pas exactement comme les champs ordinaires. Les champs ordinaires correspondent généralement à de véritables colonnes de la base de données et servent à stocker des valeurs telles que du texte, des nombres ou des dates ; les champs relation stockent la configuration des connexions entre les tables ainsi que les clés permettant d’identifier les enregistrements associés. Pour la base de données principale, les champs relation peuvent générer la configuration relationnelle nécessaire lors de leur création ; pour les bases de données externes, les relations sont généralement établies à partir de clés primaires, de clés étrangères ou de champs uniques existants, sans modifier automatiquement la structure des tables externes.

## Sélectionner le type de relation

Les types de relations courants sont les suivants :

| Type de relation | Cas d’utilisation |
| --- | --- |
| [Un-à-un](./o2o/index.md) | Un enregistrement n’est associé qu’à un seul enregistrement d’une autre table. Par exemple, associer un employé à un dossier d’intégration. |
| [Un-à-plusieurs](./o2m/index.md) | Un enregistrement est associé à plusieurs enregistrements d’une autre table. Par exemple, associer un client à plusieurs commandes. |
| [Plusieurs-à-un](./m2o/index.md) | Plusieurs enregistrements sont associés au même enregistrement cible. Par exemple, associer plusieurs commandes à un même client. |
| [Plusieurs-à-plusieurs](./m2m/index.md) | Deux tables peuvent être associées à plusieurs enregistrements l’une de l’autre. Par exemple, associer des étudiants et des cours dans les deux sens. |
| [Plusieurs-à-plusieurs (tableau)](../../../field-m2m-array/index.md) | Utilise un champ tableau pour enregistrer les identifiants de plusieurs enregistrements cibles, ce qui convient lorsque la structure existante de la table utilise déjà un tableau pour stocker les valeurs d’association. |

Commencez par déterminer la relation en fonction de la sémantique métier : si l’enregistrement courant n’appartient qu’à un seul enregistrement cible, utilisez généralement une relation plusieurs-à-un ; si l’enregistrement courant doit afficher plusieurs enregistrements de la table cible, utilisez généralement une relation un-à-plusieurs ; si les deux côtés peuvent être associés à plusieurs enregistrements, utilisez généralement une relation plusieurs-à-plusieurs.

## Points essentiels de configuration

Lors de la configuration d’un champ relation, vérifiez en priorité les éléments suivants :

- Table de données cible : table à laquelle la relation doit être associée
- Type de relation : un-à-un, un-à-plusieurs, plusieurs-à-un, plusieurs-à-plusieurs ou plusieurs-à-plusieurs par tableau
- Clé de relation : champs utilisés pour identifier les enregistrements des deux côtés, généralement une clé primaire, une clé étrangère ou un champ unique
- Champ de titre : champ affiché par défaut pour les enregistrements associés dans les sélecteurs et les blocs

:::warning Attention

Dans une base de données externe, les champs relation correspondent principalement aux métadonnées de relation enregistrées par NocoBase. L’ajout d’un champ relation ne crée pas automatiquement de véritable clé étrangère, d’index ou de table intermédiaire dans la base de données externe. Si vous avez besoin de contraintes de clé étrangère au niveau de la base de données, configurez-les d’abord côté base de données, puis revenez dans NocoBase pour synchroniser et configurer le champ.

:::

## Liens associés

- [Un-à-un](./o2o/index.md) — Consulter la configuration du champ relation un-à-un
- [Un-à-plusieurs](./o2m/index.md) — Consulter la configuration du champ relation un-à-plusieurs
- [Plusieurs-à-un](./m2o/index.md) — Consulter la configuration du champ relation plusieurs-à-un
- [Plusieurs-à-plusieurs](./m2m/index.md) — Consulter la configuration du champ relation plusieurs-à-plusieurs
- [Plusieurs-à-plusieurs (tableau)](../../../field-m2m-array/index.md) — Consulter la relation plusieurs-à-plusieurs de type tableau
