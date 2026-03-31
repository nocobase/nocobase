:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Datenabfrage

Das Konfigurationspanel für Diagramme ist in drei Hauptbereiche unterteilt: Datenabfrage, Diagrammoptionen und Interaktionsereignisse. Hinzu kommen die Schaltflächen „Abbrechen“, „Vorschau“ und „Speichern“ am unteren Rand.

Werfen wir zunächst einen Blick auf das Panel „Datenabfrage“, um die beiden Abfragemodi (Builder/SQL) und ihre gängigen Funktionen kennenzulernen.

## Panel-Struktur
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Tipp: Um den aktuellen Inhalt einfacher zu konfigurieren, können Sie andere Panels zunächst einklappen.

Ganz oben befindet sich die Aktionsleiste:
- Modus: Builder (grafisch, einfach und bequem) / SQL (manuelle Abfragen, flexibler).
- Abfrage ausführen: Klicken Sie hier, um die Datenabfrage auszuführen.
- Ergebnis anzeigen: Öffnet das Daten-Ergebnispanel, in dem Sie zwischen der Tabellen- und JSON-Ansicht wechseln können. Klicken Sie erneut, um das Panel einzuklappen.

Von oben nach unten finden Sie:
- Datenquelle und Sammlung: Erforderlich. Wählen Sie die Datenquelle und die Sammlung aus.
- Kennzahlen (Measures): Erforderlich. Die numerischen Felder, die angezeigt werden sollen.
- Dimensionen (Dimensions): Gruppierung nach Feldern (z. B. Datum, Kategorie, Region).
- Filter: Legen Sie Filterbedingungen fest (z. B. =, ≠, >, <, enthält, Bereich). Mehrere Bedingungen können kombiniert werden.
- Sortierung: Wählen Sie das Feld für die Sortierung und die Reihenfolge (aufsteigend/absteigend) aus.
- Paginierung: Steuert den Datenbereich und die Rückgabe-Reihenfolge.

## Builder-Modus

### Datenquelle und Sammlung auswählen
- Wählen Sie im Panel „Datenabfrage“ den Modus „Builder“ aus.
- Wählen Sie eine Datenquelle und eine Sammlung (Datentabelle) aus. Wenn die Sammlung nicht auswählbar oder leer ist, überprüfen Sie zuerst die Berechtigungen und ob sie erstellt wurde.

### Kennzahlen (Measures) konfigurieren
- Wählen Sie ein oder mehrere numerische Felder aus und legen Sie eine Aggregation fest: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Häufige Anwendungsfälle: `Count` zur Zählung von Datensätzen, `Sum` zur Berechnung einer Gesamtsumme.

### Dimensionen (Dimensions) konfigurieren
- Wählen Sie ein oder mehrere Felder als Gruppierungsdimensionen aus.
- Datums- und Zeitfelder können formatiert werden (z. B. `YYYY-MM`, `YYYY-MM-DD`), um die Gruppierung nach Monat oder Tag zu erleichtern.

### Filtern, Sortieren und Paginierung
- Filter: Fügen Sie Bedingungen hinzu (z. B. =, ≠, enthält, Bereich). Mehrere Bedingungen können kombiniert werden.
- Sortierung: Wählen Sie ein Feld und die Sortierreihenfolge (aufsteigend/absteigend) aus.
- Paginierung: Legen Sie `Limit` und `Offset` fest, um die Anzahl der zurückgegebenen Zeilen zu steuern. Beim Debugging wird empfohlen, zunächst ein kleineres `Limit` einzustellen.

### Abfrage ausführen und Ergebnis anzeigen
- Klicken Sie auf „Abfrage ausführen“, um die Abfrage auszuführen. Nach der Rückgabe wechseln Sie in „Ergebnis anzeigen“ zwischen `Table / JSON`, um Spalten und Werte zu überprüfen.
- Bevor Sie Diagrammfelder zuordnen, bestätigen Sie hier die Spaltennamen und -typen, um zu vermeiden, dass das Diagramm später leer ist oder Fehler anzeigt.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Anschließende Feldzuordnung

Später, bei der Konfiguration der „Diagrammoptionen“, ordnen Sie Felder basierend auf den Tabellenfeldern der ausgewählten Datenquelle und Sammlung zu.

## SQL-Modus

### Abfrage schreiben
- Wechseln Sie in den „SQL“-Modus, geben Sie Ihre Abfrageanweisung ein und klicken Sie auf „Abfrage ausführen“.
- Beispiel (Gesamtbestellwert nach Datum):
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Abfrage ausführen und Ergebnis anzeigen

- Klicken Sie auf „Abfrage ausführen“, um die Abfrage auszuführen. Nach der Rückgabe wechseln Sie in „Ergebnis anzeigen“ zwischen `Table / JSON`, um Spalten und Werte zu überprüfen.
- Bevor Sie Diagrammfelder zuordnen, bestätigen Sie hier die Spaltennamen und -typen, um zu vermeiden, dass das Diagramm später leer ist oder Fehler anzeigt.

### Anschließende Feldzuordnung

Später, bei der Konfiguration der „Diagrammoptionen“, ordnen Sie Felder basierend auf den Spalten des Abfrageergebnisses zu.

> [!TIPP]
> Weitere Informationen zum SQL-Modus finden Sie unter Erweiterte Nutzung – Daten im SQL-Modus abfragen.