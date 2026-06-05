---
pkg: "@nocobase/plugin-block-list"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Bloc Liste

## Introduction

Le bloc Liste affiche les données sous forme de liste. Il est idéal pour des scénarios d'affichage de données tels que des listes de tâches, des actualités ou des informations sur des produits.

## Configuration du bloc

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Définir la portée des données

Comme illustré : filtrez les commandes dont le statut est « Annulé ».

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Pour plus de détails, consultez [Définir la portée des données](/interface-builder/blocks/block-settings/data-scope)

### Définir les règles de tri

Comme illustré : triez par montant de commande, par ordre décroissant.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Pour plus de détails, consultez [Définir les règles de tri](/interface-builder/blocks/block-settings/sorting-rule)

## Configurer les champs

### Champs de cette collection

> **Note** : Les champs des collections héritées (c'est-à-dire les champs des collections parentes) sont automatiquement fusionnés et affichés dans la liste des champs actuelle.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Champs des collections associées

> **Note** : Les champs des collections associées peuvent être affichés (actuellement, seules les relations un-à-un sont prises en charge).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Pour la configuration des champs de liste, consultez [Champ de détails](/interface-builder/fields/generic/detail-form-item)

## Configurer les actions

### Actions globales

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

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

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [Modifier](/interface-builder/actions/types/edit)
- [Supprimer](/interface-builder/actions/types/delete)
- [Lien](/interface-builder/actions/types/link)
- [Fenêtre contextuelle](/interface-builder/actions/types/pop-up)
- [Mettre à jour l'enregistrement](/interface-builder/actions/types/update-record)
- [Impression de modèle](/template-print/index)
- [Déclencher un flux de travail](/interface-builder/actions/types/trigger-workflow)
- [Action JS](/interface-builder/actions/types/js-action)
- [Employé IA](/interface-builder/actions/types/ai-employee)