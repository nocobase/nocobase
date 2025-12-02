:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Comparaison : Bases de données principales et externes

Les différences entre les bases de données principales et les bases de données externes dans NocoBase se manifestent principalement à travers quatre aspects : le support des types de bases de données, le support des types de collections, le support des types de champs et les capacités de sauvegarde et de migration.

## 1. Support des types de bases de données

Pour plus de détails, consultez : [Gestionnaire de sources de données](/data-sources/data-source-manager)

### Types de bases de données

| Type de base de données | Support base de données principale | Support base de données externe |
|-------------------|---------------------------------|--------------------------------|
| PostgreSQL        | ✅                              | ✅                             |
| MySQL             | ✅                              | ✅                             |
| MariaDB           | ✅                              | ✅                             |
| KingbaseES        | ✅                              | ✅                             |
| MSSQL             | ❌                              | ✅                             |
| Oracle            | ❌                              | ✅                             |

### Gestion des collections

| Gestion des collections | Support base de données principale | Support base de données externe |
|-------------------------|---------------------------------|--------------------------------|
| Gestion de base         | ✅                              | ✅                             |
| Gestion visuelle        | ✅                              | ❌                             |

## 2. Support des types de collections

Pour plus de détails, consultez : [Collections](/data-sources/data-modeling/collection)

| Type de collection            | Base de données principale | Base de données externe | Description                                                                   |
|-------------------------------|----------------------------|-------------------------|-------------------------------------------------------------------------------|
| Collection de base            | ✅                         | ✅                      | Collection de données de base                                                 |
| Vue                           | ✅                         | ✅                      | Vue de source de données                                                      |
| Héritage                      | ✅                         | ❌                      | Supporte l'héritage de modèle de données, uniquement pour la source de données principale |
| Fichier                       | ✅                         | ❌                      | Supporte le téléversement de fichiers, uniquement pour la source de données principale |
| Commentaire                   | ✅                         | ❌                      | Système de commentaires intégré, uniquement pour la source de données principale |
| Calendrier                    | ✅                         | ❌                      | Collection pour les vues de calendrier                                        |
| Expression                    | ✅                         | ❌                      | Supporte les calculs de formules                                              |
| Arborescence                  | ✅                         | ❌                      | Pour la modélisation de données en structure arborescente                     |
| SQL                           | ✅                         | ❌                      | Collection définie via SQL                                                    |
| Connexion externe             | ✅                         | ❌                      | Collection de connexion pour les sources de données externes, fonctionnalités limitées |

## 3. Support des types de champs

Pour plus de détails, consultez : [Champs de collection](/data-sources/data-modeling/collection-fields)

### Types de base

| Type de champ           | Base de données principale | Base de données externe |
|-------------------------|----------------------------|-------------------------|
| Texte sur une seule ligne | ✅                         | ✅                      |
| Texte long              | ✅                         | ✅                      |
| Numéro de téléphone     | ✅                         | ✅                      |
| E-mail                  | ✅                         | ✅                      |
| URL                     | ✅                         | ✅                      |
| Entier                  | ✅                         | ✅                      |
| Nombre                  | ✅                         | ✅                      |
| Pourcentage             | ✅                         | ✅                      |
| Mot de passe            | ✅                         | ✅                      |
| Couleur                 | ✅                         | ✅                      |
| Icône                   | ✅                         | ✅                      |

### Types de choix

| Type de champ                     | Base de données principale | Base de données externe |
|-----------------------------------|----------------------------|-------------------------|
| Case à cocher                     | ✅                         | ✅                      |
| Liste déroulante (sélection unique) | ✅                         | ✅                      |
| Liste déroulante (sélection multiple) | ✅                         | ✅                      |
| Groupe de boutons radio           | ✅                         | ✅                      |
| Groupe de cases à cocher          | ✅                         | ✅                      |
| Région de Chine                   | ✅                         | ❌                      |

### Types de média

| Type de champ             | Base de données principale | Base de données externe |
|---------------------------|----------------------------|-------------------------|
| Média                     | ✅                         | ✅                      |
| Markdown                  | ✅                         | ✅                      |
| Markdown (Vditor)         | ✅                         | ✅                      |
| Texte enrichi             | ✅                         | ✅                      |
| Pièce jointe (association) | ✅                         | ❌                      |
| Pièce jointe (URL)        | ✅                         | ✅                      |

