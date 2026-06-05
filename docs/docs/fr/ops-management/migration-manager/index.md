---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Gestionnaire de migrations

## Introduction

Il vous permet de transférer les configurations d'application d'un environnement à un autre. Le gestionnaire de migrations se concentre principalement sur la migration des « configurations d'application ». Si vous avez besoin d'une migration complète des données, nous vous recommandons d'utiliser le « [Gestionnaire de sauvegardes](../backup-manager/index.mdx) » pour sauvegarder et restaurer votre application.

## Installation

Le gestionnaire de migrations dépend du [plugin Gestionnaire de sauvegardes](../backup-manager/index.mdx). Assurez-vous qu'il est déjà installé et activé.

## Fonctionnement et principes

Le gestionnaire de migrations transfère les tables et les données de la base de données principale d'une application à une autre, en se basant sur des règles de migration spécifiques. Il est important de noter qu'il ne migre pas les données des bases de données externes ni des sous-applications.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Règles de migration

### Règles intégrées

Le gestionnaire de migrations peut migrer toutes les tables de la base de données principale et prend en charge les cinq règles intégrées suivantes :

- **Structure seule** : Migre uniquement la structure (schéma) des tables, sans insertion ni mise à jour des données.
- **Écraser (vider et réinsérer)** : Supprime tous les enregistrements existants de la table de destination, puis insère les nouvelles données.
- **Insérer ou mettre à jour (Upsert)** : Vérifie si chaque enregistrement existe (par clé primaire). S'il existe, il le met à jour ; sinon, il l'insère.
- **Insérer et ignorer les doublons** : Insère de nouveaux enregistrements, mais si un enregistrement existe déjà (par clé primaire), l'insertion est ignorée (aucune mise à jour n'est effectuée).
- **Ignorer** : Ignore complètement le traitement de la table (aucun changement de structure, aucune migration de données).

**Remarques supplémentaires :**

- Les règles « Écraser », « Insérer ou mettre à jour » et « Insérer et ignorer les doublons » synchronisent également les modifications de la structure des tables.
- Si une table utilise un ID auto-incrémenté comme clé primaire, ou si elle n'a pas de clé primaire, les règles « Insérer ou mettre à jour » et « Insérer et ignorer les doublons » ne peuvent pas être appliquées.
- Les règles « Insérer ou mettre à jour » et « Insérer et ignorer les doublons » s'appuient sur la clé primaire pour déterminer si l'enregistrement existe déjà.

### Conception détaillée

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Interface de configuration

Configurez les règles de migration

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Activez les règles indépendantes

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Sélectionnez les règles indépendantes et les tables à traiter selon ces règles.

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Fichiers de migration

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Création d'une nouvelle migration

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Exécution d'une migration

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Vérification des variables d'environnement de l'application (en savoir plus sur les [Variables d'environnement](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Si des variables sont manquantes, une fenêtre contextuelle vous invitera à saisir les nouvelles variables d'environnement requises, puis à continuer.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Journaux de migration

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Annulation

Avant toute exécution de migration, l'application actuelle est automatiquement sauvegardée. Si la migration échoue ou que les résultats ne correspondent pas à vos attentes, vous pouvez annuler les modifications à l'aide du [Gestionnaire de sauvegardes](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)