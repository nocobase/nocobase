---
title: "Base de données principale"
description: "Base de données principale de NocoBase : stocke les données des tables système et les données métier, prend en charge MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase, synchronise la structure des tables depuis la base de données et permet de créer des tables ordinaires, arborescentes, SQL, etc."
keywords: "Base de données principale, MySQL, PostgreSQL, MariaDB, KingbaseES, OceanBase, synchronisation des tables de données"
---
# Base de données principale

## Présentation

La base de données configurée dans [Déployer NocoBase](/ai/install-nocobase-app) est utilisée pour stocker les données des tables système de NocoBase et prend également en charge le stockage des tables métier des utilisateurs.

Les versions et éditions commerciales prises en charge par la base de données principale sont les suivantes :

| Base de données | Versions prises en charge | Édition communautaire | Édition standard | Édition professionnelle | Édition entreprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 8.0.17 | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 10 | ✅ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.9 | ✅ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |

:::tip Remarque

KingbaseES prend uniquement en charge le mode compatible PostgreSQL, tandis qu’OceanBase prend uniquement en charge le mode compatible MySQL.

:::

## Installation des plugins

| Base de données | Plugin correspondant | Méthode d’installation |
| --- | --- | --- |
| MySQL | Aucun | Plugin intégré, aucune installation séparée n’est nécessaire. |
| PostgreSQL | Aucun | Plugin intégré, aucune installation séparée n’est nécessaire. |
| MariaDB | Aucun | Plugin intégré, aucune installation séparée n’est nécessaire. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Une licence commerciale est requise ; le plugin est activé par défaut après l’installation. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Une licence commerciale est requise ; le plugin est activé par défaut après l’installation. |

## Accéder à la source de données principale

1. Cliquez sur le menu des sources de données dans les fonctions système pour accéder à la page d’accueil des sources de données.
2. Sélectionnez la source de données **Main** dans la liste, puis cliquez sur l’action **Configurer** pour accéder à la base de données principale et la gérer.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)

## Gestion de la source de données principale

