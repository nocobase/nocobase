:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Benutzerdefinierte Diagrammkonfiguration

Im benutzerdefinierten Modus konfigurieren Sie Diagramme, indem Sie JavaScript im Code-Editor schreiben. Basierend auf `ctx.data` geben Sie eine vollständige ECharts `option` zurück. Dies eignet sich hervorragend für das Zusammenführen mehrerer Datenreihen, komplexe Tooltips und dynamische Stile. Theoretisch werden alle ECharts-Funktionen und Diagrammtypen unterstützt.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Datenkontext
- `ctx.data.objects`: Array von Objekten (jede Zeile als Objekt)
- `ctx.data.rows`: Zweidimensionales Array (mit Kopfzeile)
- `ctx.data.columns`: Zweidimensionales Array, nach Spalten gruppiert

**Empfohlene Verwendung:**
Konsolidieren Sie Daten in `dataset.source`. Eine detaillierte Beschreibung der Verwendung finden Sie in der ECharts-Dokumentation:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Achsen](https://echarts.apache.org/handbook/en/concepts/axis)

 [Beispiele](https://echarts.apache.org/examples/en/index.html)

Beginnen wir mit einem einfachen Beispiel:

## Beispiel 1: Monatliche Bestellmengen als Balkendiagramm

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

## Beispiel 2: Umsatztrend-Diagramm

![clipboard-image-1761525188](https://static-docs.nocobase.com/clipboard-image-1761525188.png)

```js
return {
  dataset: {
    source: ctx.data.objects.reverse()
  },
  title: {
    text: "Monatlicher Umsatztrend",
    subtext: "Letzte 12 Monate",
    left: "center"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross"
    }
  },
  legend: {
    data: ["Umsatz", "Anzahl Bestellungen", "Durchschnittlicher Bestellwert"],
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
      name: "Betrag(¥)",
      position: "left",
      axisLabel: {
        formatter: (value) => {
          return (value/10000).toFixed(0) + '0k';
        }
      }
    },
    {
      type: "value",
      name: "Anzahl Bestellungen",
      position: "right"
    }
  ],
  series: [
    {
      name: "Umsatz",
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
      name: "Anzahl Bestellungen",
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
      name: "Durchschnittlicher Bestellwert",
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

**Empfehlungen:**
- Behalten Sie einen reinen Funktionsstil bei: Generieren Sie die `option` ausschließlich aus `ctx.data` und vermeiden Sie Nebenwirkungen.
- Änderungen an den Spaltennamen der Abfrage wirken sich auf die Indizierung aus; standardisieren Sie die Namen und bestätigen Sie diese unter „Daten anzeigen“, bevor Sie den Code ändern.
- Vermeiden Sie bei großen Datenmengen komplexe synchrone Berechnungen in JavaScript; aggregieren Sie bei Bedarf bereits in der Abfragephase.

## Weitere Beispiele

Weitere Anwendungsbeispiele finden Sie in der NocoBase [Demo-Anwendung](https://demo3.sg.nocobase.com/admin/5xrop8s0bui).

Sie können auch die offiziellen ECharts [Beispiele](https://echarts.apache.org/examples/en/index.html) durchsuchen, um den gewünschten Diagrammeffekt zu finden, und dann den JS-Konfigurationscode als Referenz kopieren.

## Vorschau und Speichern

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Klicken Sie auf „Vorschau“ auf der rechten Seite oder unten, um das Diagramm zu aktualisieren und die JS-Konfiguration zu überprüfen.
- Klicken Sie auf „Speichern“, um die aktuelle JS-Konfiguration in der Datenbank zu speichern.
- Klicken Sie auf „Abbrechen“, um zum zuletzt gespeicherten Zustand zurückzukehren.