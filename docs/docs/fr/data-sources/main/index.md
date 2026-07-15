---
title: "Base de données principale"
description: "Base de données principale de NocoBase : stocke les données des tables système et les données métier, prend en charge MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase, synchronise la structure des tables depuis la base de données, et permet de créer des tables ordinaires, arborescentes, SQL, etc."
keywords: "Base de données principale, MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase, synchronisation des tables de données"
---
# Base de données principale

## Introduction

La base de données configurée dans [Déployer NocoBase](/ai/install-nocobase-app) est utilisée pour stocker les données des tables système de NocoBase et peut également stocker les tables de données métier des utilisateurs.

Les versions et éditions commerciales des bases de données prises en charge par la base de données principale sont les suivantes :

| Base de données | Version prise en charge | Édition communautaire | Édition standard | Édition professionnelle | Édition entreprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 8.0.17 | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 10 | ✅ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.9 | ✅ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |

:::tip Remarque

KingbaseES prend uniquement en charge le mode de compatibilité PostgreSQL, tandis qu’OceanBase prend uniquement en charge le mode de compatibilité MySQL.

:::

## Installation des plug-ins

| Base de données | Plug-in correspondant | Méthode d’installation |
| --- | --- | --- |
| MySQL | Aucun | Plug-in intégré, aucune installation séparée n’est nécessaire. |
| PostgreSQL | Aucun | Plug-in intégré, aucune installation séparée n’est nécessaire. |
| MariaDB | Aucun | Plug-in intégré, aucune installation séparée n’est nécessaire. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Une licence commerciale est requise. Le plug-in est activé par défaut après l’installation. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Une licence commerciale est requise. Le plug-in est activé par défaut après l’installation. |

## Accéder à la source de données principale

1. Cliquez sur le menu des sources de données dans les fonctionnalités système pour accéder à la page d’accueil des sources de données.
2. Sélectionnez la source de données **Main** dans la liste, puis cliquez sur l’action **Configurer** pour accéder à la base de données principale et la gérer.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)

## Gestion de la source de données principale

