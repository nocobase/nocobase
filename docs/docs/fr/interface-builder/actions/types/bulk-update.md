---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Mise à jour en masse

## Introduction

L'action de mise à jour en masse est utilisée lorsque vous devez appliquer la même mise à jour à un groupe d'enregistrements. Avant d'effectuer une mise à jour en masse, vous devez définir au préalable la logique d'affectation des champs pour la mise à jour. Cette logique sera appliquée à tous les enregistrements sélectionnés lorsque vous cliquerez sur le bouton de mise à jour.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Configuration de l'action

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Données à mettre à jour

Sélectionné/Tout, par défaut : Sélectionné.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Affectation des champs

Définissez les champs à mettre à jour en masse. Seuls les champs configurés seront mis à jour.

Comme illustré, configurez l'action de mise à jour en masse dans le tableau des commandes pour mettre à jour en masse les données sélectionnées avec le statut « En attente d'approbation ».

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Modifier le bouton](/interface-builder/actions/action-settings/edit-button) : Modifiez le titre, le type et l'icône du bouton ;
- [Règle de liaison](/interface-builder/actions/action-settings/linkage-rule) : Affichez/masquez dynamiquement le bouton ;
- [Double vérification](/interface-builder/actions/action-settings/double-check)