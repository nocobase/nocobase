:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/interface-builder/blocks/data-blocks/form).
:::

# Bloc formulaire

## Introduction

Le bloc formulaire est un bloc important pour construire des interfaces de saisie et d'édition de données. Il est hautement personnalisable et utilise les composants correspondants pour afficher les champs requis en fonction du modèle de données. Grâce aux flux d'événements tels que les règles de liaison, le bloc formulaire peut afficher les champs de manière dynamique. De plus, il peut être combiné avec des flux de travail pour réaliser le déclenchement automatique de processus et le traitement des données, améliorant ainsi l'efficacité du travail ou permettant l'orchestration logique.

## Ajouter un bloc formulaire

- **Modifier le formulaire** : Utilisé pour modifier des données existantes.
- **Nouveau formulaire** : Utilisé pour créer de nouvelles entrées de données.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Options de configuration du bloc

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Règle de liaison du bloc

Contrôlez le comportement du bloc via des règles de liaison (comme l'affichage ou l'exécution de JavaScript).

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Plus de contenu, voir [Règle de liaison du bloc](/interface-builder/blocks/block-settings/block-linkage-rule)

### Règle de liaison des champs

Contrôlez le comportement des champs du formulaire via des règles de liaison.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Plus de contenu, voir [Règle de liaison des champs](/interface-builder/blocks/block-settings/field-linkage-rule)

### Mise en page

Le bloc formulaire prend en charge deux modes de mise en page, configurés via l'attribut `layout` :

- **horizontal** (disposition horizontale) : Cette disposition affiche les étiquettes et le contenu sur une seule ligne, économisant de l'espace vertical, adaptée aux formulaires simples ou aux cas avec peu d'informations.
- **vertical** (disposition verticale) (par défaut) : L'étiquette est située au-dessus du champ, cette disposition rend le formulaire plus facile à lire et à remplir, particulièrement pour les formulaires contenant plusieurs champs ou des éléments de saisie complexes.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Configurer les champs

### Champs de cette collection

> **Remarque** : Les champs des collections héritées (c'est-à-dire les champs de la collection parente) sont automatiquement fusionnés et affichés dans la liste des champs actuels.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Champs de collection de relation

> Les champs de collection de relation sont en lecture seule dans le formulaire, généralement utilisés en combinaison avec des champs de relation pour afficher plusieurs valeurs de champs des données liées.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Actuellement, seules les relations de type "to-one" (comme belongsTo / hasOne, etc.) sont prises en charge.
- Il est généralement utilisé avec un champ de relation (utilisé pour sélectionner l'enregistrement associé) : le composant de champ de relation est responsable de la sélection/modification de l'enregistrement associé, tandis que le champ de collection de relation est responsable de l'affichage de plus d'informations sur cet enregistrement (lecture seule).

**Exemple** : Après avoir sélectionné un « Responsable », le numéro de téléphone, l'e-mail et d'autres informations de ce responsable sont affichés dans le formulaire.

> Dans le formulaire d'édition, même si le champ de relation « Responsable » n'est pas configuré, les informations associées correspondantes peuvent être affichées. Lorsque le champ de relation « Responsable » est configuré, la modification du responsable mettra à jour les informations associées vers l'enregistrement correspondant.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Autres champs

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- L'écriture de JavaScript permet de réaliser un contenu d'affichage personnalisé pour présenter des informations complexes.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Modèle de champ

Les modèles de champs sont utilisés pour réutiliser la configuration de la zone de champ dans les blocs de formulaire. Pour plus de détails, voir [Modèle de champ](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Configurer les actions

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Soumettre](/interface-builder/actions/types/submit)
- [Déclencher un flux de travail](/interface-builder/actions/types/trigger-workflow)
- [Action JS](/interface-builder/actions/types/js-action)
- [Employé IA](/interface-builder/actions/types/ai-employee)