La base de données principale fournit des fonctions de gestion des tables de données : rechercher, créer, modifier et supprimer des tables, ainsi que synchroniser les champs des tables déjà présentes dans la base de données. Elle permet également de créer, modifier et supprimer les champs des tables de données.
- **Filtrer** : rechercher les tables de données gérées par la base de données principale de NocoBase
- **Créer une table de données** : ajouter une table de données métier
- **Modifier** : modifier une table de données métier
- **Supprimer** : supprimer une table de données métier
- **Synchroniser depuis la base de données** : synchroniser la structure des tables déjà présentes dans la base de données
- **Configurer les champs** : créer, modifier et supprimer les champs des tables de données
-  **+** : le **+** de l’onglet permet de gérer les catégories de tables de données, ainsi que de créer, modifier et supprimer des catégories
![main_datasource_management](https://static-docs.nocobase.com/main_datasource_management.png)

### Synchroniser les tables existantes depuis la base de données

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Une fonctionnalité importante de la source de données principale est de pouvoir synchroniser les tables déjà présentes dans la base de données afin de les gérer dans NocoBase. Cela signifie que :

- **Préserver les investissements existants** : si votre base de données contient déjà un grand nombre de tables métier, il n’est pas nécessaire de les recréer ; vous pouvez les synchroniser directement et les utiliser
- **Intégration flexible** : les tables créées avec d’autres outils, tels que des scripts SQL ou des outils de gestion de bases de données, peuvent être intégrées à la gestion de NocoBase
- **Migration progressive** : vous pouvez migrer progressivement un système existant vers NocoBase au lieu de le reconstruire entièrement en une seule fois

Grâce à la fonction « Charger depuis la base de données », vous pouvez :
1. Parcourir toutes les tables de la base de données
2. Sélectionner les tables à synchroniser
3. Identifier automatiquement la structure des tables et les types de champs
4. Importer en un clic les tables dans NocoBase pour les gérer

### Prise en charge de plusieurs types de structures de tables

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase prend en charge la création et la gestion de plusieurs types de tables de données :
- **Table ordinaire** : contient des champs système couramment utilisés ;
- **Table héritée** : vous pouvez créer une table parent, puis en dériver des tables enfants. Les tables enfants héritent de la structure de la table parent et peuvent également définir leurs propres colonnes.
- **Table arborescente** : table structurée en arborescence, prenant actuellement uniquement en charge la conception par table d’adjacence ;
- **Table de calendrier** : utilisée pour créer des tables d’événements liés au calendrier ;
- **Table de fichiers** : utilisée pour gérer le stockage des fichiers ;
- **Table SQL** : ne correspond pas à une véritable table de base de données, mais permet d’afficher rapidement et de manière structurée le résultat d’une requête SQL ;
- **Table de vue** : se connecte aux vues existantes de la base de données ;

### Prise en charge de la gestion des catégories de tables de données

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Fournit un grand choix de types de champs

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Conversion flexible des types de champs

NocoBase prend en charge la conversion flexible des types de champs au sein d’un même type de base de données.

**Exemple : options de conversion d’un champ de type String**

Lorsqu’un champ de la base de données est de type String, il peut être converti dans NocoBase en l’une des formes suivantes :

- **Types de base** : texte sur une ligne, texte multiligne, numéro de téléphone mobile, adresse e-mail, URL, mot de passe, couleur, icône
- **Types de sélection** : menu déroulant (sélection unique), bouton radio
- **Types de contenu enrichi** : Markdown, Markdown (Vditor), texte enrichi, pièce jointe (URL)
- **Types date et heure** : date et heure (avec fuseau horaire), date et heure (sans fuseau horaire)
- **Types avancés** : codage automatique, sélecteur de table de données, chiffrement

Ce mécanisme de conversion flexible signifie que :
- **Aucune modification de la structure de la base de données n’est nécessaire** : le type de stockage sous-jacent du champ reste inchangé ; seule sa forme de présentation dans NocoBase est modifiée
- **Adaptation aux changements métier** : les modes d’affichage et d’interaction des champs peuvent être ajustés rapidement en fonction de l’évolution des besoins métier
- **Sécurité des données** : le processus de conversion n’affecte pas l’intégrité des données existantes

### Synchronisation flexible au niveau des champs

NocoBase permet non seulement de synchroniser une table entière, mais aussi de gérer précisément la synchronisation au niveau des champs :

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Caractéristiques de la synchronisation des champs :

1. **Synchronisation en temps réel** : lorsque la structure de la table de la base de données est modifiée, les nouveaux champs peuvent être synchronisés à tout moment
2. **Synchronisation sélective** : vous pouvez synchroniser uniquement les champs nécessaires, plutôt que tous les champs
3. **Identification automatique des types** : les types de champs de la base de données sont identifiés automatiquement et mappés vers les types de champs de NocoBase
4. **Préservation de l’intégrité des données** : le processus de synchronisation n’affecte pas les données existantes

#### Cas d’utilisation :

- **Évolution de la structure de la base de données** : lorsque les besoins métier évoluent et qu’il faut ajouter de nouveaux champs à la base de données, ceux-ci peuvent être rapidement synchronisés avec NocoBase
- **Collaboration d’équipe** : lorsque d’autres membres de l’équipe ou les administrateurs de bases de données ajoutent des champs dans la base de données, ceux-ci peuvent être synchronisés rapidement
- **Mode de gestion hybride** : certains champs sont gérés via NocoBase et d’autres selon des méthodes traditionnelles, ce qui permet une combinaison flexible

Ce mécanisme de synchronisation flexible permet à NocoBase de s’intégrer harmonieusement à l’architecture technique existante, sans modifier le mode de gestion actuel de la base de données, tout en bénéficiant de la simplicité du développement low-code offerte par NocoBase.

Pour plus d’informations, consultez le chapitre « [Champs des tables de données / Présentation](../data-modeling/collection-fields/index.md) ».