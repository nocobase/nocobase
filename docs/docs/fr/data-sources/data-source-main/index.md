---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Base de données principale

## Introduction

La base de données principale de NocoBase sert à la fois à stocker les données métier et les métadonnées de l'application, y compris les données des tables système et des tables personnalisées. Elle prend en charge les bases de données relationnelles comme MySQL, PostgreSQL, etc. Lors de l'installation de l'application NocoBase, la base de données principale est installée simultanément et ne peut pas être supprimée.

## Installation

C'est un plugin intégré, aucune installation séparée n'est requise.

## Gestion des collections

La source de données principale offre des fonctionnalités complètes de gestion des collections. Vous pouvez créer de nouvelles tables directement via NocoBase ou synchroniser des structures de tables existantes depuis votre base de données.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Synchronisation des tables existantes depuis la base de données

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Une caractéristique essentielle de la source de données principale est sa capacité à synchroniser des tables déjà présentes dans votre base de données pour les gérer au sein de NocoBase. Cela signifie :

- **Protégez vos investissements existants** : Si votre base de données contient déjà de nombreuses tables métier, vous n'avez pas besoin de les recréer ; vous pouvez les synchroniser et les utiliser directement.
- **Intégration flexible** : Les tables créées avec d'autres outils (comme des scripts SQL, des outils de gestion de base de données, etc.) peuvent être intégrées à la gestion de NocoBase.
- **Migration progressive** : NocoBase prend en charge la migration progressive des systèmes existants, plutôt qu'une refonte complète en une seule fois.

Grâce à la fonctionnalité « Charger depuis la base de données », vous pouvez :
1. Parcourir toutes les tables de la base de données
2. Sélectionner les tables que vous souhaitez synchroniser
3. Identifier automatiquement les structures de tables et les types de champs
4. Les importer en un clic dans NocoBase pour les gérer

### Prise en charge de plusieurs types de collections

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase prend en charge la création et la gestion de divers types de collections :
- **Collection générale** : intègre les champs système couramment utilisés ;
- **Collection d'héritage** : permet de créer une table parente à partir de laquelle des tables enfants peuvent être dérivées. Les tables enfants héritent de la structure de la table parente tout en pouvant définir leurs propres colonnes.
- **Collection arborescente** : une table structurée en arbre, qui ne prend actuellement en charge que la conception par liste d'adjacence ;
- **Collection de calendrier** : pour créer des tables d'événements liées au calendrier ;
- **Collection de fichiers** : pour la gestion du stockage de fichiers ;
- **Collection d'expressions** : pour les scénarios d'expressions dynamiques dans les flux de travail ;
- **Collection SQL** : il ne s'agit pas d'une table de base de données réelle, mais d'une manière rapide de présenter des requêtes SQL de manière structurée ;
- **Collection de vues de base de données** : se connecte aux vues de base de données existantes ;
- **Collection FDW** : permet au système de base de données d'accéder et d'interroger directement les données de sources de données externes, basée sur la technologie FDW ;

### Prise en charge de la gestion par catégorie des collections

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Types de champs variés

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Conversion flexible des types de champs

NocoBase prend en charge la conversion flexible des types de champs au sein d'un même type de base de données.

**Exemple : Options de conversion pour les champs de type Chaîne de caractères (String)**

Lorsqu'un champ de base de données est de type Chaîne de caractères (String), vous pouvez le convertir dans NocoBase vers l'une des formes suivantes :

- **Types de base** : Texte sur une ligne, Texte long, Numéro de téléphone, E-mail, URL, Mot de passe, Couleur, Icône
- **Types de sélection** : Menu déroulant (sélection unique), Boutons radio
- **Types de médias enrichis** : Markdown, Markdown (Vditor), Texte enrichi, Pièce jointe (URL)
- **Types de date et heure** : Date et heure (avec fuseau horaire), Date et heure (sans fuseau horaire)
- **Types avancés** : Séquence, Sélecteur de collection, Chiffrement

Ce mécanisme de conversion flexible signifie que :
- **Aucune modification de la structure de la base de données requise** : Le type de stockage sous-jacent du champ reste inchangé ; seule sa représentation dans NocoBase est modifiée.
- **Adaptation aux évolutions métier** : À mesure que les besoins métier évoluent, vous pouvez rapidement ajuster la manière dont les champs sont affichés et interagissent.
- **Sécurité des données** : Le processus de conversion n'affecte pas l'intégrité des données existantes.

### Synchronisation flexible au niveau des champs

NocoBase ne se contente pas de synchroniser des tables entières ; il prend également en charge une gestion de synchronisation granulaire au niveau des champs :

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Caractéristiques de la synchronisation des champs :

1. **Synchronisation en temps réel** : Lorsque la structure d'une table de base de données change, les nouveaux champs ajoutés peuvent être synchronisés à tout moment.
2. **Synchronisation sélective** : Vous pouvez synchroniser sélectivement les champs dont vous avez besoin, plutôt que tous les champs.
3. **Reconnaissance automatique des types** : Identifie automatiquement les types de champs de la base de données et les mappe aux types de champs de NocoBase.
4. **Maintien de l'intégrité des données** : Le processus de synchronisation n'affecte pas les données existantes.

#### Cas d'utilisation :

1. **Évolution du schéma de base de données** : Lorsque les besoins métier changent et que de nouveaux champs doivent être ajoutés à la base de données, ils peuvent être rapidement synchronisés avec NocoBase.
2. **Collaboration d'équipe** : Lorsque d'autres membres de l'équipe ou des administrateurs de base de données (DBA) ajoutent des champs à la base de données, ceux-ci peuvent être synchronisés rapidement.
3. **Mode de gestion hybride** : Certains champs sont gérés via NocoBase, d'autres via des méthodes traditionnelles – offrant des combinaisons flexibles.

Ce mécanisme de synchronisation flexible permet à NocoBase de s'intégrer parfaitement aux architectures techniques existantes, sans nécessiter de modifier les pratiques de gestion de base de données actuelles, tout en bénéficiant de la commodité du développement low-code qu'offre NocoBase.

Pour en savoir plus, consultez la section « [Champs de collection / Vue d'ensemble](/data-sources/data-modeling/collection-fields) ».