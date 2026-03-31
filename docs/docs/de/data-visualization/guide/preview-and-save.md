:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Vorschau und Speichern

*   **Vorschau**: Zeigt Änderungen aus dem Konfigurationspanel temporär im Seiten-Diagramm an, um deren Wirkung zu überprüfen.
*   **Speichern**: Überträgt Änderungen aus dem Konfigurationspanel dauerhaft in die Datenbank.

## Zugriffspunkte

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

*   Im grafischen Konfigurationsmodus (Basic-Modus) werden Änderungen standardmäßig automatisch in der Vorschau angewendet.
*   Im SQL- und Custom-Modus können Sie nach Änderungen auf die Schaltfläche **Vorschau** auf der rechten Seite klicken, um die Änderungen in der Vorschau anzuzeigen.
*   Am unteren Rand des gesamten Konfigurationspanels finden Sie eine einheitliche Schaltfläche **Vorschau**.

## Verhalten der Vorschau

*   Die Konfiguration wird temporär auf der Seite angezeigt, jedoch nicht in die Datenbank geschrieben. Nach dem Aktualisieren der Seite oder dem Abbrechen des Vorgangs wird das Vorschauergebnis nicht beibehalten.
*   Integrierte Entprellung: Wenn innerhalb kurzer Zeit mehrere Aktualisierungen ausgelöst werden, wird nur die letzte ausgeführt, um häufige Anfragen zu vermeiden.
*   Ein erneuter Klick auf **Vorschau** überschreibt das vorherige Vorschauergebnis.

## Fehlermeldungen

*   Abfragefehler oder Validierungsfehler: Werden im Bereich „Daten anzeigen“ angezeigt.
*   Diagramm-Konfigurationsfehler (fehlende Basic-Zuordnung, Ausnahmen durch Custom JS): Werden im Diagrammbereich oder in der Konsole angezeigt, wobei die Seite weiterhin bedienbar bleibt.
*   Bestätigen Sie Spaltennamen und Datentypen zuerst unter „Daten anzeigen“, bevor Sie eine Feldzuordnung vornehmen oder Custom-Code schreiben, um Fehler effektiv zu reduzieren.

## Speichern und Abbrechen

*   **Speichern**: Schreibt die aktuellen Änderungen in die Blockkonfiguration und wendet sie sofort auf die Seite an.
*   **Abbrechen**: Verwürft die aktuellen, nicht gespeicherten Änderungen im Panel und stellt den zuletzt gespeicherten Zustand wieder her.
*   Speicherumfang:
    *   Datenabfrage: Die Abfrageparameter des Builders; im SQL-Modus wird zusätzlich der SQL-Text gespeichert.
    *   Diagrammoptionen: Typ, Feldzuordnung und Eigenschaften des Basic-Modus; der JS-Text des Custom-Modus.
    *   Interaktionsereignisse: Der JS-Text und die Bindungslogik der Ereignisse.
*   Nach dem Speichern wird der Block für alle Besucher wirksam (abhängig von den Seitenberechtigungen).

## Empfohlener Arbeitsablauf

*   Datenabfrage konfigurieren → Abfrage ausführen → Daten anzeigen, um Spaltennamen und Typen zu bestätigen → Diagrammoptionen konfigurieren, um Kernfelder zuzuordnen → Vorschau zur Validierung → Speichern zur Anwendung.