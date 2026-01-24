:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Aangepaste grafiekconfiguratie

In de aangepaste modus configureert u grafieken door JavaScript (JS) te schrijven in de code-editor. Op basis van `ctx.data` retourneert u een complete ECharts `option`. Dit is ideaal voor het samenvoegen van meerdere series, complexe tooltips en dynamische stijlen. In principe worden alle ECharts-functionaliteiten en grafiektypen ondersteund.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Gegevenscontext
- `ctx.data.objects`: array van objecten (elke rij als een object)
- `ctx.data.rows`: 2D-array (inclusief header)
- `ctx.data.columns`: 2D-array gegroepeerd per kolom

**Aanbevolen gebruik:**
Centraliseer gegevens in `dataset.source`. Voor gedetailleerd gebruik verwijzen wij u naar de ECharts-documentatie:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Assen](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Voorbeelden](https://echarts.apache.org/examples/en/index.html)


Laten we beginnen met een eenvoudig voorbeeld:

## Voorbeeld 1: Maandelijks bestelaantal staafdiagram

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


## Voorbeeld 2: Verkooptrendgrafiek

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

**Aanbevelingen:**
- Hanteer een pure functiestijl: genereer de `option` alleen op basis van `ctx.data` en vermijd neveneffecten.
- Aanpassingen aan kolomnamen in queries beïnvloeden de indexering; standaardiseer namen en bevestig dit in "Gegevens bekijken" voordat u de code wijzigt.
- Vermijd bij grote datasets complexe synchrone berekeningen in JS; aggregeer indien nodig tijdens de queryfase.


## Meer voorbeelden

Voor meer gebruiksvoorbeelden kunt u de NocoBase [Demo-applicatie](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) raadplegen.

U kunt ook de officiële ECharts [Voorbeelden](https://echarts.apache.org/examples/en/index.html) bekijken om het gewenste grafiekeffect te vinden, en vervolgens de JS-configuratiecode raadplegen en kopiëren.
 

## Voorbeeld en Opslaan

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Klik op "Voorbeeld" aan de rechterkant of onderaan om de grafiek te vernieuwen en de JS-configuratie te valideren.
- Klik op "Opslaan" om de huidige JS-configuratie in de database op te slaan.
- Klik op "Annuleren" om terug te keren naar de laatst opgeslagen status.