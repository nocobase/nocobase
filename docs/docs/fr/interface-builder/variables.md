:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Variables

## Introduction

Les variables sont des marqueurs qui identifient une valeur dans le contexte actuel. Vous pouvez les utiliser dans divers scénarios, comme la configuration des périmètres de données des blocs, les valeurs par défaut des champs, les règles de liaison et les flux de travail.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Variables actuellement prises en charge

### Utilisateur actuel

Représente les données de l'utilisateur actuellement connecté.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Rôle actuel

Représente l'identifiant du rôle (nom du rôle) de l'utilisateur actuellement connecté.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Formulaire actuel

Les valeurs du formulaire actuel, utilisées uniquement dans les blocs de formulaire. Les cas d'utilisation incluent :

- Les règles de liaison pour le formulaire actuel
- Les valeurs par défaut des champs de formulaire (uniquement valables lors de l'ajout de nouvelles données)
- Les paramètres de périmètre de données pour les champs de relation
- La configuration d'affectation de valeurs aux champs pour les actions de soumission

#### Règles de liaison pour le formulaire actuel

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Valeurs par défaut des champs de formulaire (pour les nouveaux formulaires uniquement)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

#### Paramètres de périmètre de données pour les champs de relation

Permet de filtrer dynamiquement les options d'un champ aval en fonction d'un champ amont, garantissant ainsi une saisie de données précise.

**Exemple :**

1. L'utilisateur sélectionne une valeur pour le champ **Owner**.
2. Le système filtre automatiquement les options du champ **Account** en fonction du **userName** de l'Owner sélectionné.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

### Enregistrement actuel

Un enregistrement fait référence à une ligne dans une **collection**, chaque ligne représentant un enregistrement unique. La variable « Enregistrement actuel » est disponible dans les **règles de liaison pour les actions de ligne** des blocs d'affichage.

Exemple : Désactiver le bouton de suppression pour les documents « Payés ».

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Enregistrement de la fenêtre contextuelle actuelle

Les actions de fenêtre contextuelle jouent un rôle très important dans la configuration de l'interface NocoBase.

- Fenêtre contextuelle pour les actions de ligne : Chaque fenêtre contextuelle dispose d'une variable « Enregistrement de la fenêtre contextuelle actuelle », représentant l'enregistrement de la ligne actuelle.
- Fenêtre contextuelle pour les champs de relation : Chaque fenêtre contextuelle dispose d'une variable « Enregistrement de la fenêtre contextuelle actuelle », représentant l'enregistrement de relation sur lequel vous avez cliqué.

Les blocs à l'intérieur d'une fenêtre contextuelle peuvent utiliser la variable « Enregistrement de la fenêtre contextuelle actuelle ». Les cas d'utilisation associés incluent :

- La configuration du périmètre de données d'un bloc
- La configuration du périmètre de données d'un champ de relation
- La configuration des valeurs par défaut des champs (dans un formulaire pour l'ajout de nouvelles données)
- La configuration des règles de liaison pour les actions

### Paramètres de requête d'URL

Cette variable représente les paramètres de requête dans l'URL de la page actuelle. Elle n'est disponible que si une chaîne de requête est présente dans l'URL de la page. Son utilisation est plus pratique avec l'[action de lien](/interface-builder/actions/types/link).

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### Jeton API

La valeur de cette variable est une chaîne de caractères, qui sert de justificatif pour accéder à l'API NocoBase. Elle peut être utilisée pour vérifier l'identité de l'utilisateur.

### Type d'appareil actuel

Exemple : Ne pas afficher l'action « Imprimer le modèle » sur les appareils non-PC.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)