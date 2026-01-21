:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Bloc Tableau

## Introduction

Le bloc Tableau est l'un des blocs de données fondamentaux intégrés à **NocoBase**. Il sert principalement à afficher et à gérer des données structurées sous forme de tableau. Il offre des options de configuration flexibles, permettant aux utilisateurs de personnaliser les colonnes du tableau, leur largeur, les règles de tri et la portée des données, afin de s'assurer que les données affichées répondent à des besoins métier spécifiques.

#### Fonctionnalités clés :
- **Configuration flexible des colonnes** : Vous pouvez personnaliser les colonnes et leur largeur pour répondre à divers besoins d'affichage des données.
- **Règles de tri** : Le bloc prend en charge le tri des données du tableau. Vous pouvez organiser les données par ordre croissant ou décroissant en fonction de différents champs.
- **Définition de la portée des données** : En définissant la portée des données, vous contrôlez la plage de données affichées, évitant ainsi l'interférence de données non pertinentes.
- **Configuration des actions** : Le bloc Tableau intègre diverses options d'action. Vous pouvez facilement configurer des actions telles que Filtrer, Ajouter, Modifier et Supprimer pour une gestion rapide des données.
- **Édition rapide** : Il prend en charge l'édition directe des données au sein du tableau, ce qui simplifie le processus opérationnel et améliore l'efficacité du travail.

## Paramètres du bloc

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Règles de liaison du bloc

Contrôlez le comportement du bloc (par exemple, s'il doit être affiché ou exécuter du JavaScript) via les règles de liaison.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Pour plus de détails, consultez les [Règles de liaison](/interface-builder/linkage-rule)

### Définir la portée des données

Exemple : Par défaut, filtrez les commandes dont le « Statut » est « Payé ».

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Pour plus de détails, consultez [Définir la portée des données](/interface-builder/blocks/block-settings/data-scope)

### Définir les règles de tri

Exemple : Affichez les commandes par date, en ordre décroissant.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Pour plus de détails, consultez [Définir les règles de tri](/interface-builder/blocks/block-settings/sorting-rule)

### Activer l'édition rapide

Activez l'option « Activer l'édition rapide » dans les paramètres du bloc et des colonnes du tableau pour personnaliser les colonnes qui peuvent être éditées rapidement.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Activer le tableau arborescent

Lorsque la table de données est une table hiérarchique (arborescente), le bloc Tableau peut activer la fonctionnalité **« Activer le tableau arborescent »**. Par défaut, cette option est désactivée. Une fois activé, le bloc affichera les données dans une structure arborescente et prendra en charge les options de configuration et les opérations correspondantes.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Développer toutes les lignes par défaut

Lorsque le tableau arborescent est activé, le bloc prend en charge le développement par défaut de toutes les données enfants lors de son chargement.

## Configurer les champs

### Champs de cette collection

> **Remarque** : Les champs des collections héritées (c'est-à-dire les champs de la collection parente) sont automatiquement fusionnés et affichés dans la liste des champs actuelle.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Champs des collections associées

> **Remarque** : Le bloc prend en charge l'affichage des champs des collections associées (actuellement, seules les relations un-à-un sont prises en charge).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Autres colonnes personnalisées

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [Champ JS](/interface-builder/fields/specific/js-field)
- [Colonne JS](/interface-builder/fields/specific/js-column)

## Configurer les actions

### Actions globales

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Filtrer](/interface-builder/actions/types/filter)
- [Ajouter](/interface-builder/actions/types/add-new)
- [Supprimer](/interface-builder/actions/types/delete)
- [Actualiser](/interface-builder/actions/types/refresh)
- [Importer](/interface-builder/actions/types/import)
- [Exporter](/interface-builder/actions/types/export)
- [Impression de modèle](/template-print/index)
- [Mise à jour en masse](/interface-builder/actions/types/bulk-update)
- [Exporter les pièces jointes](/interface-builder/actions/types/export-attachments)
- [Déclencher un flux de travail](/interface-builder/actions/types/trigger-workflow)
- [Action JS](/interface-builder/actions/types/js-action)
- [Employé IA](/interface-builder/actions/types/ai-employee)

### Actions de ligne

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Afficher](/interface-builder/actions/types/view)
- [Modifier](/interface-builder/actions/types/edit)
- [Supprimer](/interface-builder/actions/types/delete)
- [Fenêtre contextuelle](/interface-builder/actions/types/pop-up)
- [Lien](/interface-builder/actions/types/link)
- [Mettre à jour l'enregistrement](/interface-builder/actions/types/update-record)
- [Impression de modèle](/template-print/index)
- [Déclencher un flux de travail](/interface-builder/actions/types/trigger-workflow)
- [Action JS](/interface-builder/actions/types/js-action)
- [Employé IA](/interface-builder/actions/types/ai-employee)