:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vlastní konfigurace grafu

V režimu Vlastní konfigurace můžete grafy nastavit psaním JS kódu v editoru. Na základě `ctx.data` vrátíte kompletní `option` pro ECharts. To je ideální pro slučování více datových řad, komplexní popisky a dynamické styly. Teoreticky jsou podporovány všechny funkce ECharts a všechny typy grafů.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Datový kontext
- `ctx.data.objects`: pole objektů (každý řádek jako objekt)
- `ctx.data.rows`: dvourozměrné pole (včetně záhlaví)
- `ctx.data.columns`: dvourozměrné pole seskupené podle sloupců

**Doporučené použití:**
Slučte data do `dataset.source`. Podrobné informace o použití naleznete v dokumentaci ECharts:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Osy](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Příklady](https://echarts.apache.org/examples/en/index.html)


Podívejme se nejprve na nejjednodušší příklad:

## Příklad 1: Sloupcový graf měsíčního objemu objednávek

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


## Příklad 2: Graf trendu prodeje

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

**Doporučení:**
- Dodržujte styl čistých funkcí: generujte `option` pouze z `ctx.data` a vyhněte se vedlejším efektům.
- Změny názvů sloupců v dotazu ovlivňují indexování; standardizujte názvy a potvrďte je v "Zobrazit data" před úpravou kódu.
- U velkých datových sad se vyhněte složitým synchronním výpočtům v JS; v případě potřeby agregujte data již ve fázi dotazu.


## Další příklady

Další příklady použití naleznete v [demo aplikaci](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

Můžete si také prohlédnout oficiální [příklady](https://echarts.apache.org/examples/en/index.html) ECharts, vybrat si požadovaný efekt grafu a následně se inspirovat a zkopírovat JS konfigurační kód.
 

## Náhled a uložení

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Klikněte na „Náhled“ vpravo nebo dole pro obnovení grafu a ověření obsahu JS konfigurace.
- Kliknutím na „Uložit“ uložíte aktuální JS konfiguraci do databáze.
- Kliknutím na „Zrušit“ se vrátíte k naposledy uloženému stavu.