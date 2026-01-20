---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Import Pro

## Einführung

Das Import Pro Plugin bietet erweiterte Funktionen, die über die Standard-Importfunktion hinausgehen.

## Installation

Dieses Plugin benötigt das Plugin für Asynchrones Aufgabenmanagement. Bevor Sie es nutzen können, müssen Sie das Plugin für Asynchrones Aufgabenmanagement aktivieren.

## Funktionserweiterungen

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Unterstützt asynchrone Importvorgänge, die in einem separaten Thread ausgeführt werden und den Import großer Datenmengen ermöglichen.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Unterstützt erweiterte Importoptionen.

## Benutzerhandbuch

### Asynchroner Import

Nachdem Sie einen Import gestartet haben, läuft der Vorgang in einem separaten Hintergrund-Thread ab, ohne dass eine manuelle Konfiguration Ihrerseits nötig ist. In der Benutzeroberfläche sehen Sie nach dem Start des Imports oben rechts die aktuell ausgeführte Importaufgabe und deren Fortschritt in Echtzeit.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Nachdem der Import abgeschlossen ist, können Sie die Ergebnisse in den Importaufgaben einsehen.

#### Über die Leistung

Um die Leistung bei der Importierung großer Datenmengen zu bewerten, haben wir Vergleichstests unter verschiedenen Szenarien, Feldtypen und Auslösekonfigurationen durchgeführt. Beachten Sie, dass die Ergebnisse je nach Server- und Datenbankkonfiguration variieren können und nur als Referenz dienen.

| Datenmenge | Feldtypen | Import-Konfiguration | Bearbeitungszeit |
|------|---------|---------|---------|
| 1 Million Datensätze | Zeichenkette, Zahl, Datum, E-Mail, Langtext | • Workflow auslösen: Nein<br>• Duplikat-Identifikator: Keiner | ca. 1 Minute |
| 500.000 Datensätze | Zeichenkette, Zahl, Datum, E-Mail, Langtext, Viele-zu-Viele | • Workflow auslösen: Nein<br>• Duplikat-Identifikator: Keiner | ca. 16 Minuten|
| 500.000 Datensätze | Zeichenkette, Zahl, Datum, E-Mail, Langtext, Viele-zu-Viele, Viele-zu-Eins | • Workflow auslösen: Nein<br>• Duplikat-Identifikator: Keiner | ca. 22 Minuten |
| 500.000 Datensätze | Zeichenkette, Zahl, Datum, E-Mail, Langtext, Viele-zu-Viele, Viele-zu-Eins | • Workflow auslösen: Asynchrone Benachrichtigung auslösen<br>• Duplikat-Identifikator: Keiner | ca. 22 Minuten |
| 500.000 Datensätze | Zeichenkette, Zahl, Datum, E-Mail, Langtext, Viele-zu-Viele, Viele-zu-Eins | • Workflow auslösen: Asynchrone Benachrichtigung auslösen<br>• Duplikat-Identifikator: Duplikate aktualisieren, mit 50.000 doppelten Datensätzen | ca. 3 Stunden |

Basierend auf den obigen Leistungstestergebnissen und den aktuellen Designprinzipien geben wir Ihnen hier Erläuterungen und Empfehlungen zu den Einflussfaktoren:

1.  **Mechanismus zur Verarbeitung doppelter Datensätze**: Wenn Sie die Optionen **Doppelte Datensätze aktualisieren** oder **Nur doppelte Datensätze aktualisieren** auswählen, führt das System zeilenweise Abfrage- und Aktualisierungsvorgänge durch. Dies reduziert die Importeffizienz erheblich. Sollte Ihre Excel-Datei unnötige doppelte Daten enthalten, wirkt sich dies zusätzlich stark auf die Importgeschwindigkeit aus. Wir empfehlen Ihnen, unnötige doppelte Daten in der Excel-Datei vor dem Import zu bereinigen (z. B. mithilfe professioneller Deduplizierungstools), um unnötigen Zeitaufwand zu vermeiden.

