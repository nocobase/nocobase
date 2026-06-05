:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Bloc Formulaire

## Introduction

Le bloc Formulaire est un élément essentiel pour construire des interfaces de saisie et d'édition de données. Il est hautement personnalisable : il utilise des composants adaptés pour afficher les champs nécessaires, en se basant sur le modèle de données. Grâce à des flux d'événements comme les règles de liaison, le bloc Formulaire peut afficher les champs de manière dynamique. De plus, vous pouvez le combiner avec des flux de travail pour déclencher des processus automatisés et traiter les données, ce qui améliore l'efficacité du travail ou permet une orchestration logique.

## Ajouter un bloc Formulaire

- **Modifier un formulaire** : Permet de modifier des données existantes.
- **Ajouter un formulaire** : Permet de créer de nouvelles entrées de données.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Paramètres du bloc

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Règle de liaison du bloc

Contrôlez le comportement du bloc via les règles de liaison (par exemple, son affichage ou l'exécution de JavaScript).

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Pour plus de détails, consultez [Règle de liaison du bloc](/interface-builder/blocks/block-settings/block-linkage-rule)

### Règle de liaison des champs

Contrôlez le comportement des champs du formulaire via les règles de liaison.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Pour plus de détails, consultez [Règle de liaison des champs](/interface-builder/blocks/block-settings/field-linkage-rule)

### Disposition

Le bloc Formulaire prend en charge deux modes de disposition, que vous pouvez définir via l'attribut `layout` :

- **horizontal** (disposition horizontale) : Cette disposition affiche l'étiquette et le contenu sur une seule ligne, ce qui économise de l'espace vertical. Elle est idéale pour les formulaires simples ou les cas avec peu d'informations.
- **vertical** (disposition verticale) (par défaut) : L'étiquette est placée au-dessus du champ. Cette disposition rend le formulaire plus facile à lire et à remplir, en particulier pour les formulaires comportant plusieurs champs ou des éléments de saisie complexes.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Configurer les champs

### Champs de cette collection

> **Remarque** : Les champs des collections héritées (c'est-à-dire les champs de la collection parente) sont automatiquement fusionnés et affichés dans la liste des champs actuels.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Autres champs

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Vous pouvez écrire du JavaScript pour personnaliser le contenu affiché et présenter des informations complexes.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Configurer les actions

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Soumettre](/interface-builder/actions/types/submit)
- [Déclencher un flux de travail](/interface-builder/actions/types/trigger-workflow)
- [Action JS](/interface-builder/actions/types/js-action)
- [Employé IA](/interface-builder/actions/types/ai-employee)