---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Vue d'ensemble

Le plugin de visualisation de données de NocoBase offre des requêtes de données visuelles et une riche collection de composants graphiques. Grâce à une configuration simple, vous pouvez rapidement créer des tableaux de bord, présenter des informations pertinentes et prendre en charge l'analyse et la présentation de données multidimensionnelles.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Concepts de base
- Bloc de graphique : Un composant graphique configurable sur une page qui prend en charge les requêtes de données, les options de graphique et les événements d'interaction.
- Requête de données (Builder / SQL) : Configurez de manière graphique avec le Builder ou écrivez du SQL pour récupérer des données.
- Mesures et dimensions : Les mesures sont utilisées pour l'agrégation numérique ; les dimensions regroupent les données (par exemple, date, catégorie, région).
- Mappage de champs : Mappez les colonnes de résultats de requête aux champs de graphique principaux, tels que `xField`, `yField`, `seriesField` ou `Category / Value`.
- Options de graphique (Basique / Personnalisé) : Basique configure visuellement les propriétés courantes ; Personnalisé renvoie une `option` ECharts complète via JS.
- Exécuter la requête : Exécutez la requête et récupérez les données dans le panneau de configuration ; basculez vers Table / JSON pour inspecter les données renvoyées.
- Prévisualiser et enregistrer : La prévisualisation est temporaire ; cliquer sur Enregistrer écrit la configuration dans la base de données et l'applique.
- Variables de contexte : Réutilisez le contexte de la page, de l'utilisateur et du filtre (par exemple, `{{ ctx.user.id }}`) dans les requêtes et la configuration des graphiques.
- Filtres et liaison : Les blocs de filtre au niveau de la page collectent des conditions unifiées, fusionnent automatiquement dans les requêtes de graphique et actualisent les graphiques liés.
- Événements d'interaction : Enregistrez des événements via `chart.on` pour activer la mise en surbrillance, la navigation et l'exploration (drill-down).

## Installation
La visualisation de données est un plugin NocoBase intégré ; il est prêt à l'emploi et ne nécessite aucune installation séparée.