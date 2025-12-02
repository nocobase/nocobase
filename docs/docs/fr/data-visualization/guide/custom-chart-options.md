:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Configuration de graphique personnalisée

En mode personnalisé, vous pouvez configurer des graphiques en écrivant du code JS dans l'éditeur. Basé sur `ctx.data`, cela renvoie une `option` ECharts complète. Cette approche est idéale pour fusionner plusieurs séries, gérer des info-bulles complexes et appliquer des styles dynamiques. En théorie, toutes les fonctionnalités et tous les types de graphiques ECharts sont pris en charge.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Contexte des données
- `ctx.data.objects` : tableau d'objets (chaque ligne est un objet)
- `ctx.data.rows` : tableau 2D (inclut l'en-tête)
- `ctx.data.columns` : tableau 2D regroupé par colonnes

**Utilisation recommandée :**
Consolidez les données dans `dataset.source`. Pour une utilisation détaillée, veuillez consulter la documentation ECharts :

 [Jeu de données](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Axes](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Exemples](https://echarts.apache.org/examples/en/index.html)


Commençons par un exemple simple.

## Exemple 1 : Graphique à barres des commandes mensuelles

![20251027082816](https://static-docs.nocobase.com/20251027082816.png)

```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'bar',
      showSymbol: false,
    },
  ],
}
```

## Exemple 2 : Graphique de tendance des ventes

![clipboard-image-1761525188](https://static-docs.nocobase.com/clipboard-image-1761525188.png)

```js
return {
  dataset: {
    source: ctx.data.objects.reverse()
  },
  title: {
    text: "Monthly Sales Trend",
    subtext: "Last 12 Months",
    left: "center"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross"
    }
  },
  legend: {
    data: ["Revenue", "Order Count", "Avg Order Value"],
    bottom: 0
  },
  grid: {
    left: "5%",
    right: "5%",
    bottom: "60",
    top: "80",
    containLabel: true
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: [
    {
      type: "value",
      name: "Amount(¥)",
      position: "left",
      axisLabel: {
        formatter: (value) => {
          return (value/10000).toFixed(0) + '0k';
        }
      }
    },
    {
      type: "value",
      name: "Order Count",
      position: "right"
    }
  ],
  series: [
    {
      name: "Revenue",
      type: "line",
      smooth: true,
      encode: {
        x: "month",
        y: "monthly_revenue"
      },
      areaStyle: {
        opacity: 0.3
      },
      itemStyle: {
        color: "#5470c6"
      }
    },
    {
      name: "Order Count",
      type: "bar",
      yAxisIndex: 1,
      encode: {
        x: "month",
        y: "order_count"
      },
      itemStyle: {
        color: "#91cc75",
        opacity: 0.6
      }
    },
    {
      name: "Avg Order Value",
      type: "line",
      encode: {
        x: "month",
        y: "avg_order_value"
      },
      itemStyle: {
        color: "#fac858"
      },
      lineStyle: {
        type: "dashed"
      }
    }
  ]
}
```

**Recommandations :**
- Adoptez un style de fonction pure : générez l'`option` uniquement à partir de `ctx.data` et évitez les effets de bord.
- Les modifications des noms de colonnes de requête affectent l'indexation ; standardisez les noms et confirmez-les dans "Afficher les données" avant de modifier le code.
- Pour les grands ensembles de données, évitez les calculs synchrones complexes en JS ; effectuez l'agrégation pendant la phase de requête si nécessaire.

## Plus d'exemples

Pour plus d'exemples d'utilisation, vous pouvez consulter l'[application de démonstration](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

Vous pouvez également parcourir les [exemples](https://echarts.apache.org/examples/en/index.html) officiels d'ECharts pour trouver l'effet de graphique souhaité, puis vous référer et copier le code de configuration JS.

## Prévisualiser et enregistrer

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Cliquez sur "Prévisualiser" à droite ou en bas pour rafraîchir le graphique et valider la configuration JS.
- Cliquez sur "Enregistrer" pour sauvegarder la configuration JS actuelle dans la base de données.
- Cliquez sur "Annuler" pour revenir à l'état précédemment enregistré.