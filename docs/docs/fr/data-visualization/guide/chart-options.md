:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Options de graphique

Configurez la manière dont les graphiques sont affichés. Deux modes sont disponibles : Basique (graphique) et Personnalisé (JS). Le mode Basique est idéal pour un mappage rapide et les propriétés courantes ; le mode Personnalisé convient aux scénarios complexes et à la personnalisation avancée.

## Structure du panneau

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Astuce : Pour faciliter la configuration du contenu actuel, vous pouvez d'abord réduire les autres panneaux.

La barre d'actions se trouve en haut.
Sélection du mode :
- Basique : Configuration graphique. Sélectionnez un type et complétez le mappage des champs ; ajustez les propriétés courantes directement via des interrupteurs.
- Personnalisé : Écrivez du code JS dans l'éditeur et retournez une `option` ECharts.

## Mode Basique

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Choisir le type de graphique
- Types pris en charge : graphiques en courbes, en aires, à barres (verticales), à barres (horizontales), en secteurs, en anneaux, en entonnoir, à nuage de points, etc.
- Les champs requis peuvent varier selon le type de graphique. Commencez par vérifier les noms et les types de colonnes dans « Requête de données → Afficher les données ».

### Mappage des champs
- Courbes/Aires/Barres (verticales)/Barres (horizontales) :
  - `xField` : Dimension (par exemple, date, catégorie, région)
  - `yField` : Mesure (valeur numérique agrégée)
  - `seriesField` (facultatif) : Groupement de séries (pour plusieurs lignes/groupes de barres)
- Secteurs/Anneaux :
  - `Category` : Dimension catégorielle
  - `Value` : Mesure
- Entonnoir :
  - `Category` : Étape/Catégorie
  - `Value` : Valeur (généralement un nombre ou un pourcentage)
- Nuage de points :
  - `xField`, `yField` : Deux mesures ou dimensions pour les axes.

> Pour plus d'options de configuration de graphique, consultez la documentation ECharts : [Axes](https://echarts.apache.org/handbook/en/concepts/axis) et [Exemples](https://echarts.apache.org/examples/en/index.html)

**Remarques :**
- Après avoir modifié les dimensions ou les mesures, revérifiez le mappage afin d'éviter les graphiques vides ou mal alignés.
- Les graphiques en secteurs/anneaux et en entonnoir doivent impérativement fournir une combinaison « catégorie + valeur ».

### Propriétés courantes

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Empilement, lissage (courbes/aires)
- Affichage des étiquettes, info-bulle (tooltip), légende (legend)
- Rotation des étiquettes d'axe, lignes de séparation
- Rayon et rayon intérieur des graphiques en secteurs/anneaux, ordre de tri de l'entonnoir

**Recommandations :**
- Utilisez les graphiques en courbes/aires avec un lissage modéré pour les séries temporelles ; utilisez les graphiques à barres (verticales/horizontales) pour la comparaison de catégories.
- Lorsque les données sont denses, il n'est pas nécessaire d'activer toutes les étiquettes afin d'éviter les chevauchements.

## Mode Personnalisé

Ce mode permet de retourner une `option` ECharts complète. Il convient aux personnalisations avancées telles que la fusion de plusieurs séries, les info-bulles complexes et les styles dynamiques.
Utilisation recommandée : centralisez les données dans `dataset.source`. Pour plus de détails, consultez la documentation ECharts : [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Contexte des données
- `ctx.data.objects` : Tableau d'objets (chaque ligne est un objet, recommandé)
- `ctx.data.rows` : Tableau 2D (avec en-tête)
- `ctx.data.columns` : Tableau 2D regroupé par colonnes

### Exemple : graphique en courbes des commandes mensuelles
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Prévisualiser et Enregistrer
- En mode Personnalisé, une fois vos modifications terminées, vous pouvez cliquer sur le bouton « Prévisualiser » à droite pour mettre à jour l'aperçu du graphique.
- En bas, cliquez sur « Enregistrer » pour appliquer et sauvegarder la configuration ; cliquez sur « Annuler » pour annuler toutes les modifications apportées.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> Pour plus d'informations sur les options de graphique, consultez la section Utilisation avancée — Configuration de graphique personnalisée.