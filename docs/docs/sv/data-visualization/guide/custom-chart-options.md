:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Anpassad diagramkonfiguration

I anpassat läge konfigurerar ni diagram genom att skriva JS i kodredigeraren. Baserat på `ctx.data` returnerar ni ett komplett ECharts `option`. Detta lämpar sig för att slå samman flera serier, komplexa verktygstips och dynamiska stilar. I princip stöds alla ECharts-funktioner och diagramtyper.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Datakontext
- `ctx.data.objects`: array av objekt (varje rad som ett objekt)
- `ctx.data.rows`: 2D-array (med rubrik)
- `ctx.data.columns`: 2D-array grupperad per kolumn

**Rekommenderad användning:**
Samla all data i `dataset.source`. För detaljerad användning, se ECharts-dokumentationen:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Axel](https://echarts.apache.org/handbook/en/concepts/axis)

 [Exempel](https://echarts.apache.org/examples/en/index.html)

Låt oss börja med ett enkelt exempel.

## Exempel 1: Stapeldiagram över månadsordrar

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

## Exempel 2: Försäljningstrenddiagram

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

**Rekommendationer:**
- Använd en ren funktionsstil: generera `option` endast från `ctx.data` och undvik sidoeffekter.
- Ändringar av kolumnnamn i frågor påverkar indexering; standardisera namn och bekräfta i "Visa data" innan ni ändrar koden.
- För stora datamängder, undvik komplexa synkrona beräkningar i JS; aggregera vid frågestadiet när det behövs.

## Fler exempel

För fler användningsexempel kan ni se NocoBase [Demoapplikation](https://demo3.sg.nocobase.com/admin/5xrop8s0bui).

Ni kan också bläddra bland ECharts officiella [Exempel](https://echarts.apache.org/examples/en/index.html) för att hitta önskad diagrameffekt, och sedan referera till och kopiera JS-konfigurationskoden.

## Förhandsgranska och spara

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Klicka på "Förhandsgranska" till höger eller längst ner för att uppdatera diagrammet och validera JS-konfigurationen.
- Klicka på "Spara" för att spara den aktuella JS-konfigurationen i databasen.
- Klicka på "Avbryt" för att återgå till det senast sparade tillståndet.