### Types de date et heure

| Type de champ                     | Base de données principale | Base de données externe |
|-----------------------------------|----------------------------|-------------------------|
| Date et heure (avec fuseau horaire) | ✅                         | ✅                      |
| Date et heure (sans fuseau horaire) | ✅                         | ✅                      |
| Horodatage Unix                   | ✅                         | ✅                      |
| Date (sans heure)                 | ✅                         | ✅                      |
| Heure                             | ✅                         | ✅                      |

### Types géométriques

| Type de champ | Base de données principale | Base de données externe |
|---------------|----------------------------|-------------------------|
| Point         | ✅                         | ✅                      |
| Ligne         | ✅                         | ✅                      |
| Cercle        | ✅                         | ✅                      |
| Polygone      | ✅                         | ✅                      |

### Types avancés

| Type de champ             | Base de données principale | Base de données externe |
|---------------------------|----------------------------|-------------------------|
| UUID                      | ✅                         | ✅                      |
| Nano ID                   | ✅                         | ✅                      |
| Tri                       | ✅                         | ✅                      |
| Formule de calcul         | ✅                         | ✅                      |
| Séquence automatique      | ✅                         | ✅                      |
| JSON                      | ✅                         | ✅                      |
| Sélecteur de collection   | ✅                         | ❌                      |
| Chiffrement               | ✅                         | ✅                      |

### Champs d'information système

| Type de champ             | Base de données principale | Base de données externe |
|---------------------------|----------------------------|-------------------------|
| Date de création          | ✅                         | ✅                      |
| Date de dernière modification | ✅                         | ✅                      |
| Créé par                  | ✅                         | ❌                      |
| Dernière modification par | ✅                         | ❌                      |
| OID de table              | ✅                         | ❌                      |

### Types d'association

| Type de champ                 | Base de données principale | Base de données externe |
|-------------------------------|----------------------------|-------------------------|
| Un à un                       | ✅                         | ✅                      |
| Un à plusieurs                | ✅                         | ✅                      |
| Plusieurs à un                | ✅                         | ✅                      |
| Plusieurs à plusieurs         | ✅                         | ✅                      |
| Plusieurs à plusieurs (tableau) | ✅                         | ✅                      |

:::info
Les champs de pièce jointe dépendent des collections de fichiers, qui ne sont prises en charge que par les bases de données principales. Par conséquent, les bases de données externes ne supportent pas actuellement les champs de pièce jointe.
:::

## 4. Comparaison du support de la sauvegarde et de la migration

| Fonctionnalité            | Base de données principale | Base de données externe |
|---------------------------|----------------------------|-------------------------|
| Sauvegarde et restauration | ✅                         | ❌ (À gérer par l'utilisateur) |
| Gestion de la migration   | ✅                         | ❌ (À gérer par l'utilisateur) |

:::info
NocoBase offre des capacités de sauvegarde, de restauration et de migration de structure pour les bases de données principales. Pour les bases de données externes, ces opérations doivent être effectuées indépendamment par les utilisateurs, en fonction de leur propre environnement de base de données. NocoBase ne fournit pas de support intégré.
:::

## Résumé comparatif

| Élément de comparaison          | Base de données principale                               | Base de données externe                                        |
|---------------------------------|----------------------------------------------------------|----------------------------------------------------------------|
| Types de bases de données       | PostgreSQL, MySQL, MariaDB, KingbaseES                   | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES          |
| Support des types de collections | Tous les types de collections                            | Uniquement les collections de base et les vues                 |
| Support des types de champs     | Tous les types de champs                                 | Tous les types de champs, à l'exception des champs de pièce jointe |
| Sauvegarde et migration         | Support intégré                                          | À gérer par l'utilisateur                                      |

## Recommandations

- **Si vous utilisez NocoBase pour construire un tout nouveau système métier**, veuillez utiliser la **base de données principale**. Cela vous permettra de profiter de toutes les fonctionnalités de NocoBase.
- **Si vous utilisez NocoBase pour vous connecter aux bases de données d'autres systèmes afin d'effectuer des opérations CRUD de base**, utilisez alors les **bases de données externes**.