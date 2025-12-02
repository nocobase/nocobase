:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Daten im SQL-Modus abfragen

Wechseln Sie im Bereich „Datenabfrage“ in den SQL-Modus, schreiben und führen Sie Ihre Abfrage aus. Das zurückgegebene Ergebnis können Sie dann direkt für die Diagrammzuordnung und -darstellung verwenden.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## SQL-Anweisungen schreiben
- Wählen Sie im Bereich „Datenabfrage“ den „SQL“-Modus aus.
- Geben Sie Ihre SQL-Abfrage ein und klicken Sie auf „Abfrage ausführen“, um sie auszuführen.
- Es werden komplexe SQL-Anweisungen unterstützt, einschließlich Multi-Tabellen-JOINs und VIEWS.

Beispiel: Bestellbetrag pro Monat
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Ergebnisse anzeigen
- Klicken Sie auf „Daten anzeigen“, um den Vorschau-Bereich für die Daten zu öffnen.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Die Daten unterstützen die Paginierung; Sie können zwischen „Tabelle“ und „JSON“ wechseln, um Spaltennamen und -typen zu überprüfen.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Feldzuordnung
- Nehmen Sie in den „Diagrammoptionen“ die Feldzuordnung basierend auf den Spalten des Abfrageergebnisses vor.
- Standardmäßig wird die erste Spalte als Dimension (X-Achse oder Kategorie) und die zweite Spalte als Messwert (Y-Achse oder Wert) verwendet. Achten Sie daher auf die Spaltenreihenfolge in Ihrer SQL-Abfrage:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- Dimensionsfeld in der ersten Spalte
  SUM(total_amount) AS total -- Messfeld danach
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Kontextvariablen verwenden
Klicken Sie auf die Schaltfläche „x“ oben rechts im SQL-Editor, um Kontextvariablen auszuwählen.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Nach der Bestätigung wird der Variablenausdruck an der Cursorposition (oder an der Position des ausgewählten Textes) im SQL-Text eingefügt.

Zum Beispiel `{{ ctx.user.createdAt }}`. Achten Sie darauf, keine zusätzlichen Anführungszeichen hinzuzufügen.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Weitere Beispiele
Weitere Anwendungsbeispiele finden Sie in der NocoBase [Demo-Anwendung](https://demo3.sg.nocobase.com/admin/5xrop8s0bui).

**Empfehlungen:**
- Stabilisieren Sie die Spaltennamen, bevor Sie sie Diagrammen zuordnen, um spätere Fehler zu vermeiden.
- Setzen Sie während der Fehlersuche `LIMIT` ein, um die Anzahl der zurückgegebenen Zeilen zu reduzieren und die Vorschau zu beschleunigen.

## Vorschau, Speichern und Wiederherstellen
- Klicken Sie auf „Abfrage ausführen“, um Daten anzufordern und die Diagrammvorschau zu aktualisieren.
- Klicken Sie auf „Speichern“, um den aktuellen SQL-Text und die zugehörige Konfiguration in der Datenbank zu speichern.
- Klicken Sie auf „Abbrechen“, um zum zuletzt gespeicherten Zustand zurückzukehren und die aktuellen, nicht gespeicherten Änderungen zu verwerfen.