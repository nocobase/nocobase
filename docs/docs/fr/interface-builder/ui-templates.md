---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/interface-builder/ui-templates).
:::

# Modèles d'interface utilisateur (UI)

## Introduction

Les modèles d'interface utilisateur sont utilisés pour réutiliser les configurations lors de la construction de l'interface, réduisant ainsi les tâches répétitives et permettant de maintenir la synchronisation des configurations à plusieurs endroits si nécessaire.

Les types de modèles actuellement pris en charge comprennent :

- **Modèle de bloc** : réutilise la configuration d'un bloc entier.
- **Modèle de champ** : réutilise la configuration de la "zone de champs" des blocs de formulaire ou de détails.
- **Modèle de fenêtre contextuelle (Popup)** : réutilise la configuration des fenêtres contextuelles déclenchées par des actions ou des champs.

## Concepts clés

### Référence et Copie

Il existe généralement deux façons d'utiliser les modèles :

- `Référence` : plusieurs emplacements partagent la même configuration de modèle ; toute modification du modèle ou de l'un des points de référence synchronisera les mises à jour partout ailleurs.
- `Copie` : duplique en tant que configuration indépendante ; les modifications ultérieures n'ont aucun impact les unes sur les autres.

### Enregistrer en tant que modèle

Lorsqu'un bloc ou une fenêtre contextuelle est déjà configuré, vous pouvez utiliser l'option `Enregistrer en tant que modèle` dans son menu de réglages et choisir la méthode d'enregistrement :

- `Convertir le ... actuel en modèle` : après l'enregistrement, l'emplacement actuel passera en mode référence à ce modèle.
- `Copier le ... actuel en tant que modèle` : crée uniquement le modèle, l'emplacement actuel reste inchangé.

## Modèle de bloc

### Enregistrer un bloc en tant que modèle

1) Ouvrez le menu de réglages du bloc cible, cliquez sur `Enregistrer en tant que modèle`.  
2) Remplissez le `Nom du modèle` / `Description du modèle`, et choisissez le mode d'enregistrement :
   - `Convertir le bloc actuel en modèle` : après l'enregistrement, l'emplacement actuel sera remplacé par un bloc de type `Modèle de bloc` (c'est-à-dire une référence à ce modèle).
   - `Copier le bloc actuel en tant que modèle` : crée uniquement le modèle, le bloc actuel reste inchangé.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Utiliser un modèle de bloc

1) Ajouter un bloc → "Autres blocs" → `Modèle de bloc`  
2) Dans la configuration, sélectionnez :
   - `Modèle` : choisissez un modèle.
   - `Mode` : `Référence` ou `Copie`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Convertir une référence en copie

Lorsqu'un bloc référence un modèle, vous pouvez utiliser l'option `Convertir la référence en copie` dans le menu de réglages du bloc pour transformer le bloc actuel en un bloc standard (rompre la référence) ; les modifications ultérieures seront indépendantes.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Remarques

- Le mode `Copie` régénérera les UID du bloc et de ses nœuds enfants ; certaines configurations dépendantes des UID pourraient nécessiter un nouveau paramétrage.

## Modèle de champ

Les modèles de champs sont utilisés pour réutiliser la configuration de la zone de champs (sélection des champs, mise en page et configuration des champs) dans les **blocs de formulaire** et les **blocs de détails**, évitant ainsi l'ajout répétitif de champs sur plusieurs pages ou blocs.

> Le modèle de champ ne s'applique qu'à la "zone de champs" et ne remplace pas le bloc entier. Pour réutiliser un bloc complet, veuillez utiliser le modèle de bloc décrit précédemment.

### Utiliser un modèle de champ dans les blocs de formulaire/détails

1) Entrez en mode configuration, ouvrez le menu "Champs" dans un bloc de formulaire ou de détails.  
2) Sélectionnez `Modèle de champ`.  
3) Choisissez un modèle et sélectionnez le mode : `Référence` ou `Copie`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Avertissement de remplacement

Lorsque des champs existent déjà dans le bloc, l'utilisation du mode **Référence** affichera généralement une demande de confirmation (car les champs référencés remplaceront la zone de champs actuelle).

### Convertir les champs référencés en copie

Lorsqu'un bloc référence un modèle de champ, vous pouvez utiliser l'option `Convertir les champs référencés en copie` dans le menu de réglages du bloc pour rendre la zone de champs actuelle indépendante (rompre la référence).

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Remarques

- Les modèles de champs s'appliquent uniquement aux **blocs de formulaire** et aux **blocs de détails**.
- Si la table de données liée au modèle et celle du bloc actuel ne correspondent pas, le modèle apparaîtra comme indisponible dans le sélecteur avec l'explication correspondante.
- Si vous souhaitez effectuer des "ajustements personnalisés" sur les champs du bloc actuel, il est recommandé d'utiliser directement le mode `Copie` ou d'exécuter d'abord "Convertir les champs référencés en copie".

