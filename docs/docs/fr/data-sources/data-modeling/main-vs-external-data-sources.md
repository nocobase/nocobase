---
title: "Comparaison entre la base de données principale et les bases de données externes"
description: "Différences entre la base de données principale et les bases de données externes : comparaison de la prise en charge des types de bases de données, des types de tables et de champs, ainsi que des capacités de sauvegarde, de restauration et de migration."
keywords: "base de données principale, base de données externe, comparaison des sources de données, connexion en lecture seule, synchronisation des tables,NocoBase"
---

# Comparaison entre la base de données principale et les bases de données externes

Dans NocoBase, les différences entre la base de données principale et les bases de données externes concernent principalement les quatre aspects suivants : la prise en charge des types de bases de données, des types de tables, des types de champs, ainsi que la sauvegarde, la restauration et la migration.

## 1. Prise en charge des types de bases de données

Pour plus de détails, consultez [Gestion des sources de données](https://docs.nocobase.com/data-sources/data-source-manager)

### Types de bases de données

| Type de base de données | Prise en charge par la base principale | Prise en charge par les bases externes |
|-----------|-------------|--------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Gestion des tables

| Gestion des tables | Prise en charge par la base principale | Prise en charge par les bases externes |
|-----------|-------------|--------------|
| Gestion de base | ✅ | ✅ |
| Gestion visuelle | ✅ | ❌ |

## 2. Prise en charge des types de tables

Pour plus de détails, consultez [Tables](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Type de table | Base de données principale | Base de données externe | Description |
|-----------|---------|-----------|------|
| Table standard | ✅ | ✅ | Table de données de base |
| Table de vue | ✅ | ✅ | Vue de la source de données |
| Table héritée | ✅ | ❌ | Prend en charge l'héritage des modèles de données, uniquement avec la source de données principale |
| Table de fichiers | ✅ | ❌ | Permet de téléverser des fichiers, uniquement avec la source de données principale |
| Table de commentaires | ✅ | ❌ | Système de commentaires intégré, uniquement avec la source de données principale |
| Table de calendrier | ✅ | ❌ | Table de données utilisée pour les vues de calendrier |
| Table d'expressions | ✅ | ❌ | Prend en charge les calculs par formule |
| Table arborescente | ✅ | ❌ | Utilisée pour modéliser des données en structure arborescente |
| Table SQL | ✅ | ❌ | Table de données pouvant être définie via SQL |
| Table connectée à une table de données externe | ✅ | ❌ | Table de connexion à une source de données externe, avec des fonctionnalités limitées |

## 3. Prise en charge des types de champs

Pour plus de détails, consultez [Champs de table](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Types de base

| Type de champ | Base de données principale | Base de données externe |
|---------|---------|-----------|
| Texte sur une ligne | ✅ | ✅ |
| Texte multiligne | ✅ | ✅ |
| Numéro de téléphone portable | ✅ | ✅ |
| Adresse e-mail | ✅ | ✅ |
| URL | ✅ | ✅ |
| Entier | ✅ | ✅ |
| Nombre | ✅ | ✅ |
| Pourcentage | ✅ | ✅ |
| Mot de passe | ✅ | ✅ |
| Couleur | ✅ | ✅ |
| Icône | ✅ | ✅ |

### Types de sélection

| Type de champ | Base de données principale | Base de données externe |
|---------|---------|-----------|
| Case à cocher | ✅ | ✅ |
| Menu déroulant (sélection unique) | ✅ | ✅ |
| Menu déroulant (sélection multiple) | ✅ | ✅ |
| Bouton radio | ✅ | ✅ |
| Cases à cocher | ✅ | ✅ |
| Régions administratives chinoises | ✅ | ❌ |

### Types multimédias

| Type de champ | Base de données principale | Base de données externe |
|---------|---------|-----------|
| Multimédia | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Texte enrichi | ✅ | ✅ |
| Pièce jointe (relation) | ✅ | ❌ |
| Pièce jointe (URL) | ✅ | ✅ |

### Types de date et d'heure

| Type de champ | Base de données principale | Base de données externe |
|---------|---------|-----------|
| Date et heure (avec fuseau horaire) | ✅ | ✅ |
| Date et heure (sans fuseau horaire) | ✅ | ✅ |
| Horodatage Unix | ✅ | ✅ |
| Date (sans heure) | ✅ | ✅ |
| Heure | ✅ | ✅ |

### Types géométriques

| Type de champ | Base de données principale | Base de données externe |
|---------|---------|-----------|
| Point | ✅ | ✅ |
| Ligne | ✅ | ✅ |
| Cercle | ✅ | ✅ |
| Polygone | ✅ | ✅ |

### Types avancés

| Type de champ | Base de données principale | Base de données externe |
|---------|---------|-----------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Tri | ✅ | ✅ |
| Formule de calcul | ✅ | ✅ |
| Codage automatique | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Sélecteur de table | ✅ | ❌ |
| Chiffrement | ✅ | ✅ |

### Champs d'information système

| Type de champ | Base de données principale | Base de données externe |
|---------|---------|-----------|
| Date de création | ✅ | ✅ |
| Date de dernière modification | ✅ | ✅ |
| Créateur | ✅ | ❌ |
| Dernier modificateur | ✅ | ❌ |
| OID de table | ✅ | ❌ |

### Types de relations

| Type de champ | Base de données principale | Base de données externe |
|---------|---------|-----------|
| Un-à-un | ✅ | ✅ |
| Un-à-plusieurs | ✅ | ✅ |
| Plusieurs-à-un | ✅ | ✅ |
| Plusieurs-à-plusieurs | ✅ | ✅ |
| Plusieurs-à-plusieurs (tableau) | ✅ | ✅ |

:::info
Les champs de pièce jointe dépendent des tables de fichiers, qui sont uniquement prises en charge par la base de données principale. Les bases de données externes ne prennent donc pas encore en charge les champs de pièce jointe.
:::

## 4. Comparaison de la prise en charge des sauvegardes et des migrations

| Fonctionnalité | Base de données principale | Base de données externe |
|-----|---------|-----------|
| Sauvegarde et restauration | ✅ | ❌ (à gérer soi-même) |
| Gestion des migrations | ✅ | ❌ (à gérer soi-même) |

:::info
NocoBase fournit des fonctionnalités de sauvegarde, de restauration et de migration de structure pour la base de données principale. Pour les bases de données externes, ces opérations doivent être effectuées de manière autonome par l'utilisateur en fonction de son environnement de base de données ; NocoBase ne fournit pas de prise en charge intégrée.
:::

## Comparaison récapitulative

| Élément de comparaison | Base de données principale | Base de données externe |
|-------|---------|-----------|
| Types de bases de données | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Prise en charge des types de tables | Tous les types de tables | Uniquement les tables standard et les tables de vue |
| Prise en charge des types de champs | Tous les types de champs | Tous les types de champs à l'exception des champs de pièce jointe |
| Sauvegarde et migration | Prise en charge intégrée | À gérer soi-même |

## Recommandations

- **Si vous utilisez NocoBase pour créer un nouveau système métier**, utilisez la **base de données principale** afin de bénéficier de toutes les fonctionnalités de NocoBase.
- **Si vous utilisez NocoBase pour vous connecter à la base de données d'un autre système afin d'effectuer des opérations de base d'ajout, de suppression, de modification et de consultation**, utilisez alors une **base de données externe**.