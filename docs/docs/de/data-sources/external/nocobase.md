---
title: 'Externes NocoBase'
description: 'Eine andere NocoBase-Anwendung als externe Datenquelle in die aktuelle Anwendung einbinden und mehr über Konfiguration, verfügbare Funktionen und Einschränkungen bei der Verwendung in Workflows erfahren.'
keywords: 'Externes NocoBase,NocoBase-Datenquelle,Datenquellenverwaltung,Workflow,NocoBase'
---

# Externes NocoBase

## Einführung

Mit einer externen NocoBase-Datenquelle kann eine andere NocoBase-Anwendung in die aktuelle Anwendung eingebunden werden. Dabei bleiben die in der entfernten Anwendung konfigurierten Metadaten wie Datentabellen, Feldoberflächen, Titel und Beziehungsfelder erhalten.

Im Vergleich zu einer externen Datenbank müssen nach dem Einbinden einer externen NocoBase-Anwendung in der Regel weder Feldoberflächen neu konfiguriert noch Beziehungsfelder manuell angelegt werden. Neben dem Anzeigen, Erstellen, Bearbeiten und Löschen von Datensätzen werden auch das Hochladen und die Vorschau von Dateien, der Import und Export, Diagrammabfragen sowie bestimmte Workflowszenarien unterstützt.

## Datenquelle hinzufügen

Aktivieren Sie das Plugin und fügen Sie unter „Datenquellenverwaltung“ eine externe NocoBase-Datenquelle hinzu. Geben Sie anschließend die Zugriffsinformationen der entfernten Anwendung ein.

| Konfigurationselement | Beschreibung                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------- |
| API-Adresse           | Vollständige API-Adresse der entfernten NocoBase-Anwendung, zum Beispiel `https://example.com/api` |
| Origin                | Zugriffsquelle der entfernten NocoBase-Anwendung, zum Beispiel `https://example.com`; wird hauptsächlich zur Verarbeitung von Vorschauadressen lokaler Dateien der entfernten Anwendung verwendet |
| API key               | Anmeldedaten, die von der aktuellen Anwendung für den Zugriff auf die entfernte NocoBase-Anwendung verwendet werden |
| Anfrage-Header        | Anfrage-Header, die zusätzlich an die entfernte Anwendung übergeben werden müssen, zum Beispiel Informationen zum Arbeitsbereich |
| Timeout               | Zeitüberschreitung für Anfragen an die entfernte Anwendung                                     |

Nach dem Aktivieren der Datenquelle lädt das System die Datentabellen der entfernten Anwendung.

