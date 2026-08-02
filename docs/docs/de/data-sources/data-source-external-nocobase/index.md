---
title: 'Externes NocoBase'
description: 'Eine andere NocoBase-Anwendung als externe Datenquelle in die aktuelle Anwendung integrieren und Konfiguration, verfügbare Funktionen sowie Einschränkungen bei der Workflow-Nutzung kennenlernen.'
keywords: 'Externes NocoBase,NocoBase-Datenquelle,Datenquellenverwaltung,Workflow,NocoBase'
---

# Externes NocoBase

## Einführung

Mit einer externen NocoBase-Datenquelle kann eine andere NocoBase-Anwendung in die aktuelle Anwendung integriert werden. Dabei bleiben die in der entfernten Anwendung konfigurierten Metadaten wie Datentabellen, Feldoberflächen, Titel und Beziehungsfelder erhalten.

Im Vergleich zu einer externen Datenbank-Datenquelle müssen nach der Anbindung von NocoBase in der Regel weder Feldoberflächen neu konfiguriert noch Beziehungsfelder manuell angelegt werden. Neben dem Anzeigen, Erstellen, Bearbeiten und Löschen von Datensätzen werden auch das Hochladen und die Vorschau von Dateien, Import und Export, Diagrammabfragen sowie bestimmte Workflowszenarien unterstützt.

## Datenquelle hinzufügen

Aktivieren Sie das Plugin und fügen Sie unter „Datenquellenverwaltung“ eine externe NocoBase-Datenquelle hinzu. Geben Sie anschließend die Zugangsdaten der entfernten Anwendung ein.

| Konfiguration | Beschreibung                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------- |
| API-Adresse  | Vollständige API-Adresse der entfernten NocoBase-Anwendung, zum Beispiel `https://example.com/api` |
| Origin       | Zugriffsadresse der entfernten NocoBase-Anwendung, zum Beispiel `https://example.com`; wird hauptsächlich für die Verarbeitung von Vorschauadressen lokaler Dateien der entfernten Anwendung verwendet |
| API key      | Anmeldedaten, die von der aktuellen Anwendung für den Zugriff auf die entfernte NocoBase-Anwendung verwendet werden |
| Request-Header | Header, die zusätzlich an die entfernte Anwendung übergeben werden müssen, zum Beispiel Informationen zum Namespace |
| Timeout      | Zeitüberschreitung für Anfragen an die entfernte Anwendung                                      |

Nach der Aktivierung der Datenquelle lädt das System die Datentabellen der entfernten Anwendung.