2.  **Effizienz bei der Verarbeitung von Beziehungsfeldern**: Das System verarbeitet Beziehungsfelder, indem es Verknüpfungen zeilenweise abfragt. Dies kann bei großen Datenmengen zu einem Leistungsengpass werden. Für einfache Beziehungsstrukturen (z. B. eine Eins-zu-Viele-Verknüpfung zwischen zwei Sammlungen) empfehlen wir eine mehrstufige Importstrategie: Importieren Sie zuerst die Basisdaten der Haupt-Sammlung und stellen Sie die Beziehungen zwischen den Sammlungen erst danach her. Sollten Ihre Geschäftsanforderungen den gleichzeitigen Import von Beziehungsdaten erfordern, planen Sie Ihre Importzeit bitte unter Berücksichtigung der Leistungstestergebnisse in der obigen Tabelle.

3.  **Workflow-Auslösemechanismus**: Bei der Importierung großer Datenmengen wird nicht empfohlen, Workflow-Auslöser zu aktivieren. Dies hat hauptsächlich zwei Gründe:
    -   Selbst wenn der Status der Importaufgabe 100 % anzeigt, ist sie nicht sofort beendet. Das System benötigt noch zusätzliche Zeit, um die Workflow-Ausführungspläne zu erstellen. In dieser Phase generiert das System für jeden importierten Datensatz einen entsprechenden Workflow-Ausführungsplan. Dies belegt zwar den Import-Thread, beeinträchtigt jedoch nicht die Nutzung der bereits importierten Daten.
    -   Nachdem die Importaufgabe vollständig abgeschlossen ist, kann die gleichzeitige Ausführung einer großen Anzahl von Workflows die Systemressourcen stark beanspruchen. Dies wirkt sich auf die gesamte Systemreaktionsfähigkeit und die Benutzererfahrung aus.

Die oben genannten drei Einflussfaktoren werden wir zukünftig weiter optimieren.

### Importkonfiguration

#### Importoptionen - Workflow auslösen

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Beim Import können Sie auswählen, ob Workflows ausgelöst werden sollen. Wenn Sie diese Option aktivieren und die Sammlung an einen Workflow (Sammlungsereignis) gebunden ist, löst der Import die Workflow-Ausführung für jede Zeile aus.

#### Importoptionen - Doppelte Datensätze identifizieren

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Aktivieren Sie diese Option und wählen Sie den entsprechenden Modus. Beim Import werden dann doppelte Datensätze identifiziert und entsprechend verarbeitet.

Die Optionen in der Importkonfiguration werden als Standardwerte übernommen. Administratoren können festlegen, ob Uploader diese Optionen ändern dürfen (ausgenommen die Option zum Auslösen von Workflows).

**Berechtigungen für Uploader**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Uploadern erlauben, Importoptionen zu ändern

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Uploadern verbieten, Importoptionen zu ändern

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Modusbeschreibung

- Doppelte Datensätze überspringen: Basierend auf dem Inhalt des „Identifikationsfeldes“ werden vorhandene Datensätze abgefragt. Existiert der Datensatz bereits, wird die Zeile übersprungen; existiert er nicht, wird er als neuer Datensatz importiert.
- Doppelte Datensätze aktualisieren: Basierend auf dem Inhalt des „Identifikationsfeldes“ werden vorhandene Datensätze abgefragt. Existiert der Datensatz bereits, wird dieser aktualisiert; existiert er nicht, wird er als neuer Datensatz importiert.
- Nur doppelte Datensätze aktualisieren: Basierend auf dem Inhalt des „Identifikationsfeldes“ werden vorhandene Datensätze abgefragt. Existiert der Datensatz bereits, wird dieser aktualisiert; existiert er nicht, wird er übersprungen.

##### Identifikationsfeld

Anhand des Wertes in diesem Feld identifiziert das System, ob eine Zeile einen doppelten Datensatz darstellt.

- [Verknüpfungsregel](/interface-builder/actions/action-settings/linkage-rule): Schaltflächen dynamisch anzeigen/ausblenden;
- [Schaltfläche bearbeiten](/interface-builder/actions/action-settings/edit-button): Titel, Typ und Symbol der Schaltfläche bearbeiten;