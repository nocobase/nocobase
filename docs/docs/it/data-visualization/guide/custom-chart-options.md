:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Configurazione personalizzata dei grafici

Nella modalità personalizzata, può configurare i grafici scrivendo codice JS nell'editor. Basandosi su `ctx.data`, restituisce un `option` completo di ECharts. Questo approccio è ideale per unire più serie, gestire tooltip complessi e applicare stili dinamici. In teoria, sono supportate tutte le funzionalità e tutti i tipi di grafico di ECharts.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Contesto dei dati
- `ctx.data.objects`: array di oggetti (ogni riga come oggetto)
- `ctx.data.rows`: array 2D (con intestazione)
- `ctx.data.columns`: array 2D raggruppato per colonne

**Uso consigliato:**
Consolidi i dati in `dataset.source`. Per un utilizzo dettagliato, consulti la documentazione di ECharts:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Assi](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Esempi](https://echarts.apache.org/examples/en/index.html)


Vediamo ora un esempio molto semplice:

## Esempio 1: Grafico a barre del volume ordini mensile

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


## Esempio 2: Grafico delle tendenze di vendita

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

**Consigli:**
- Mantenga uno stile a funzione pura: generi l'oggetto `option` solo da `ctx.data` ed eviti effetti collaterali.
- Le modifiche ai nomi delle colonne della query influenzano l'indicizzazione; standardizzi i nomi e li confermi in "Visualizza dati" prima di modificare il codice.
- Per set di dati di grandi dimensioni, eviti calcoli sincroni complessi in JS; aggreghi i dati durante la fase di query, se necessario.


## Altri esempi

Per altri esempi di utilizzo, può consultare l'[applicazione Demo](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) di NocoBase.

Può anche sfogliare gli [Esempi](https://echarts.apache.org/examples/en/index.html) ufficiali di ECharts per trovare l'effetto grafico desiderato, quindi fare riferimento e copiare il codice di configurazione JS.
 

## Anteprima e Salvataggio

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Clicchi su "Anteprima" a destra o in basso per aggiornare il grafico e convalidare la configurazione JS.
- Clicchi su "Salva" per salvare la configurazione JS corrente nel database.
- Clicchi su "Annulla" per tornare allo stato salvato in precedenza.