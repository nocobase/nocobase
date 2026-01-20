---
pkg: "@nocobase/plugin-multi-space"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Multi-espace

## Introduction

Le **plugin Multi-espace** permet de créer plusieurs espaces de données indépendants au sein d'une seule instance d'application, grâce à une isolation logique.

#### Cas d'utilisation
- **Plusieurs magasins ou usines** : Les processus métier et les configurations système sont très cohérents (par exemple, gestion unifiée des stocks, planification de la production, stratégies de vente et modèles de rapports), mais il est essentiel de garantir que les données de chaque unité commerciale ne s'interfèrent pas mutuellement.
- **Gestion multi-organisations ou filiales** : Plusieurs organisations ou filiales d'un groupe partagent la même plateforme, mais chaque marque possède ses propres données clients, produits et commandes.

## Installation

Dans le gestionnaire de plugins, recherchez le **plugin Multi-espace** et activez-le.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Manuel d'utilisation

### Gestion du Multi-espace

Après avoir activé le plugin, accédez à la page de paramètres **« Utilisateurs et permissions »** et basculez vers le panneau **Espaces** pour gérer les espaces.

> Initialement, il existe un **Espace non attribué** intégré, principalement utilisé pour visualiser les anciennes données qui ne sont associées à aucun espace.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Créer un espace

Cliquez sur le bouton « Ajouter un espace » pour créer un nouvel espace :

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Attribuer des utilisateurs

Après avoir sélectionné un espace créé, vous pouvez définir les utilisateurs appartenant à cet espace sur le côté droit :

> **Conseil :** Après avoir attribué des utilisateurs à un espace, vous devrez **actualiser manuellement la page** pour que la liste de commutation d'espace en haut à droite se mette à jour et affiche le dernier espace.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Basculer et visualiser le Multi-espace

Vous pouvez basculer l'espace actuel en haut à droite.
Lorsque vous cliquez sur l'**icône en forme d'œil** à droite (lorsqu'elle est en surbrillance), vous pouvez visualiser simultanément les données de plusieurs espaces.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gestion des données Multi-espace

Après avoir activé le plugin, le système ajoutera automatiquement un **champ Espace** lors de la création d'une collection.
**Seules les collections qui contiennent ce champ seront incluses dans la logique de gestion des espaces.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Pour les collections existantes, vous pouvez ajouter manuellement un champ Espace pour activer la gestion des espaces :

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Logique par défaut

Dans les collections qui contiennent le champ Espace, le système appliquera automatiquement la logique suivante :

1. Lors de la création de données, celles-ci sont automatiquement associées à l'espace actuellement sélectionné ;
2. Lors du filtrage des données, celles-ci sont automatiquement limitées aux données de l'espace actuellement sélectionné.

### Classification des anciennes données dans le Multi-espace

Pour les données qui existaient avant l'activation du plugin Multi-espace, vous pouvez les classer dans des espaces en suivant les étapes ci-dessous :

#### 1. Ajouter le champ Espace

Ajoutez manuellement le champ Espace à l'ancienne collection :

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Attribuer des utilisateurs à l'Espace non attribué

Associez l'utilisateur qui gère les anciennes données à tous les espaces, y compris l'**Espace non attribué**, afin de visualiser les données qui n'ont pas encore été attribuées à un espace :

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Basculer pour visualiser toutes les données d'espace

En haut, sélectionnez l'option pour visualiser les données de tous les espaces :

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configurer une page pour l'attribution des anciennes données

Créez une nouvelle page pour l'attribution des anciennes données. Affichez le « champ Espace » sur la **page de liste** et la **page d'édition** afin d'ajuster manuellement l'attribution de l'espace.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Rendez le champ Espace modifiable.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Attribuer manuellement des données aux espaces

Via la page créée ci-dessus, modifiez manuellement les données pour attribuer progressivement le bon espace aux anciennes données (vous pouvez également configurer vous-même l'édition en masse).