La base de données principale fournit des fonctionnalités de gestion des tables de données : recherche, création, modification et suppression de tables, ainsi que synchronisation des champs des tables déjà présentes dans la base de données. Elle permet également de créer, modifier et supprimer les champs des tables de données.
- **Filtrer** : rechercher les tables de données gérées par la base de données principale de NocoBase
- **Créer une table de données** : ajouter une nouvelle table de données métier
- **Modifier** : modifier une table de données métier
- **Supprimer** : supprimer une table de données métier
- **Synchroniser depuis la base de données** : synchroniser la structure des tables déjà présentes dans la base de données
- **Configurer les champs** : créer, modifier et supprimer les champs des tables de données
-  **+** : le **+** de l’onglet permet de classer les tables de données et de créer, modifier ou supprimer des catégories
![main_datasource_management](https://static-docs.nocobase.com/main_datasource_management.png)

### Synchroniser les tables existantes depuis la base de données

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Une fonctionnalité importante de la source de données principale est la possibilité de synchroniser dans NocoBase les tables déjà présentes dans la base de données afin de les gérer. Cela signifie que :

- **Préserver les investissements existants** : si votre base de données contient déjà un grand nombre de tables métier, vous n’avez pas besoin de les recréer et pouvez les synchroniser directement pour les utiliser
- **Intégration flexible** : vous pouvez intégrer dans NocoBase les tables créées avec d’autres outils, tels que des scripts SQL ou des outils de gestion de bases de données
- **Migration progressive** : vous pouvez migrer progressivement un système existant vers NocoBase au lieu de le refondre en une seule fois

Grâce à la fonctionnalité « Charger depuis la base de données », vous pouvez :
1. Parcourir toutes les tables de la base de données
2. Sélectionner les tables à synchroniser
3. Identifier automatiquement la structure des tables et les types de champs
4. Importer en un clic les tables dans NocoBase pour les gérer

### Prise en charge de plusieurs types de structures de tables

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase prend en charge la création et la gestion de plusieurs types de tables de données :
- **Table ordinaire** : intègre les champs système couramment utilisés ;
- **Table héritée** : permet de créer une table parente, puis d’en dériver des tables enfants. Les tables enfants héritent de la structure de la table parente et peuvent également définir leurs propres colonnes.
- **Table arborescente** : table à structure arborescente, prenant actuellement uniquement en charge la conception par table d’adjacence ;
- **Table de calendrier** : utilisée pour créer des tables d’événements liés au calendrier ;
- **Table de fichiers** : utilisée pour gérer le stockage des fichiers ;
- **Table SQL** : ne constitue pas une table réelle de la base de données, mais permet d’afficher rapidement et de manière structurée une requête SQL ;
- **Table de vue** : se connecte aux vues existantes de la base de données ;

### Prise en charge de la gestion par catégories des tables de données

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Propose de nombreux types de champs

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Conversion flexible des types de champs

NocoBase prend en charge la conversion flexible des types de champs au sein d’un même type de base de données.

**Exemple : options de conversion d’un champ de type String**

Lorsqu’un champ de la base de données est de type String, il peut être converti dans NocoBase en l’une des formes suivantes :

- **Types de base** : texte sur une ligne, texte multiligne, numéro de téléphone mobile, adresse e-mail, URL, mot de passe, couleur, icône
- **Types de sélection** : menu déroulant (sélection unique), bouton radio
- **Types de contenu enrichi** : Markdown, Markdown (Vditor), texte enrichi, pièce jointe (URL)
- **Types de date et d’heure** : date et heure (avec fuseau horaire), date et heure (sans fuseau horaire)
- **Types avancés** : encodage automatique, sélecteur de table de données, chiffrement

Ce mécanisme de conversion flexible présente plusieurs avantages :
- **Aucune modification de la structure de la base de données nécessaire** : le type de stockage sous-jacent du champ reste inchangé ; seule sa représentation dans NocoBase est modifiée
- **Adaptation aux évolutions métier** : lorsque les besoins métier évoluent, vous pouvez rapidement ajuster le mode d’affichage et d’interaction du champ
- **Sécurité des données** : le processus de conversion n’affecte pas l’intégrité des données existantes

### Synchronisation flexible au niveau des champs

NocoBase permet non seulement de synchroniser une table entière, mais aussi de gérer précisément la synchronisation au niveau des champs :

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Caractéristiques de la synchronisation des champs :

1. **Synchronisation en temps réel** : lorsque la structure d’une table de la base de données change, vous pouvez synchroniser à tout moment les nouveaux champs
2. **Synchronisation sélective** : vous pouvez synchroniser uniquement les champs nécessaires, plutôt que tous les champs
3. **Reconnaissance automatique des types** : les types de champs de la base de données sont identifiés automatiquement et mappés vers les types de champs de NocoBase
4. **Préservation de l’intégrité des données** : le processus de synchronisation n’affecte pas les données existantes

#### Cas d’utilisation :

- **Évolution de la structure de la base de données** : lorsque les besoins métier évoluent et nécessitent l’ajout de nouveaux champs dans la base de données, ceux-ci peuvent être rapidement synchronisés dans NocoBase
- **Collaboration d’équipe** : lorsque d’autres membres de l’équipe ou les administrateurs de bases de données ajoutent des champs dans la base de données, vous pouvez les synchroniser rapidement
- **Mode de gestion hybride** : certains champs sont gérés par NocoBase et d’autres par des méthodes traditionnelles, ce qui permet une combinaison flexible

Ce mécanisme de synchronisation flexible permet à NocoBase de s’intégrer efficacement dans l’architecture technique existante, sans modifier le mode de gestion de la base de données en place, tout en bénéficiant de la simplicité du développement low-code offerte par NocoBase.

Pour plus d’informations, consultez le chapitre « [Champs des tables de données / Vue d’ensemble](../data-modeling/collection-fields/index.md) ».
