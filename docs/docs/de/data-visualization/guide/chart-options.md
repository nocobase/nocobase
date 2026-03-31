:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Diagramm-Optionen

Konfigurieren Sie die Anzeige Ihrer Diagramme. Es werden zwei Modi unterstützt: Basic (visuell) und Custom (JS). Der Basic-Modus eignet sich ideal für schnelle Zuordnungen und gängige Eigenschaften; der Custom-Modus ist für komplexe Szenarien und erweiterte Anpassungen gedacht.

## Panel-Struktur

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Tipps: Um die Konfiguration zu vereinfachen, können Sie andere Panels zunächst einklappen.

Oben befindet sich die Aktionsleiste.
Modusauswahl:
- Basic: Visuelle Konfiguration. Wählen Sie einen Typ aus, schließen Sie die Feldzuordnung ab und passen Sie gängige Eigenschaften direkt über Schalter an.
- Custom: Schreiben Sie JS im Editor und geben Sie eine ECharts `option` zurück.

## Basic-Modus

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Diagrammtyp auswählen
- Unterstützt werden: Linien-, Flächen-, Säulen-, Balken-, Kreis-, Ring-, Trichter- und Streudiagramme usw.
- Die erforderlichen Felder können je nach Diagrammtyp variieren. Bestätigen Sie zunächst die Spaltennamen und -typen unter „Datenabfrage → Daten anzeigen“.

### Feldzuordnung
- Linien-/Flächen-/Säulen-/Balkendiagramm:
  - `xField`: Dimension (z. B. Datum, Kategorie, Region)
  - `yField`: Messwert (aggregierter numerischer Wert)
  - `seriesField` (optional): Reihengruppierung (für mehrere Linien/Gruppen)
- Kreis-/Ringdiagramm:
  - `Category`: Kategoriale Dimension
  - `Value`: Messwert
- Trichterdiagramm:
  - `Category`: Phase/Kategorie
  - `Value`: Wert (üblicherweise Anzahl oder Prozentsatz)
- Streudiagramm:
  - `xField`, `yField`: Zwei Messwerte oder Dimensionen für die Achsen

> Weitere Optionen zur Diagrammkonfiguration finden Sie in der ECharts-Dokumentation: [Achsen](https://echarts.apache.org/handbook/en/concepts/axis) und [Beispiele](https://echarts.apache.org/examples/en/index.html).

**Hinweise:**
- Überprüfen Sie die Zuordnung erneut, nachdem Sie Dimensionen oder Messwerte geändert haben, um leere oder falsch ausgerichtete Diagramme zu vermeiden.
- Kreis-/Ringdiagramme und Trichterdiagramme müssen eine Kombination aus „Kategorie + Wert“ bereitstellen.

### Häufig verwendete Eigenschaften

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Stapeln, Glätten (Linien-/Flächendiagramm)
- Beschriftungen, Tooltip (Hinweis), Legende
- Achsenbeschriftungsrotation, Trennlinien
- Radius und Innenradius von Kreis-/Ringdiagrammen, Sortierreihenfolge von Trichterdiagrammen

**Empfehlungen:**
- Verwenden Sie für Zeitreihen Linien-/Flächendiagramme mit moderater Glättung; für den Vergleich großer Kategorien Säulen-/Balkendiagramme.
- Bei dichten Daten müssen nicht alle Beschriftungen angezeigt werden, um Überschneidungen zu vermeiden.

## Custom-Modus

Dient zum Zurückgeben einer vollständigen ECharts `option`. Geeignet für erweiterte Anpassungen wie das Zusammenführen mehrerer Reihen, komplexe Tooltips und dynamische Stile.
Empfohlene Vorgehensweise: Konsolidieren Sie Daten in `dataset.source`. Details finden Sie in der ECharts-Dokumentation: [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series).

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Datenkontext
- `ctx.data.objects`: Array von Objekten (jede Zeile als Objekt, empfohlen)
- `ctx.data.rows`: 2D-Array (mit Kopfzeile)
- `ctx.data.columns`: 2D-Array, nach Spalten gruppiert

### Beispiel: Monatsbestellungen als Liniendiagramm
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

### Vorschau und Speichern
- Im Custom-Modus können Sie nach der Bearbeitung auf die Schaltfläche „Vorschau“ auf der rechten Seite klicken, um die Diagrammvorschau zu aktualisieren.
- Klicken Sie unten auf „Speichern“, um die Konfiguration anzuwenden und zu speichern; klicken Sie auf „Abbrechen“, um alle in dieser Sitzung vorgenommenen Änderungen rückgängig zu machen.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIPP]
> Weitere Informationen zu Diagrammoptionen finden Sie unter Erweiterte Nutzung – Benutzerdefinierte Diagrammkonfiguration.