:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Sammlungsereignisse

## Einführung

Trigger vom Typ Sammlungsereignis überwachen Erstellungs-, Aktualisierungs- und Löschereignisse einer Sammlung. Wenn eine Datenoperation an dieser Sammlung stattfindet und die konfigurierten Bedingungen erfüllt sind, wird der entsprechende Workflow ausgelöst. Zum Beispiel Szenarien wie die Reduzierung des Produktbestands nach einer neuen Bestellung oder die Wartezeit auf eine manuelle Überprüfung nach dem Hinzufügen eines neuen Kommentars.

## Grundlegende Verwendung

Es gibt verschiedene Arten von Änderungen an Sammlungen:

1. Nach dem Erstellen von Daten.
2. Nach dem Aktualisieren von Daten.
3. Nach dem Erstellen oder Aktualisieren von Daten.
4. Nach dem Löschen von Daten.

![Sammlungsereignis_Auslösezeitpunkt_Auswahl](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Sie können den Auslösezeitpunkt entsprechend den unterschiedlichen Geschäftsanforderungen auswählen. Wenn die ausgewählte Änderungsart die Aktualisierung der Sammlung beinhaltet, können Sie auch die Felder einschränken, die sich geändert haben. Die Auslösebedingung ist nur erfüllt, wenn sich die ausgewählten Felder ändern. Wenn keine Felder ausgewählt sind, bedeutet dies, dass eine Änderung in jedem Feld den Trigger auslösen kann.

![Sammlungsereignis_Geänderte_Felder_Auswahl](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Genauer gesagt, können Sie Bedingungsregeln für jedes Feld der auslösenden Datenzeile konfigurieren. Der Trigger wird nur ausgelöst, wenn die Felder die entsprechenden Bedingungen erfüllen.

![Sammlungsereignis_Datenbedingungen_Konfigurieren](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Nachdem ein Sammlungsereignis ausgelöst wurde, wird die Datenzeile, die das Ereignis generiert hat, als Trigger-Kontextdaten in den Ausführungsplan injiziert, damit sie von nachfolgenden Knoten im Workflow als Variablen verwendet werden kann. Wenn nachfolgende Knoten jedoch die Beziehungsfelder dieser Daten verwenden müssen, müssen Sie zuerst das Vorladen der Beziehungsdaten konfigurieren. Die ausgewählten Beziehungsdaten werden zusammen mit dem Trigger in den Kontext injiziert und können hierarchisch ausgewählt und verwendet werden.

## Verwandte Hinweise

### Auslösung durch Massendatenoperationen wird derzeit nicht unterstützt

Sammlungsereignisse unterstützen derzeit keine Auslösung durch Massendatenoperationen. Zum Beispiel, wenn Sie einen Artikel erstellen und gleichzeitig mehrere Tags für diesen Artikel hinzufügen (Daten mit Eins-zu-Viele-Beziehung), wird nur der Workflow für die Erstellung des Artikels ausgelöst. Die gleichzeitig erstellten Tags lösen den Workflow für die Erstellung von Tags nicht aus. Beim Verknüpfen oder Hinzufügen von Daten mit Viele-zu-Viele-Beziehungen wird auch der Workflow für die Zwischentabelle nicht ausgelöst.

### Datenoperationen außerhalb der Anwendung lösen keine Ereignisse aus

Operationen an Sammlungen über HTTP-API-Aufrufe der Anwendungsschnittstelle können ebenfalls entsprechende Ereignisse auslösen. Wenn Datenänderungen jedoch nicht über die NocoBase-Anwendung, sondern direkt über Datenbankoperationen vorgenommen werden, können die entsprechenden Ereignisse nicht ausgelöst werden. Zum Beispiel werden native Datenbank-Trigger nicht mit Workflows in der Anwendung verknüpft.

Zusätzlich entspricht die Verwendung des SQL-Aktionsknotens zur Durchführung von Datenbankoperationen einer direkten Datenbankoperation und löst keine Sammlungsereignisse aus.

### Externe Datenquellen

Workflows unterstützen externe Datenquellen seit Version `0.20`. Wenn Sie ein externes Datenquellen-Plugin verwenden und das Sammlungsereignis für eine externe Datenquelle konfiguriert ist, können die entsprechenden Sammlungsereignisse ausgelöst werden, solange die Datenoperationen an dieser Datenquelle innerhalb der Anwendung durchgeführt werden (z. B. Benutzererstellung, Aktualisierungen und Workflow-Datenoperationen). Wenn die Datenänderungen jedoch über andere Systeme oder direkt in der externen Datenbank vorgenommen werden, können keine Sammlungsereignisse ausgelöst werden.

## Beispiel

Nehmen wir als Beispiel das Szenario, in dem nach dem Erstellen einer neuen Bestellung der Gesamtpreis berechnet und der Lagerbestand reduziert wird.

Zuerst erstellen wir eine Sammlung für Produkte und eine für Bestellungen mit den folgenden Datenmodellen:

| Feldname | Feldtyp |
| -------- | -------- |
| Produktname | Einzeiliger Text |
| Preis     | Zahl     |
| Lagerbestand     | Ganzzahl     |

| Feldname | Feldtyp       |
| -------- | -------------- |
| Bestell-ID   | Sequenz       |
| Bestellprodukt | Viele-zu-Eins (Produkte) |
| Gesamtpreis der Bestellung | Zahl           |

Und fügen Sie einige grundlegende Produktdaten hinzu:

| Produktname      | Preis | Lagerbestand |
| ------------- | ---- | ---- |
| iPhone 14 Pro | 7999 | 10   |
| iPhone 13 Pro | 5999 | 0    |

Erstellen Sie dann einen Workflow, der auf einem Sammlungsereignis der Bestellsammlung basiert:

![Sammlungsereignis_Beispiel_Neue_Bestellung_Auslöser](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Hier sind einige der Konfigurationsoptionen:

- Sammlung: Wählen Sie die Sammlung „Bestellungen“.
- Auslösezeitpunkt: Wählen Sie „Nach dem Erstellen von Daten“.
- Auslösebedingungen: Leer lassen.
- Beziehungsdaten vorladen: Aktivieren Sie „Produkte“.

Konfigurieren Sie dann weitere Knoten gemäß der Workflow-Logik: Prüfen Sie, ob der Produktbestand größer als 0 ist. Wenn ja, reduzieren Sie den Lagerbestand; andernfalls ist die Bestellung ungültig und sollte gelöscht werden.

![Sammlungsereignis_Beispiel_Neue_Bestellung_Workflow_Orchestrierung](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

Die Konfiguration der Knoten wird in der Dokumentation für spezifische Knotentypen detailliert erläutert.

Aktivieren Sie diesen Workflow und testen Sie ihn, indem Sie eine neue Bestellung über die Benutzeroberfläche erstellen. Nachdem eine Bestellung für „iPhone 14 Pro“ aufgegeben wurde, wird der Lagerbestand des entsprechenden Produkts auf 9 reduziert. Wenn jedoch eine Bestellung für „iPhone 13 Pro“ aufgegeben wird, wird die Bestellung aufgrund unzureichenden Lagerbestands gelöscht.

![Sammlungsereignis_Beispiel_Neue_Bestellung_Ausführungsergebnis](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)