:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Häufig gestellte Fragen (FAQ)

## Diagrammauswahl
### Welches Diagramm sollte ich verwenden?
Antwort: Wählen Sie das Diagramm passend zu Ihren Daten und Zielen aus:
- **Trends und Veränderungen:** Liniendiagramm oder Flächendiagramm
- **Wertevergleich:** Säulendiagramm oder Balkendiagramm
- **Anteilige Zusammensetzung:** Tortendiagramm oder Ringdiagramm
- **Korrelation und Verteilung:** Streudiagramm
- **Hierarchie und Fortschritt:** Trichterdiagramm

Weitere Diagrammtypen finden Sie in den [ECharts-Beispielen](https://echarts.apache.org/examples).

### Welche Diagrammtypen unterstützt NocoBase?
Antwort: Der visuelle Konfigurationsmodus enthält gängige Diagramme (wie Liniendiagramme, Flächendiagramme, Säulendiagramme, Balkendiagramme, Tortendiagramme, Ringdiagramme, Trichterdiagramme, Streudiagramme usw.). Im benutzerdefinierten Konfigurationsmodus können Sie alle Diagrammtypen von ECharts verwenden.

## Probleme bei der Datenabfrage
### Sind der visuelle Konfigurationsmodus und der SQL-Konfigurationsmodus miteinander kompatibel?
Antwort: Nein, die Konfigurationen sind voneinander unabhängig und werden separat gespeichert. Der Modus, der bei der letzten Speicherung verwendet wurde, ist der aktive Modus.

## Diagrammoptionen
### Wie konfiguriere ich Diagrammfelder?
Antwort: Im visuellen Konfigurationsmodus wählen Sie die entsprechenden Datenfelder basierend auf dem Diagrammtyp aus. Zum Beispiel benötigen Liniendiagramme oder Säulendiagramme Felder für die X-Achse und die Y-Achse, während Tortendiagramme ein Kategoriefeld und ein Wertefeld erfordern.
Es wird empfohlen, zuerst „Abfrage ausführen“ zu klicken, um zu überprüfen, ob die Daten Ihren Erwartungen entsprechen. Standardmäßig werden die Diagrammfelder automatisch zugeordnet.

## Vorschau- und Speicherprobleme
### Muss ich Änderungen nach der Konfiguration manuell in der Vorschau anzeigen?
Antwort: Im visuellen Konfigurationsmodus werden Änderungen automatisch in der Vorschau angezeigt. Im SQL- und benutzerdefinierten Konfigurationsmodus klicken Sie bitte manuell auf „Vorschau“, nachdem Sie die Bearbeitung abgeschlossen haben, um häufige Aktualisierungen zu vermeiden.

### Warum ist die Diagrammvorschau nach dem Schließen des Dialogfensters verschwunden?
Antwort: Die Vorschau dient lediglich zur temporären Ansicht. Bitte speichern Sie Ihre Änderungen, bevor Sie das Fenster schließen. Nicht gespeicherte Änderungen werden nicht beibehalten.