## Modèle de fenêtre contextuelle (Popup)

Les modèles de fenêtres contextuelles sont utilisés pour réutiliser un ensemble d'interfaces et de logiques d'interaction. Pour les configurations générales telles que le mode d'ouverture et la taille, reportez-vous à [Modifier la fenêtre contextuelle](/interface-builder/actions/action-settings/edit-popup).

### Enregistrer une fenêtre contextuelle en tant que modèle

1) Ouvrez le menu de réglages du bouton ou du champ déclenchant la fenêtre, cliquez sur `Enregistrer en tant que modèle`.  
2) Remplissez le nom/description du modèle et choisissez le mode d'enregistrement :
   - `Convertir la fenêtre contextuelle actuelle en modèle` : après l'enregistrement, la fenêtre actuelle passera en mode référence à ce modèle.
   - `Copier la fenêtre contextuelle actuelle en tant que modèle` : crée uniquement le modèle, la fenêtre actuelle reste inchangée.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Utiliser un modèle dans la configuration de la fenêtre contextuelle

1) Ouvrez la configuration de la fenêtre contextuelle du bouton ou du champ.  
2) Sélectionnez un modèle dans `Modèle de fenêtre contextuelle` pour le réutiliser.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Conditions d'utilisation (Portée de disponibilité)

Les modèles de fenêtres contextuelles sont liés au contexte de l'action qui les déclenche. Le sélecteur filtrera ou désactivera automatiquement les modèles incompatibles selon le scénario actuel (avec indication de la raison en cas de non-respect des conditions).

| Type d'action actuelle | Modèles de fenêtres contextuelles disponibles |
| --- | --- |
| **Action de collection** | Modèles créés par des actions de collection de la même collection. |
| **Action d'enregistrement non associée** | Modèles créés par des actions de collection ou des actions d'enregistrement non associées de la même collection. |
| **Action d'enregistrement associée** | Modèles créés par des actions de collection ou des actions d'enregistrement non associées de la même collection ; ou modèles créés par des actions d'enregistrement associées du même champ d'association. |

### Fenêtres contextuelles de données relationnelles

Les modèles de fenêtres contextuelles déclenchés par des données relationnelles (champs d'association) ont des règles de correspondance spécifiques :

#### Correspondance stricte pour les modèles de fenêtres relationnelles

Lorsqu'un modèle est créé à partir d'une **action d'enregistrement associée** (le modèle possède un `associationName`), ce modèle ne peut être utilisé que par des actions ou des champs utilisant **exactement le même champ d'association**.

Par exemple : un modèle créé sur le champ d'association `Commande.Client` ne peut être utilisé que par d'autres actions du champ `Commande.Client`. Il ne peut pas être utilisé par le champ `Commande.Parrain` (même si les deux ciblent la table de données `Client`).

C'est parce que les variables internes et les configurations des modèles de fenêtres relationnelles dépendent du contexte spécifique de la relation d'association.

#### Réutilisation des modèles de la collection cible par les actions relationnelles

Les champs ou actions d'association peuvent réutiliser des **modèles de fenêtres non relationnelles de la table de données cible** (modèles créés par des actions de collection ou des actions d'enregistrement non associées), tant que la table de données correspond.

Par exemple : le champ d'association `Commande.Client` peut utiliser les modèles de la table `Client`. Cette approche est idéale pour partager une même configuration de fenêtre entre plusieurs champs d'association (comme une fenêtre de détails client unifiée).

### Convertir une référence en copie

Lorsqu'une fenêtre contextuelle référence un modèle, vous pouvez utiliser l'option `Convertir la référence en copie` dans le menu de réglages pour rendre la fenêtre actuelle indépendante (rompre la référence).

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Gestion des modèles

Dans Réglages du système → `Modèles d'interface utilisateur`, vous pouvez visualiser et gérer tous les modèles :

- **Modèles de blocs (v2)** : gérer les modèles de blocs.
- **Modèles de fenêtres contextuelles (v2)** : gérer les modèles de fenêtres contextuelles.

> Les modèles de champs proviennent des modèles de blocs et sont gérés au sein de ceux-ci.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Opérations prises en charge : Visualiser, Filtrer, Modifier, Supprimer.

> **Note** : Si un modèle est actuellement référencé, il ne peut pas être supprimé directement. Veuillez d'abord utiliser `Convertir la référence en copie` aux emplacements référençant ce modèle pour rompre le lien, puis supprimez le modèle.