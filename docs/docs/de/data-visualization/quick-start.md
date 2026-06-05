:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Schnellstart

In dieser Anleitung konfigurieren wir gemeinsam ein Diagramm von Grund auf und nutzen dabei die grundlegenden Funktionen. Weitere optionale Möglichkeiten werden in späteren Kapiteln behandelt.

Voraussetzungen:
- Eine Datenquelle und eine Sammlung (Datentabelle) sind eingerichtet, und Sie verfügen über Leseberechtigungen.

## Einen Diagramm-Block hinzufügen

Klicken Sie im Seiten-Designer auf „Block hinzufügen“, wählen Sie „Diagramm“ und fügen Sie einen Diagramm-Block hinzu.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Nach dem Hinzufügen klicken Sie oben rechts im Block auf „Konfigurieren“.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Auf der rechten Seite öffnet sich das Konfigurationspanel für das Diagramm. Es enthält drei Abschnitte: Datenabfrage, Diagramm-Optionen und Ereignisse.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Datenabfrage konfigurieren

Im Panel „Datenabfrage“ können Sie die Datenquelle, Abfragefilter und weitere Optionen konfigurieren.

- **Datenquelle und Sammlung auswählen**
  - Wählen Sie im Panel „Datenabfrage“ die Datenquelle und die Sammlung als Grundlage für Ihre Abfrage aus.
  - Falls die Sammlung nicht auswählbar oder leer ist, überprüfen Sie zuerst, ob sie erstellt wurde und ob Ihr Benutzer die entsprechenden Berechtigungen besitzt.

- **Messwerte (Measures) konfigurieren**
  - Wählen Sie ein oder mehrere numerische Felder als Messwerte aus.
  - Legen Sie für jeden Messwert eine Aggregation fest: Summe / Anzahl / Durchschnitt / Maximum / Minimum.

- **Dimensionen konfigurieren**
  - Wählen Sie ein oder mehrere Felder als Gruppierungsdimensionen aus (z. B. Datum, Kategorie, Region).
  - Für Datums-/Zeitfelder können Sie ein Format festlegen (z. B. `YYYY-MM`, `YYYY-MM-DD`), um eine konsistente Anzeige zu gewährleisten.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Weitere Optionen wie Filter, Sortierung und Paginierung sind optional.

## Abfrage ausführen und Daten anzeigen

- Klicken Sie auf „Abfrage ausführen“, um Daten abzurufen und eine Diagramm-Vorschau direkt auf der linken Seite zu rendern.
- Sie können auf „Daten anzeigen“ klicken, um die zurückgegebenen Daten zu prüfen. Es wird das Umschalten zwischen Tabellen- und JSON-Format unterstützt. Ein erneuter Klick blendet die Datenvorschau wieder aus.
- Falls das Ergebnis leer ist oder nicht Ihren Erwartungen entspricht, kehren Sie zum Abfrage-Panel zurück und überprüfen Sie die Sammlungsberechtigungen, die Feldzuordnungen für Messwerte/Dimensionen und die Datentypen.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Diagramm-Optionen konfigurieren

Im Panel „Diagramm-Optionen“ können Sie den Diagrammtyp auswählen und dessen Optionen konfigurieren.

- Wählen Sie zuerst einen Diagrammtyp aus (Linien-/Flächendiagramm, Säulen-/Balkendiagramm, Kreis-/Ringdiagramm, Streudiagramm usw.).
- **Schließen Sie die Kernfeldzuordnungen ab:**
  - Linien-/Flächen-/Säulen-/Balkendiagramm: `xField` (Dimension), `yField` (Messwert), `seriesField` (Serie, optional)
  - Kreis-/Ringdiagramm: `Category` (Kategorische Dimension), `Value` (Messwert)
  - Streudiagramm: `xField`, `yField` (zwei Messwerte oder Dimensionen)
  - Für weitere Diagrammeinstellungen und Konfigurationen konsultieren Sie die ECharts-Dokumentation: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Nachdem Sie auf „Abfrage ausführen“ geklickt haben, werden die Feldzuordnungen standardmäßig automatisch ausgefüllt. Wenn Sie Dimensionen/Messwerte ändern, überprüfen Sie die Zuordnungen bitte erneut.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Vorschau und Speichern

Änderungen an der Konfiguration aktualisieren die Vorschau auf der linken Seite automatisch und in Echtzeit. Beachten Sie jedoch, dass alle Änderungen erst nach dem Klicken auf die Schaltfläche „Speichern“ tatsächlich gespeichert werden.

Sie können auch die Schaltflächen am unteren Rand verwenden:

- **Vorschau**: Konfigurationsänderungen aktualisieren die Vorschau automatisch in Echtzeit. Sie können auch auf die Schaltfläche „Vorschau“ am unteren Rand klicken, um eine Aktualisierung manuell auszulösen.
- **Abbrechen**: Wenn Sie die aktuellen Konfigurationsänderungen nicht übernehmen möchten, klicken Sie auf die Schaltfläche „Abbrechen“ am unteren Rand oder aktualisieren Sie die Seite. Dadurch werden die Änderungen rückgängig gemacht und der zuletzt gespeicherte Zustand wiederhergestellt.
- **Speichern**: Klicken Sie auf „Speichern“, um alle aktuellen Abfrage- und Diagrammkonfigurationen dauerhaft in der Datenbank zu speichern. Diese werden dann für alle Benutzer wirksam.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Häufige Hinweise

- **Minimal nutzbare Konfiguration**: Wählen Sie eine Sammlung und mindestens einen Messwert aus. Es wird empfohlen, Dimensionen hinzuzufügen, um eine gruppierte Anzeige zu ermöglichen.
- Für Datumsdimensionen empfiehlt es sich, ein geeignetes Format festzulegen (z. B. `YYYY-MM` für monatliche Statistiken), um eine diskontinuierliche oder unübersichtliche X-Achse zu vermeiden.
- **Wenn die Abfrage leer ist oder das Diagramm nicht angezeigt wird:**
  - Überprüfen Sie die Sammlung/Berechtigungen und die Feldzuordnungen.
  - Verwenden Sie „Daten anzeigen“, um zu bestätigen, dass Spaltennamen und -typen mit der Diagrammzuordnung übereinstimmen.
- **Die Vorschau ist temporär**: Sie dient lediglich zur Validierung und Anpassung. Die Änderungen werden erst nach dem Klicken auf „Speichern“ offiziell wirksam.