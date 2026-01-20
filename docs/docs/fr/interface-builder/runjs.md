:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Écrire et exécuter du JS en ligne

Dans NocoBase, **RunJS** offre une méthode d'extension légère, idéale pour les scénarios d'**expérimentation rapide** et de **traitement logique temporaire**. Sans avoir besoin de créer des plugins ou de modifier le code source, vous pouvez personnaliser les interfaces ou les interactions grâce à JavaScript.

Grâce à lui, vous pouvez saisir directement du code JS dans le concepteur d'interface pour réaliser :

- Le rendu personnalisé de contenu (champs, blocs, colonnes, éléments, etc.)
- Une logique d'interaction personnalisée (clics de bouton, enchaînement d'événements)
- Des comportements dynamiques en combinant les données contextuelles

## Scénarios pris en charge

### Bloc JS

Personnalisez le rendu des blocs via JS pour contrôler entièrement leur structure et leur style. C'est idéal pour afficher des composants personnalisés, des graphiques statistiques, du contenu tiers et d'autres scénarios très flexibles.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)  

Documentation : [Bloc JS](/interface-builder/blocks/other-blocks/js-block)

### Action JS

Personnalisez la logique de clic des boutons d'action via JS pour exécuter n'importe quelle opération frontend ou requête API. Par exemple : calculer dynamiquement des valeurs, soumettre des données personnalisées, déclencher des pop-ups, etc.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)  

Documentation : [Action JS](/interface-builder/actions/types/js-action)

### Champ JS

Personnalisez la logique de rendu des champs via JS. Vous pouvez afficher dynamiquement différents styles, contenus ou états en fonction des valeurs des champs.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)  

Documentation : [Champ JS](/interface-builder/fields/specific/js-field)

### Élément JS

Rendez des éléments indépendants via JS sans les lier à des champs spécifiques. Ceci est souvent utilisé pour afficher des blocs d'informations personnalisés.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)  

Documentation : [Élément JS](/interface-builder/fields/specific/js-item)

### Colonne de tableau JS

Personnalisez le rendu des colonnes de tableau via JS. Vous pouvez ainsi implémenter des logiques d'affichage de cellules complexes, comme des barres de progression, des étiquettes de statut, etc.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)  

Documentation : [Colonne de tableau JS](/interface-builder/fields/specific/js-column)

### Règles de liaison

Contrôlez la logique de liaison entre les champs dans les formulaires ou les pages via JS. Par exemple : modifier dynamiquement la valeur ou la visibilité d'un autre champ lorsqu'un champ change.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)  

Documentation : [Règles de liaison](/interface-builder/linkage-rule)

### Flux d'événements

Personnalisez les conditions de déclenchement et la logique d'exécution des flux d'événements via JS pour construire des chaînes d'interaction frontend plus complexes.

![](https://static-docs.nocobase.com/20251031092755.png)  

Documentation : [Flux d'événements](/interface-builder/event-flow)