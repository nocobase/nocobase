---
title: 'Externes NocoBase'
description: 'Binden Sie eine andere NocoBase-Anwendung als externe Datenquelle ein und erfahren Sie mehr über Konfiguration, verfügbare Funktionen und Workflow-Einschränkungen.'
keywords: 'Externes NocoBase,NocoBase Datenquelle,Datenquellenverwaltung,Workflow,NocoBase'
---

# Externes NocoBase

## Einführung

Die externe NocoBase-Datenquelle bindet eine andere NocoBase-Anwendung in die aktuelle Anwendung ein und übernimmt dabei Metadaten aus der entfernten Anwendung, darunter Sammlungen, Feldoberflächen, Titel und Beziehungsfelder.

Im Vergleich zu einer externen Datenbankdatenquelle müssen Feldoberflächen in der Regel nicht erneut konfiguriert und Beziehungsfelder nicht manuell erstellt werden. Neben dem Anzeigen, Erstellen, Bearbeiten und Löschen von Datensätzen werden auch Datei-Upload und Vorschau, Import und Export, Diagrammabfragen sowie einige Workflow-Szenarien unterstützt.

## Datenquelle Hinzufügen

Aktivieren Sie das Plugin, fügen Sie in der Datenquellenverwaltung eine externe NocoBase-Datenquelle hinzu und tragen Sie die Zugriffsinformationen der entfernten Anwendung ein.

| Option | Beschreibung |
| --- | --- |
| API-Adresse | Die vollständige API-Adresse der entfernten NocoBase-Anwendung, z. B. `https://example.com/api` |
| Origin | Der öffentliche Ursprung der entfernten NocoBase-Anwendung, z. B. `https://example.com`. Er wird hauptsächlich für Vorschauadressen lokaler Dateien in der entfernten Anwendung verwendet |
| API-Key | Der Zugriffsnachweis, mit dem die aktuelle Anwendung auf die entfernte NocoBase-Anwendung zugreift |
| Anfrage-Header | Zusätzliche Header, die an die entfernte Anwendung gesendet werden, z. B. Space-Informationen |
| Timeout | Anfrage-Timeout für den Zugriff auf die entfernte Anwendung |

Nach dem Aktivieren der Datenquelle lädt das System die Sammlungen aus der entfernten Anwendung.

