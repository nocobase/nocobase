---
pkg: "@nocobase/plugin-multi-space"
---

# Multi-space

<PluginInfo name="multi-space" licenseBundled="professional"></PluginInfo>

## Introduction

Le **plugin Multi-space** permet de créer plusieurs espaces de données indépendants dans une seule instance d'application grâce à une isolation logique.

#### Cas d'usage
- **Multi-boutiques ou usines** : processus similaires, mais données isolées par unité métier.
- **Multi-organisations / filiales** : même plateforme partagée, avec données clients/produits/commandes séparées.

## Installation

Dans le gestionnaire de plugins, activez **Multi-Space**.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Guide d'utilisation

### Gestion des espaces

Après activation, ouvrez **Users & Permissions** puis l'onglet **Spaces**.

> Un **Unassigned Space** est présent par défaut pour consulter les anciennes données non associées.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Créer un espace

Cliquez sur **Add space**.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Assigner des utilisateurs

Après sélection d'un espace, configurez ses utilisateurs dans le panneau de droite.

> **Note :** après assignation, il faut **rafraîchir manuellement la page** pour mettre à jour la liste de bascule des espaces en haut à droite.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Changer et visualiser les espaces

Vous pouvez changer l'espace actif en haut à droite. En cliquant sur l'**icône œil** (active), vous visualisez simultanément les données de plusieurs espaces.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gestion des données multi-space

Après activation, un **champ Space** est ajouté automatiquement à la création d'une collection. **Seules les collections avec ce champ** sont gérées par la logique d'espace.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Pour les collections existantes, ajoutez ce champ manuellement.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Logique par défaut

1. À la création, les données sont liées automatiquement à l'espace actif.
2. Les filtres limitent automatiquement les données à l'espace actif.

### Classer les anciennes données par espace

Pour les données existantes avant activation du plugin :

#### 1. Ajouter le champ Space

Ajoutez manuellement le champ Space aux anciennes tables.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Assigner les utilisateurs à Unassigned Space

Associez les utilisateurs concernés à tous les espaces, y compris **Unassigned Space**.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Afficher les données de tous les espaces

En haut de page, activez l'affichage de tous les espaces.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configurer une page d'affectation des anciennes données

Créez une page dédiée et affichez le champ Space dans la **liste** et la **page d'édition**.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Rendez le champ Space modifiable.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Affecter manuellement les espaces

Éditez les données via cette page pour les affecter progressivement au bon espace (édition par lot possible).