![](https://static-docs.nocobase.com/202606101149185.png)

## Berechtigungen

Eine externe NocoBase-Datenquelle wird sowohl von den Berechtigungen der aktuellen Anwendung als auch von denen der entfernten Anwendung beeinflusst.

- In der aktuellen Anwendung können wie bei anderen externen Datenquellen Zugriffsberechtigungen für verschiedene Tabellen und Felder konfiguriert werden;
- Die entfernte Anwendung liest und bearbeitet die entsprechenden Daten gemäß den Berechtigungen des konfigurierten API-Schlüssels.

Eine externe NocoBase-Datenquelle liefert keine Berechtigungsmetadaten, mit denen der Anzeigestatus von Schaltflächen im Frontend detailliert gesteuert werden kann. Daher werden einige Schaltflächen möglicherweise nicht wie bei der primären Datenquelle automatisch anhand der Berechtigungen ausgeblendet. Unabhängig davon, ob eine Schaltfläche angezeigt wird, wird die Berechtigung beim Absenden der Aktion weiterhin serverseitig von der aktuellen Anwendung geprüft. Nicht autorisierte Aktionen werden abgelehnt.

:::warning{title=Hinweis}
Es wird empfohlen, für die externe NocoBase-Datenquelle einen eigenen API-Schlüssel zu verwenden und ihm nur die erforderlichen Tabellen- und Aktionsberechtigungen zu erteilen. Wenn in der aktuellen Anwendung die erforderlichen Berechtigungen vorhanden sind, eine Aktion jedoch fehlschlägt, überprüfen Sie die Berechtigungen des API-Schlüssels der entfernten Anwendung.
:::

## Datentabellen verwenden

Nachdem die Datentabellen erfolgreich geladen wurden, wählen Sie diese Datenquelle in der Seiten-, Block-, Diagramm- oder Workflow-Konfiguration aus, um die Datentabellen der entfernten Anwendung zu verwenden.

Wenn sich die Struktur der Datentabellen in der entfernten Anwendung ändert, müssen die Datentabellen in der aktuellen Anwendung erneut geladen werden.

## Funktionsübersicht

Eine externe NocoBase-Datenquelle dient hauptsächlich dazu, Datentabellen und Daten der entfernten Anwendung in der aktuellen Anwendung zu verwenden. Struktur der Datentabellen, Feldkonfigurationen und tatsächliche Daten werden weiterhin von der entfernten Anwendung verwaltet.

### Datentabellen und Felder

Die aktuelle Anwendung lädt Metadaten wie Datentabellen, Feldoberflächen, Titel und Beziehungsfelder aus der entfernten Anwendung. Im Vergleich zu einer externen Datenbank-Datenquelle müssen Feldoberflächen in der aktuellen Anwendung in der Regel nicht neu konfiguriert und Beziehungsfelder nicht manuell angelegt werden.

Die aktuelle Anwendung unterstützt keine direkte Konfiguration von Feldern einer externen NocoBase-Datenquelle. Wenn Felder hinzugefügt, Feldtypen angepasst oder Beziehungsfelder geändert werden müssen, nehmen Sie diese Änderungen in der entfernten Anwendung vor und laden Sie anschließend die Datentabellen in der aktuellen Anwendung erneut.

### Datensätze und verknüpfte Daten

Eine externe NocoBase-Datenquelle unterstützt das Anzeigen, Erstellen, Bearbeiten und Löschen von Datensätzen in Seitenblöcken sowie das Anzeigen und Pflegen verknüpfter Daten. Die Aktionen werden von der aktuellen Anwendung initiiert, die über den konfigurierten API-Schlüssel Anfragen an die entfernte Anwendung sendet.

### Dateien und Anhänge

Dateien werden in dem von der entfernten Anwendung verwendeten Speicher abgelegt. Die aktuelle Anwendung initiiert Upload-, Vorschau- und Downloadanfragen; die Dateien selbst werden nicht in der aktuellen Anwendung gespeichert.

Origin wird hauptsächlich für die Verarbeitung der Vorschauadressen von Dateien im lokalen Speicher der entfernten Anwendung verwendet. Wenn die entfernte Anwendung einen relativen Pfad zurückgibt, ergänzt die aktuelle Anwendung die Dateiadresse mit Origin. Als Origin sollte die öffentlich zugängliche Adresse der entfernten NocoBase-Anwendung eingetragen werden, zum Beispiel:

```text
https://example.com
```

Tragen Sie die API-Adresse nicht als Origin ein.

### Import und Export

Import und Export sind Vorgänge zum Lesen und Schreiben einer Datenquelle über externe Dateien und werden vollständig an die entfernte Anwendung weitergeleitet. Die aktuelle Anwendung nimmt die Benutzeraktion entgegen, leitet die Anfrage weiter und gibt das Downloadergebnis zurück. Das eigentliche Lesen und Schreiben der Daten erfolgt durch die entfernte Anwendung.

- Datensätze importieren: Die aktuelle Anwendung nimmt die hochgeladene Importdatei entgegen und leitet sie zur Ausführung des Imports an die entfernte Anwendung weiter;
- Datensätze exportieren: Die aktuelle Anwendung leitet die Anfrage zum Export von Datensätzen an die entfernte Anwendung weiter. Im synchronen Modus wird der von der entfernten Anwendung zurückgegebene Datensatz-Dateistream direkt an den Browser zum Download weitergeleitet. Im asynchronen Modus wird eine lokale asynchrone Aufgabe erstellt, der Export der Datensätze in der entfernten Anwendung gestartet und der Fortschritt synchronisiert. Beim Herunterladen des Ergebnisses wird der Datensatz-Dateistream anschließend von der entfernten Anwendung abgerufen.
- Anhänge exportieren: Die aktuelle Anwendung leitet die Anfrage zum Export von Anhängen an die entfernte Anwendung weiter. Im synchronen Modus wird das von der entfernten Anwendung zurückgegebene Anhangspaket direkt an den Browser zum Download weitergeleitet. Im asynchronen Modus wird eine lokale asynchrone Aufgabe erstellt, der Export der Anhänge in der entfernten Anwendung gestartet und der Fortschritt synchronisiert. Beim Herunterladen des Ergebnisses wird das Anhangspaket anschließend als Stream von der entfernten Anwendung abgerufen.

### Vorlagendruck

Für den Vorlagendruck können Datensätze aus einer externen NocoBase-Datenquelle verwendet werden. Druckvorlagen und Druckaktionen werden in der aktuellen Anwendung konfiguriert und gespeichert. Beim Drucken liest die aktuelle Anwendung die entfernten Datensätze und verknüpften Daten und erstellt die Druckdatei in der aktuellen Anwendung.

### Diagramme

#### Abfragebereich

Eine externe NocoBase-Datenquelle kann für Diagramm-Abfragebereiche verwendet werden. Die aktuelle Anwendung verarbeitet die Abfrageparameter anhand der lokal konfigurierten Diagramme, Datenquellen, Datentabellen und Feldberechtigungen und fordert anschließend die Ergebnisse von der entfernten Anwendung an.

Der API-Schlüssel der entfernten Anwendung muss ebenfalls über Zugriffsberechtigungen für die entsprechenden Daten verfügen, andernfalls schlägt die Abfrage fehl.

#### SQL-Bereich

Der SQL-Bereich ist ein SQL-Abfragemodus für Diagramme und dient ausschließlich Abfragen. Die aktuelle Anwendung speichert die SQL-Konfiguration und initiiert den Aufruf; die SQL-Abfrage wird zur Ausführung an die entfernte Anwendung weitergeleitet.

Bei Verwendung des SQL-Bereichs benötigt der lokale Benutzer UI-Konfigurationsberechtigungen in der aktuellen Anwendung. Der API-Schlüssel muss außerdem in der entfernten Anwendung über UI-Konfigurationsberechtigungen verfügen. SQL-Abfragen werden im Gegensatz zu Abfragen im Abfragebereich nicht anhand von Tabellen- und Feldberechtigungen in Abfrageparameter aufgeteilt. Vergeben Sie die UI-Konfigurationsberechtigungen für lokale Benutzer und den entsprechenden API-Schlüssel daher mit Bedacht.

### Workflows

Eine externe NocoBase-Datenquelle kann zwei Workflowsysteme betreffen: das der aktuellen Anwendung und das der entfernten Anwendung. Die aktuelle Anwendung reagiert auf Ereignisse in den Abläufen lokaler Seiten, Schaltflächen und API-Anfragen. Nachdem die entfernte Anwendung eine weitergeleitete Anfrage erhalten hat, verarbeitet sie diese gemäß ihrer eigenen Workflow-Konfiguration.

Beachten Sie, dass die aktuelle Anwendung keine Ereignisse für das Erstellen, Aktualisieren oder Löschen überwacht, die innerhalb der entfernten Datentabellen auftreten. Ereignisse der entfernten Datentabellen werden nur in der entfernten Anwendung ausgelöst.

#### Trigger

Die folgende Tabelle beschreibt, wann Trigger, die von einer externen NocoBase-Datenquelle beeinflusst werden, in der aktuellen und der entfernten Anwendung ausgelöst werden, sofern der entsprechende Workflow aktiviert ist.

| Trigger              | Aktuelle Anwendung | Entfernte Anwendung | Beschreibung                                                                                 |
| -------------------- | ------------------ | ------------------- | -------------------------------------------------------------------------------------------- |
| Ereignis vor der Anfrage | Ausgelöst        | Nur im globalen Modus ausgelöst | In der aktuellen Anwendung im globalen Modus ausgelöst; im lokalen Modus durch die Bindung an eine Schaltfläche der aktuellen Anwendung. Nachdem die entfernte Anwendung die weitergeleitete Anfrage erhalten hat, wird der Trigger nur im globalen Modus ausgelöst |
| Ereignis nach der Anfrage | Ausgelöst       | Nur im globalen Modus ausgelöst | In der aktuellen Anwendung im globalen Modus ausgelöst; im lokalen Modus durch die Bindung an eine Schaltfläche der aktuellen Anwendung. Nachdem die entfernte Anwendung die weitergeleitete Anfrage erhalten hat, wird der Trigger nur im globalen Modus ausgelöst |
| Ereignis einer benutzerdefinierten Aktion | Ausgelöst | Nicht ausgelöst | Die in der aktuellen Anwendung gebundene Schaltfläche „Workflow auslösen“ startet den lokalen Ablauf; weitergeleitete CRUD-Anfragen lösen keine Ereignisse für benutzerdefinierte Aktionen in der entfernten Anwendung aus |
| Datentabellenereignis | Nicht ausgelöst | Ausgelöst | Die tatsächliche Datenänderung erfolgt in der entfernten Anwendung, daher löst die aktuelle Anwendung kein lokales Datentabellenereignis aus. Die entfernte Anwendung löst ihr eigenes Datentabellenereignis aus |
| Zeitgesteuerter Trigger für Datumsfelder | Nicht ausgelöst | Ausgelöst | Die aktuelle Anwendung löst keine Trigger auf Grundlage von Feldern der entfernten Datentabellen aus. Die entfernte Anwendung löst sie gemäß ihrer eigenen Konfiguration für Datumsfelder aus |

Trigger, die nicht von einer Datenquelle abhängen, werden in der aktuellen und der entfernten Anwendung jeweils gemäß der eigenen Konfiguration ausgelöst.

Wenn in der aktuellen Anwendung ein Ablauf für die Verarbeitung externer NocoBase-Daten erstellt werden soll, wird empfohlen, ein Ereignis vor der Anfrage, ein Ereignis nach der Anfrage oder ein Ereignis einer benutzerdefinierten Aktion zu verwenden. Bereits in der entfernten Anwendung vorhandene Workflows werden unabhängig von der entfernten Anwendung ausgeführt.

#### Knoten

Die folgende Tabelle enthält nur datenquellenbezogene Knoten. Allgemeine Knoten wie Bedingungen, Berechnungen, Schleifen und JSON-Verarbeitung hängen nicht vom Typ der Datenquelle ab und können wie in einem normalen Workflow verwendet werden.

| Knoten       | Verfügbar | Beschreibung                         |
| ------------ | --------- | ------------------------------------ |
| Datensätze abfragen | Verfügbar | Datensätze in der entfernten Anwendung abfragen |
| Datensätze erstellen | Verfügbar | Datensätze in der entfernten Anwendung erstellen |
| Datensätze aktualisieren | Verfügbar | Datensätze in der entfernten Anwendung aktualisieren |
| Datensätze löschen | Verfügbar | Datensätze in der entfernten Anwendung löschen |
| SQL-Knoten  | Nicht verfügbar | SQL-Knoten in Workflows unterstützen nur Datenbank-Datenquellen |
| Aggregationsknoten | Nicht verfügbar | Aggregationsknoten unterstützen nur Datenbank-Datenquellen |

## Häufig gestellte Fragen

### Datentabelle wird nicht angezeigt

Überprüfen Sie, ob die Datenquelle aktiviert ist und ob API-Adresse und API-Schlüssel korrekt sind. Außerdem muss die entfernte Anwendung dem API-Schlüssel den Zugriff auf die entsprechende Datentabelle erlauben.

### Datei wurde erfolgreich hochgeladen, kann aber nicht in der Vorschau angezeigt werden

Wenn die aktuelle oder die entfernte Anwendung lokalen Dateispeicher verwendet, überprüfen Sie, ob Origin als öffentlich zugängliche Adresse der entsprechenden Anwendung eingetragen ist. Origin darf nicht als API-Adresse eingetragen werden.

### In der aktuellen Anwendung sind Berechtigungen vorhanden, die Aktion schlägt jedoch fehl

Überprüfen Sie die Berechtigungen des API-Schlüssels der entfernten Anwendung. Eine externe NocoBase-Datenquelle wird sowohl von den Berechtigungen der aktuellen als auch von denen der entfernten Anwendung beeinflusst.

### Nach einem Fehler des entfernten Dienstes kann die Datentabelle nicht verwendet werden

Wenn in der entfernten Anwendung ein 502-Fehler, ein Neustart oder eine kurzzeitige Nichtverfügbarkeit auftritt, kann die aktuelle Anwendung die Metadaten der entfernten Datentabelle möglicherweise vorübergehend nicht lesen. Sobald der entfernte Dienst wieder verfügbar ist, lädt die aktuelle Anwendung die Metadaten beim nächsten Zugriff auf die Datentabelle dieser Datenquelle automatisch erneut.

### Warum können Felder nicht in der aktuellen Anwendung konfiguriert werden?

Eine externe NocoBase-Datenquelle verwendet die Struktur der Datentabellen und die Feldkonfiguration der entfernten Anwendung. Passen Sie die Felder in der entfernten Anwendung an und laden Sie anschließend die Datentabelle in der aktuellen Anwendung erneut.