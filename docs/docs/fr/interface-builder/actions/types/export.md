---
pkg: "@nocobase/plugin-action-export"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Exportation

## Introduction

La fonctionnalité d'exportation vous permet d'exporter des enregistrements filtrés au format **Excel** et de configurer les champs à inclure. Vous pouvez sélectionner les champs dont vous avez besoin pour l'analyse, le traitement ou l'archivage ultérieur des données. Cette fonctionnalité améliore la flexibilité des opérations sur les données, particulièrement utile lorsque les données doivent être transférées vers d'autres plateformes ou traitées plus en profondeur.

### Points forts de la fonctionnalité :
- **Sélection des champs** : Vous pouvez configurer et sélectionner les champs à exporter, garantissant ainsi que les données exportées sont précises et concises.
- **Prise en charge du format Excel** : Les données exportées sont enregistrées sous forme de fichier Excel standard, facilitant leur intégration et leur analyse avec d'autres données.

Grâce à cette fonctionnalité, vous pouvez facilement exporter les données clés de votre travail pour une utilisation externe, améliorant ainsi votre efficacité.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## Configuration de l'action

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Champs exportables

- Premier niveau : Tous les champs de la collection actuelle ;
- Deuxième niveau : S'il s'agit d'un champ de relation, vous devez sélectionner les champs de la collection associée ;
- Troisième niveau : Seuls trois niveaux sont traités ; les champs de relation du dernier niveau ne sont pas affichés ;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Règle de liaison](/interface-builder/actions/action-settings/linkage-rule) : Afficher/masquer dynamiquement le bouton ;
- [Modifier le bouton](/interface-builder/actions/action-settings/edit-button) : Modifier le titre, la couleur et l'icône du bouton ;