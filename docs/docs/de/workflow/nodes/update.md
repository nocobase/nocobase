:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Daten aktualisieren

Dieser Knoten dient dazu, Daten in einer Sammlung zu aktualisieren, die bestimmte Bedingungen erfüllen.

Die Konfiguration der Sammlung und der Feldzuweisungen ist identisch mit der des Knotens zum Erstellen von Datensätzen. Der Hauptunterschied des „Daten aktualisieren“-Knotens liegt in den zusätzlichen Filterbedingungen und der Notwendigkeit, einen Aktualisierungsmodus auszuwählen. Zusätzlich gibt der „Daten aktualisieren“-Knoten die Anzahl der erfolgreich aktualisierten Zeilen zurück. Dieses Ergebnis ist jedoch nur im Ausführungsverlauf sichtbar und kann nicht als Variable in nachfolgenden Knoten verwendet werden.

## Knoten erstellen

Im Konfigurationsbereich des Workflows klicken Sie auf das Plus-Symbol („+“) im Ablauf, um einen „Daten aktualisieren“-Knoten hinzuzufügen:

![Daten aktualisieren-Knoten hinzufügen](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Knotenkonfiguration

![Konfiguration des Aktualisierungsknotens](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Sammlung

Wählen Sie die Sammlung aus, in der Daten aktualisiert werden sollen.

### Aktualisierungsmodus

Es gibt zwei Aktualisierungsmodi:

*   **Massenaktualisierung**: Löst keine Sammlungsereignisse für jeden aktualisierten Datensatz aus. Dies bietet eine bessere Leistung und eignet sich für Aktualisierungsvorgänge mit großen Datenmengen.
*   **Einzelaktualisierung**: Löst Sammlungsereignisse für jeden aktualisierten Datensatz aus. Bei großen Datenmengen kann dies jedoch zu Leistungsproblemen führen und sollte mit Vorsicht verwendet werden.

Die Wahl hängt in der Regel von den zu aktualisierenden Zieldaten und davon ab, ob andere Workflow-Ereignisse ausgelöst werden sollen. Wenn Sie einen einzelnen Datensatz basierend auf dem Primärschlüssel aktualisieren, wird die **Einzelaktualisierung** empfohlen. Wenn Sie mehrere Datensätze basierend auf Bedingungen aktualisieren, wird die **Massenaktualisierung** empfohlen.

### Filterbedingungen

Ähnlich wie bei den Filterbedingungen einer normalen Sammlungsabfrage können Sie Kontextvariablen aus dem Workflow verwenden.

### Feldwerte

Ähnlich wie bei der Feldzuweisung im Knoten zum Erstellen von Datensätzen können Sie Kontextvariablen aus dem Workflow verwenden oder statische Werte manuell eingeben.

Hinweis: Daten, die vom „Daten aktualisieren“-Knoten in einem Workflow aktualisiert werden, verarbeiten die Daten des Feldes „Zuletzt geändert von“ nicht automatisch. Sie müssen den Wert dieses Feldes bei Bedarf selbst konfigurieren.

## Beispiel

Wenn beispielsweise ein neuer „Artikel“ erstellt wird, müssen Sie das Feld „Artikelanzahl“ in der Sammlung „Artikelkategorie“ automatisch aktualisieren. Dies kann mit dem „Daten aktualisieren“-Knoten erreicht werden:

![Beispielkonfiguration des Aktualisierungsknotens](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Nachdem der Workflow ausgelöst wurde, aktualisiert er automatisch das Feld „Artikelanzahl“ der Sammlung „Artikelkategorie“ auf die aktuelle Artikelanzahl + 1.