![](https://static-docs.nocobase.com/202606101149185.png)

## Berechtigungen

Eine externe NocoBase-Datenquelle wird sowohl von den Berechtigungen der aktuellen Anwendung als auch von denen der entfernten Anwendung beeinflusst.

- In der aktuellen Anwendung können Sie wie bei anderen externen Datenquellen Zugriffsrechte für verschiedene Sammlungen und Felder konfigurieren.
- In der entfernten Anwendung werden Daten gemäß den Berechtigungen des konfigurierten API-Keys gelesen und bearbeitet.

Externe NocoBase-Datenquellen geben keine Berechtigungsmetadaten zurück, mit denen die Sichtbarkeit von Schaltflächen im Frontend fein gesteuert wird. Daher werden einige Schaltflächen möglicherweise nicht wie bei der Hauptdatenquelle automatisch entsprechend den Berechtigungen ausgeblendet. Unabhängig davon, ob eine Schaltfläche sichtbar ist, werden abgeschickte Operationen weiterhin durch die serverseitige Berechtigungsprüfung der aktuellen Anwendung geprüft. Nicht autorisierte Operationen werden abgelehnt.

:::warning{title=Hinweis}
Verwenden Sie für die externe NocoBase-Datenquelle einen eigenen API-Key und gewähren Sie nur die erforderlichen Sammlungs- und Operationsberechtigungen. Wenn ein Benutzer in der aktuellen Anwendung berechtigt ist, die Operation aber fehlschlägt, prüfen Sie die Berechtigungen des entfernten API-Keys.
:::

## Sammlungen Verwenden

Nachdem die Sammlungen erfolgreich geladen wurden, wählen Sie diese Datenquelle in Seitenkonfigurationen, Blockkonfigurationen, Diagrammen oder Workflows aus, um Sammlungen aus der entfernten Anwendung zu verwenden.

Wenn sich die Sammlungsstruktur in der entfernten Anwendung ändert, laden Sie die Sammlungen in der aktuellen Anwendung erneut.

## Funktionen

Externe NocoBase-Datenquellen dienen hauptsächlich dazu, Sammlungen und Daten einer entfernten Anwendung in der aktuellen Anwendung zu verwenden. Sammlungsstruktur, Feldkonfiguration und tatsächliche Daten werden weiterhin in der entfernten Anwendung gepflegt.

### Sammlungen und Felder

Die aktuelle Anwendung lädt Metadaten aus der entfernten Anwendung, darunter Sammlungen, Feldoberflächen, Titel und Beziehungsfelder. Im Vergleich zu einer externen Datenbankdatenquelle müssen Sie Feldoberflächen in der aktuellen Anwendung normalerweise nicht erneut konfigurieren und Beziehungsfelder nicht manuell erstellen.

Die aktuelle Anwendung unterstützt keine direkte Feldkonfiguration für externe NocoBase-Datenquellen. Wenn Sie Felder hinzufügen, Feldtypen anpassen oder Beziehungsfelder ändern möchten, nehmen Sie diese Änderungen in der entfernten Anwendung vor und laden Sie anschließend die Sammlungen in der aktuellen Anwendung erneut.

### Datensätze und Verknüpfte Daten

Externe NocoBase-Datenquellen unterstützen das Anzeigen, Erstellen, Bearbeiten und Löschen von Datensätzen in Seitenblöcken sowie das Anzeigen und Pflegen verknüpfter Daten. Operationen werden von der aktuellen Anwendung ausgelöst und über den konfigurierten API-Key an die entfernte Anwendung gesendet.

### Dateien und Anhänge

Dateien werden in den von der entfernten Anwendung verwendeten Speicher hochgeladen. Die aktuelle Anwendung initiiert Upload-, Vorschau- und Download-Anfragen, speichert die Dateien selbst aber nicht.

Origin wird hauptsächlich für Vorschauadressen von Dateien verwendet, die in der entfernten Anwendung lokal gespeichert sind. Wenn die entfernte Anwendung einen relativen Pfad zurückgibt, ergänzt die aktuelle Anwendung mit Origin die vollständige Zugriffsadresse. Origin sollte die öffentliche Zugriffsadresse der entfernten NocoBase-Anwendung sein, zum Beispiel:

```text
https://example.com
```

Tragen Sie nicht die API-Adresse als Origin ein.

### Import und Export

Import- und Exportoperationen lesen oder schreiben die Datenquelle über externe Dateien und werden zur Ausführung an die entfernte Anwendung weitergeleitet. Die aktuelle Anwendung verarbeitet Benutzeroperationen, leitet Anfragen weiter und gibt Download-Ergebnisse zurück. Das tatsächliche Lesen und Schreiben der Daten erfolgt in der entfernten Anwendung.

- Datensätze importieren: Die aktuelle Anwendung nimmt die hochgeladene Importdatei entgegen und leitet sie zur Ausführung des Imports an die entfernte Anwendung weiter.
- Datensätze exportieren: Die aktuelle Anwendung leitet die Anfrage zum Exportieren von Datensätzen an die entfernte Anwendung weiter. Im synchronen Modus wird die von der entfernten Anwendung zurückgegebene Datensatzdatei als Stream an den Browser zum Download zurückgegeben. Im asynchronen Modus wird eine lokale asynchrone Aufgabe erstellt, der Export in der entfernten Anwendung gestartet, der Fortschritt mit der lokalen Aufgabe synchronisiert und die Ergebnisdatei beim Download als Stream aus der entfernten Anwendung abgerufen.
- Anhänge exportieren: Die aktuelle Anwendung leitet die Anfrage zum Exportieren von Anhängen an die entfernte Anwendung weiter. Im synchronen Modus wird das von der entfernten Anwendung zurückgegebene Anhangsarchiv als Stream an den Browser zum Download zurückgegeben. Im asynchronen Modus wird eine lokale asynchrone Aufgabe erstellt, der Anhangsexport in der entfernten Anwendung gestartet, der Fortschritt mit der lokalen Aufgabe synchronisiert und das Anhangsarchiv beim Download als Stream aus der entfernten Anwendung abgerufen.

### Vorlagendruck

Der Vorlagendruck kann Datensätze aus einer externen NocoBase-Datenquelle verwenden. Druckvorlagen und Druckaktionskonfigurationen werden in der aktuellen Anwendung gespeichert. Beim Drucken liest die aktuelle Anwendung entfernte Datensätze und verknüpfte Daten und erzeugt die Druckdatei in der aktuellen Anwendung.

### Diagramme

#### Abfragebereich

Externe NocoBase-Datenquellen können im Abfragebereich von Diagrammen verwendet werden. Die aktuelle Anwendung verarbeitet Abfrageparameter gemäß den lokal konfigurierten Berechtigungen für Diagramm, Datenquelle, Sammlung und Felder und fordert anschließend Ergebnisse von der entfernten Anwendung an.

Der entfernte API-Key muss ebenfalls Zugriff auf die entsprechenden Daten haben, sonst schlägt die Abfrage fehl.

#### SQL-Bereich

Der SQL-Bereich ist der SQL-Abfragemodus in Diagrammen und dient nur Abfragen. Die aktuelle Anwendung speichert die SQL-Konfiguration und startet den Aufruf, während das SQL zur Ausführung an die entfernte Anwendung weitergeleitet wird.

Bei Verwendung des SQL-Bereichs benötigt der lokale Benutzer UI-Konfigurationsberechtigungen in der aktuellen Anwendung, und der entfernte API-Key benötigt ebenfalls UI-Konfigurationsberechtigungen in der entfernten Anwendung. SQL wird nicht wie im Abfragebereich nach Sammlungs- und Feldberechtigungen aufgeschlüsselt. Gewähren Sie lokalen Benutzern und dem entsprechenden API-Key UI-Konfigurationsberechtigungen daher mit Vorsicht.

### Workflows

Externe NocoBase-Datenquellen können Workflows sowohl in der aktuellen als auch in der entfernten Anwendung betreffen. Die aktuelle Anwendung reagiert auf Ereignisse in lokalen Seiten, Schaltflächen und API-Anfrageketten. Nachdem die entfernte Anwendung weitergeleitete Anfragen erhalten hat, verarbeitet sie diese gemäß ihrer eigenen Workflow-Konfiguration.

Die aktuelle Anwendung überwacht keine Erstellungs-, Aktualisierungs- oder Löschereignisse, die innerhalb entfernter Sammlungen auftreten. Ereignisse entfernter Sammlungen werden nur in der entfernten Anwendung ausgelöst.

#### Auslöser

Die folgende Tabelle beschreibt, wie sich von externen NocoBase-Datenquellen betroffene Auslöser in der aktuellen und der entfernten Anwendung verhalten, wenn der entsprechende Workflow aktiviert ist.

| Auslöser | Aktuelle Anwendung | Entfernte Anwendung | Beschreibung |
| --- | --- | --- | --- |
| Ereignis vor Aktion | Wird ausgelöst | Nur im globalen Modus | In der aktuellen Anwendung wird der globale Modus ausgelöst, der lokale Modus folgt den Schaltflächenbindungen der aktuellen Anwendung. Nachdem die entfernte Anwendung die weitergeleitete Anfrage erhalten hat, wird nur der globale Modus ausgelöst |
| Ereignis nach Aktion | Wird ausgelöst | Nur im globalen Modus | In der aktuellen Anwendung wird der globale Modus ausgelöst, der lokale Modus folgt den Schaltflächenbindungen der aktuellen Anwendung. Nachdem die entfernte Anwendung die weitergeleitete Anfrage erhalten hat, wird nur der globale Modus ausgelöst |
| Benutzerdefiniertes Aktionsereignis | Wird ausgelöst | Wird nicht ausgelöst | Eine in der aktuellen Anwendung gebundene Schaltfläche "Workflow auslösen" startet den lokalen Workflow. Weitergeleitete CRUD-Anfragen lösen keine entfernten benutzerdefinierten Aktionsereignisse aus |
| Sammlungsereignis | Wird nicht ausgelöst | Wird ausgelöst | Die tatsächlichen Daten ändern sich in der entfernten Anwendung. Die aktuelle Anwendung löst keine lokalen Sammlungsereignisse aus, während die entfernte Anwendung ihre eigenen Sammlungsereignisse auslöst |
| Zeitplan-Auslöser für Datumsfeld | Wird nicht ausgelöst | Wird ausgelöst | Die aktuelle Anwendung löst nicht auf Basis von Feldern entfernter Sammlungen aus. Die entfernte Anwendung löst gemäß ihrer eigenen Datumsfeldkonfiguration aus |

Auslöser, die nicht von Datenquellen abhängen, werden in der aktuellen und in der entfernten Anwendung gemäß ihrer jeweiligen Konfiguration ausgelöst.

Um Workflows in der aktuellen Anwendung zu erstellen, die Daten einer externen NocoBase-Datenquelle bearbeiten, verwenden Sie Ereignisse vor Aktion, Ereignisse nach Aktion oder benutzerdefinierte Aktionsereignisse. Bestehende Workflows in der entfernten Anwendung werden unabhängig in der entfernten Anwendung ausgeführt.

#### Knoten

Die folgende Tabelle listet nur datenquellenbezogene Knoten auf. Allgemeine Knoten wie Bedingung, Berechnung, Schleife und JSON-Verarbeitung hängen nicht vom Datenquellentyp ab und können wie gewohnt verwendet werden.

| Knoten | Verfügbar | Beschreibung |
| --- | --- | --- |
| Datensätze abfragen | Verfügbar | Fragt Datensätze in der entfernten Anwendung ab |
| Datensatz erstellen | Verfügbar | Erstellt Datensätze in der entfernten Anwendung |
| Datensatz aktualisieren | Verfügbar | Aktualisiert Datensätze in der entfernten Anwendung |
| Datensatz löschen | Verfügbar | Löscht Datensätze in der entfernten Anwendung |
| SQL-Knoten | Nicht verfügbar | Der Workflow-SQL-Knoten unterstützt nur Datenbankdatenquellen |
| Aggregationsknoten | Nicht verfügbar | Der Aggregationsknoten unterstützt nur Datenbankdatenquellen |

## FAQ

### Sammlungen Werden Nicht Angezeigt

Prüfen Sie, ob die Datenquelle aktiviert ist und ob API-Adresse und API-Key korrekt sind. Die entfernte Anwendung muss dem API-Key außerdem Zugriff auf die entsprechenden Sammlungen erlauben.

### Dateien Wurden Hochgeladen, Können Aber Nicht Angezeigt Werden

Wenn die aktuelle Anwendung oder die entfernte Anwendung lokalen Dateispeicher verwendet, prüfen Sie, ob Origin die öffentliche Zugriffsadresse der entsprechenden Anwendung ist. Origin sollte nicht die API-Adresse sein.

### Die Aktuelle Anwendung Hat Berechtigungen, Aber Die Operation Schlägt Fehl

Prüfen Sie die API-Key-Berechtigungen in der entfernten Anwendung. Externe NocoBase-Datenquellen werden sowohl von den Berechtigungen der aktuellen Anwendung als auch von denen der entfernten Anwendung beeinflusst.

### Sammlungen Können Nach Einem Fehler Des Entfernten Dienstes Nicht Verwendet Werden

Wenn die entfernte Anwendung 502 zurückgibt, neu startet oder vorübergehend nicht verfügbar ist, kann die aktuelle Anwendung vorübergehend keine Metadaten entfernter Sammlungen lesen. Nachdem der entfernte Dienst wiederhergestellt ist, lädt die aktuelle Anwendung die Metadaten beim nächsten Zugriff auf die Sammlungen dieser Datenquelle automatisch neu.

### Warum Felder In Der Aktuellen Anwendung Nicht Konfiguriert Werden Können

Externe NocoBase-Datenquellen verwenden die Sammlungsstruktur und Feldkonfiguration der entfernten Anwendung. Passen Sie Felder in der entfernten Anwendung an und laden Sie anschließend die Sammlungen in der aktuellen Anwendung erneut.
