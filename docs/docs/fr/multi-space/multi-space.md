---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/multi-space/multi-space).
:::

# Multi-espace

## Présentation

Le **plugin Multi-espace** permet de disposer de plusieurs espaces de données indépendants au sein d'une seule instance d'application grâce à une isolation logique.

#### Cas d'utilisation
- **Plusieurs magasins ou usines** : les processus métier et les configurations système sont hautement cohérents (par exemple, gestion unifiée des stocks, planification de la production, stratégies de vente et modèles de rapports), mais les données de chaque unité commerciale doivent rester indépendantes.
- **Gestion multi-organisations ou filiales** : plusieurs organisations ou filiales d'un groupe partagent la même plateforme, mais chaque marque possède ses propres données de clients, de produits et de commandes.

## Installation

Recherchez le plugin **Multi-espace (Multi-Space)** dans le gestionnaire de plugins et activez-le.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Manuel d'utilisation

### Gestion multi-espace

Après avoir activé le plugin, accédez à la page de configuration **« Utilisateurs et permissions »** et basculez vers le panneau **Espaces** pour gérer les espaces.

> Par défaut, il existe un **Espace non assigné (Unassigned Space)** intégré, principalement utilisé pour visualiser les anciennes données qui n'ont pas encore été associées à un espace.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Créer un espace

Cliquez sur le bouton « Ajouter un espace » pour créer un nouvel espace :

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Assigner des utilisateurs

Après avoir sélectionné un espace créé, vous pouvez définir les utilisateurs appartenant à cet espace sur le côté droit :

> **Conseil :** Après avoir assigné des utilisateurs à un espace, vous devez **rafraîchir manuellement la page** pour que le sélecteur d'espace en haut à droite se mette à jour et affiche les derniers espaces.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Changer et visualiser les espaces

Vous pouvez changer l'espace actuel dans le coin supérieur droit.  
Lorsque vous cliquez sur l'**icône en forme d'œil** à droite (état mis en évidence), vous pouvez visualiser simultanément les données de plusieurs espaces.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gestion des données multi-espace

Une fois le plugin activé, le système pré-configurera automatiquement un **champ Espace** lors de la création d'une collection.  
**Seules les collections contenant ce champ seront incluses dans la logique de gestion des espaces.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Pour les collections existantes, vous pouvez ajouter manuellement un champ d'espace pour activer la gestion des espaces :

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Logique par défaut

Dans les collections incluant un champ d'espace, le système applique automatiquement la logique suivante :

1. Lors de la création de données, elles sont automatiquement associées à l'espace actuellement sélectionné ;
2. Lors du filtrage des données, elles sont automatiquement restreintes aux données de l'espace actuellement sélectionné.

### Classification des anciennes données par espace

Pour les données qui existaient avant l'activation du plugin Multi-espace, vous pouvez les classer dans des espaces en suivant ces étapes :

#### 1. Ajouter le champ Espace

Ajoutez manuellement un champ d'espace à l'ancienne collection :

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Assigner des utilisateurs à l'espace non assigné

Associez les utilisateurs gérant les anciennes données à tous les espaces, y compris l'**Espace non assigné (Unassigned Space)**, afin de visualiser les données qui n'ont pas encore été attribuées à un espace :

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Basculer pour afficher les données de tous les espaces

Sélectionnez l'option en haut pour visualiser les données de tous les espaces :

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configurer une page d'assignation des anciennes données

Créez une nouvelle page pour l'assignation des anciennes données. Affichez le « champ Espace » dans le **bloc Liste** et le **formulaire d'édition** pour ajuster manuellement l'attribution de l'espace.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Réglez le champ d'espace en mode éditable :

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Assigner manuellement les espaces de données

À l'aide de la page mentionnée ci-dessus, modifiez manuellement les données pour assigner progressivement le bon espace aux anciennes données (vous pouvez également configurer vous-même l'édition par lot).