![](https://static-docs.nocobase.com/202606101149185.png)

## Berechtigungen

Eine externe NocoBase-Datenquelle unterliegt sowohl den Berechtigungen der aktuellen Anwendung als auch denen der entfernten Anwendung.

- In der aktuellen Anwendung können wie bei anderen externen Datenquellen Zugriffsberechtigungen für verschiedene Tabellen und Felder konfiguriert werden.
- Die entfernte Anwendung liest und bearbeitet die entsprechenden Daten entsprechend den Berechtigungen des konfigurierten API key.

Eine externe NocoBase-Datenquelle gibt keine Berechtigungsmetadaten zurück, die für die detaillierte Steuerung der Schaltflächenanzeige im Frontend erforderlich sind. Daher werden einige Schaltflächen möglicherweise nicht wie bei der primären Datenquelle automatisch entsprechend den Berechtigungen ausgeblendet. Unabhängig davon, ob eine Schaltfläche angezeigt wird, wird die Berechtigung der aktuellen Anwendung beim Absenden der Operation weiterhin serverseitig geprüft. Nicht autorisierte Operationen werden abgelehnt.

:::warning{title=Hinweis}
Es wird empfohlen, für die externe NocoBase-Datenquelle einen eigenen API key zu verwenden und nur die erforderlichen Tabellen- und Operationsberechtigungen zu erteilen. Wenn in der aktuellen Anwendung die erforderlichen Berechtigungen vorhanden sind, eine Operation jedoch fehlschlägt, überprüfen Sie die Berechtigungen des API key der entfernten Anwendung.
:::

## Datenquellen verwenden

Nachdem die Datentabellen erfolgreich geladen wurden, können Sie diese Datenquelle in der Seitenkonfiguration, Blockkonfiguration, in Diagrammen oder Workflows auswählen und die Datentabellen der entfernten Anwendung verwenden.

Wenn sich die Struktur der Datentabellen in der entfernten Anwendung ändert, müssen die Datentabellen in der aktuellen Anwendung erneut geladen werden.

## Funktionsübersicht

Eine externe NocoBase-Datenquelle dient hauptsächlich dazu, die Datentabellen und Daten der entfernten Anwendung in der aktuellen Anwendung zu verwenden. Die Struktur der Datentabellen, die Feldkonfiguration und die tatsächlichen Daten werden weiterhin von der entfernten Anwendung verwaltet.

### Datentabellen und Felder

Die aktuelle Anwendung lädt Metadaten wie Datentabellen, Feldoberflächen, Titel und Beziehungsfelder aus der entfernten Anwendung. Im Vergleich zu einer externen Datenbank müssen Feldoberflächen in der Regel nicht in der aktuellen Anwendung neu konfiguriert und Beziehungsfelder nicht manuell angelegt werden.

Die aktuelle Anwendung unterstützt keine direkte Konfiguration der Felder einer externen NocoBase-Datenquelle. Wenn Sie Felder hinzufügen, Feldtypen anpassen oder Beziehungsfelder ändern müssen, führen Sie dies in der entfernten Anwendung durch und laden Sie anschließend die Datentabellen in der aktuellen Anwendung erneut.

### Datensätze und verknüpfte Daten

Eine externe NocoBase-Datenquelle unterstützt das Anzeigen, Erstellen, Bearbeiten und Löschen von Datensätzen in Seitenblöcken sowie das Anzeigen und Pflegen verknüpfter Daten. Die Operationen werden von der aktuellen Anwendung initiiert und über den konfigurierten API key an die entfernte Anwendung gesendet.

### Dateien und Anhänge

Dateien werden in dem von der entfernten Anwendung verwendeten Speicher abgelegt. Die aktuelle Anwendung initiiert die Anfragen zum Hochladen, zur Vorschau und zum Herunterladen. Die Dateien selbst werden nicht in der aktuellen Anwendung gespeichert.

Origin dient hauptsächlich zur Verarbeitung der Vorschauadressen von Dateien im lokalen Speicher der entfernten Anwendung. Wenn die entfernte Anwendung einen relativen Pfad zurückgibt, ergänzt die aktuelle Anwendung die Dateiadresse mithilfe von Origin. Origin sollte als öffentlich zugängliche Adresse der entfernten NocoBase-Anwendung angegeben werden, zum Beispiel:

```text
https://example.com
```

Tragen Sie die API-Adresse nicht als Origin ein.

### Import und Export

Import und Export sind Operationen zum Lesen und Schreiben von Daten über externe Dateien und werden zur Ausführung an die entfernte Anwendung weitergeleitet. Die aktuelle Anwendung empfängt die Benutzeraktion, leitet die Anfrage weiter und gibt das Download-Ergebnis zurück. Das tatsächliche Lesen und Schreiben der Daten erfolgt in der entfernten Anwendung.

- Datensätze importieren: Die aktuelle Anwendung empfängt die hochgeladene Importdatei und leitet sie zur Ausführung des Imports an die entfernte Anwendung weiter.
- Datensätze exportieren: Die aktuelle Anwendung leitet die Anfrage zum Exportieren von Datensätzen an die entfernte Anwendung weiter. Im synchronen Modus wird der von der entfernten Anwendung zurückgegebene Datensatzdateistream direkt an den Browser zum Herunterladen weitergeleitet. Im asynchronen Modus wird eine lokale asynchrone Aufgabe erstellt, der Export der Datensätze in der entfernten Anwendung gestartet und der Fortschritt synchronisiert. Beim Herunterladen des Ergebnisses wird die Datensatzdatei anschließend als Stream von der entfernten Anwendung abgerufen.
- Anhänge exportieren: Die aktuelle Anwendung leitet die Anfrage zum Exportieren von Anhängen an die entfernte Anwendung weiter. Im synchronen Modus wird das von der entfernten Anwendung zurückgegebene Anhangspaket direkt an den Browser zum Herunterladen weitergeleitet. Im asynchronen Modus wird eine lokale asynchrone Aufgabe erstellt, der Export der Anhänge in der entfernten Anwendung gestartet und der Fortschritt synchronisiert. Beim Herunterladen des Ergebnisses wird das Anhangspaket anschließend als Stream von der entfernten Anwendung abgerufen.

### Vorlagendruck

Beim Vorlagendruck können Datensätze aus einer externen NocoBase-Datenquelle verwendet werden. Druckvorlagen und Druckaktionen werden in der aktuellen Anwendung konfiguriert und gespeichert. Beim Drucken liest die aktuelle Anwendung die entfernten Datensätze und verknüpften Daten und erstellt die Druckdatei in der aktuellen Anwendung.

### Diagramme

#### Abfragebereich

Eine externe NocoBase-Datenquelle kann für Abfragebereiche von Diagrammen verwendet werden. Die aktuelle Anwendung verarbeitet die Abfrageparameter entsprechend den lokal konfigurierten Diagrammen, Datenquellen, Datentabellen und Feldberechtigungen und fordert anschließend die Ergebnisse bei der entfernten Anwendung an.

Der API key der entfernten Anwendung muss ebenfalls über die entsprechenden Zugriffsberechtigungen für die Daten verfügen, andernfalls schlägt die Abfrage fehl.

#### SQL-Bereich

Der SQL-Bereich ist ein SQL-Abfragemodus von Diagrammen und dient ausschließlich Abfragen. Die aktuelle Anwendung speichert die SQL-Konfiguration und initiiert den Aufruf. Die SQL-Abfrage wird zur Ausführung an die entfernte Anwendung weitergeleitet.

Bei Verwendung des SQL-Bereichs muss der lokale Benutzer über UI-Konfigurationsberechtigungen in der aktuellen Anwendung verfügen. Der API key muss außerdem in der entfernten Anwendung über UI-Konfigurationsberechtigungen verfügen. SQL-Abfragen werden nicht wie bei einem Abfragebereich anhand von Tabellen- und Feldberechtigungen in Abfrageparameter aufgeteilt. Erteilen Sie lokalen Benutzern und dem entsprechenden API key daher nur mit Bedacht UI-Konfigurationsberechtigungen.

### Workflows

Eine externe NocoBase-Datenquelle kann zwei Workflowsysteme umfassen: eines in der aktuellen Anwendung und eines in der entfernten Anwendung. Die aktuelle Anwendung reagiert auf Ereignisse in lokalen Seiten-, Schaltflächen- und API-Anfrageabläufen. Nachdem die entfernte Anwendung eine weitergeleitete Anfrage erhalten hat, verarbeitet sie diese entsprechend ihrer eigenen Workflowkonfiguration.

Beachten Sie, dass die aktuelle Anwendung keine Ereignisse zum Erstellen, Aktualisieren oder Löschen überwacht, die direkt in den Datentabellen der entfernten Anwendung auftreten. Ereignisse in den Datentabellen der entfernten Anwendung werden ausschließlich dort ausgelöst.

#### Trigger

Die folgende Tabelle beschreibt, wann Trigger, die von einer externen NocoBase-Datenquelle beeinflusst werden, in der aktuellen und der entfernten Anwendung ausgelöst werden, sofern der entsprechende Workflow aktiviert ist.

| Trigger                    | Aktuelle Anwendung | Entfernte Anwendung       | Beschreibung                                                                                 |
| -------------------------- | ------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| Ereignis vor der Anfrage   | Ausgelöst           | Nur im globalen Modus    | In der aktuellen Anwendung im globalen Modus ausgelöst; im lokalen Modus entsprechend der Schaltflächenbindung der aktuellen Anwendung. In der entfernten Anwendung wird nach Eingang der weitergeleiteten Anfrage nur der globale Modus ausgelöst. |
| Ereignis nach der Anfrage  | Ausgelöst           | Nur im globalen Modus    | In der aktuellen Anwendung im globalen Modus ausgelöst; im lokalen Modus entsprechend der Schaltflächenbindung der aktuellen Anwendung. In der entfernten Anwendung wird nach Eingang der weitergeleiteten Anfrage nur der globale Modus ausgelöst. |
| Ereignis einer benutzerdefinierten Aktion | Ausgelöst | Nicht ausgelöst | Die in der aktuellen Anwendung gebundene Schaltfläche „Workflow auslösen“ löst den lokalen Ablauf aus. Weitergeleitete CRUD-Anfragen lösen in der entfernten Anwendung kein Ereignis einer benutzerdefinierten Aktion aus. |
| Datentabellenereignis      | Nicht ausgelöst    | Ausgelöst                 | Die tatsächliche Datenänderung erfolgt in der entfernten Anwendung, daher wird in der aktuellen Anwendung kein lokales Datentabellenereignis ausgelöst. Die entfernte Anwendung löst ihre eigenen Datentabellenereignisse aus. |
| Zeitgesteuerter Trigger für Datumsfelder | Nicht ausgelöst | Ausgelöst | Die aktuelle Anwendung löst keinen Trigger anhand von Feldern in entfernten Datentabellen aus. Die entfernte Anwendung löst ihn entsprechend ihrer eigenen Konfiguration für Datumsfelder aus. |

Trigger, die nicht von einer Datenquelle abhängen, werden in der aktuellen und der entfernten Anwendung jeweils entsprechend ihrer eigenen Konfiguration ausgelöst.

Wenn Sie in der aktuellen Anwendung einen Ablauf für die Verarbeitung von Daten aus einer externen NocoBase-Datenquelle erstellen möchten, wird empfohlen, ein Ereignis vor der Anfrage, ein Ereignis nach der Anfrage oder ein Ereignis einer benutzerdefinierten Aktion zu verwenden. Bereits vorhandene Workflows in der entfernten Anwendung werden unabhängig von der entfernten Anwendung ausgeführt.

#### Knoten

Die folgende Tabelle enthält nur datenquellenbezogene Knoten. Allgemeine Knoten wie Bedingungen, Berechnungen, Schleifen und JSON-Verarbeitung hängen nicht vom Datenquellentyp ab und können wie in normalen Workflows verwendet werden.

| Knoten          | Verfügbar | Beschreibung                              |
| --------------- | --------- | ----------------------------------------- |
| Datensätze abfragen | Verfügbar | Datensätze in der entfernten Anwendung abfragen |
| Datensatz erstellen | Verfügbar | Einen Datensatz in der entfernten Anwendung erstellen |
| Datensatz aktualisieren | Verfügbar | Einen Datensatz in der entfernten Anwendung aktualisieren |
| Datensatz löschen | Verfügbar | Einen Datensatz in der entfernten Anwendung löschen |
| SQL-Knoten      | Nicht verfügbar | SQL-Knoten in Workflows unterstützen nur Datenbankdatenquellen |
| Aggregationsknoten | Nicht verfügbar | Aggregationsknoten unterstützen nur Datenbankdatenquellen |

## Häufige Fragen

### Datentabelle wird nicht angezeigt

Überprüfen Sie, ob die Datenquelle aktiviert ist und ob API-Adresse und API key korrekt sind. In der entfernten Anwendung muss der API key außerdem Zugriff auf die entsprechende Datentabelle haben.

### Datei wurde erfolgreich hochgeladen, kann aber nicht in der Vorschau angezeigt werden

Wenn die aktuelle oder die entfernte Anwendung lokalen Dateispeicher verwendet, überprüfen Sie, ob Origin als öffentlich zugängliche Adresse der entsprechenden Anwendung eingetragen ist. Origin darf nicht als API-Adresse eingetragen werden.

### In der aktuellen Anwendung sind Berechtigungen vorhanden, die Operation schlägt jedoch fehl

Überprüfen Sie die Berechtigungen des API key der entfernten Anwendung. Eine externe NocoBase-Datenquelle unterliegt gleichzeitig den Berechtigungen der aktuellen und der entfernten Anwendung.

### Datentabelle kann nach einer Störung des entfernten Dienstes nicht verwendet werden

Wenn bei der entfernten Anwendung ein 502-Fehler, ein Neustart oder eine vorübergehende Nichtverfügbarkeit auftritt, kann die aktuelle Anwendung die Metadaten der entfernten Datentabellen möglicherweise vorübergehend nicht lesen. Sobald der entfernte Dienst wieder verfügbar ist, lädt die aktuelle Anwendung die Metadaten beim nächsten Zugriff auf die Datentabellen dieser Datenquelle automatisch erneut.

### Warum können Felder nicht in der aktuellen Anwendung konfiguriert werden?

Eine externe NocoBase-Datenquelle verwendet die Struktur der Datentabellen und die Feldkonfiguration der entfernten Anwendung. Passen Sie die Felder in der entfernten Anwendung an und laden Sie anschließend die Datentabellen in der aktuellen Anwendung erneut.
