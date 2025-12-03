:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Server-Logs, Audit-Logs und Änderungsverlauf

## Server-Logs

### System-Logs

> Siehe [System-Logs](#)

- Erfassen Laufzeitinformationen des Anwendungssystems, verfolgen die Ausführungspfade des Codes und identifizieren Ausnahmen oder Laufzeitfehler.
- Die Logs sind nach Schweregraden und Funktionsmodulen kategorisiert.
- Die Ausgabe erfolgt über das Terminal oder die Speicherung in Dateien.
- Sie dienen hauptsächlich der Diagnose und Behebung von Systemfehlern während des Betriebs.

### Request-Logs

> Siehe [Request-Logs](#)

- Erfassen Details zu HTTP-API-Anfragen und -Antworten, wobei der Schwerpunkt auf der Erfassung von Anfrage-ID, API-Pfad, Headern, Antwortstatuscode und Dauer liegt.
- Die Ausgabe erfolgt über das Terminal oder die Speicherung in Dateien.
- Sie dienen hauptsächlich dazu, API-Aufrufe und deren Ausführungsleistung zu verfolgen.

## Audit-Logs

> Siehe [Audit-Logs](../security/audit-logger/index.md)

- Erfassen die Aktionen von Benutzern (oder APIs) auf Systemressourcen, wobei der Fokus auf Ressourcentyp, Zielobjekt, Operationstyp, Benutzerinformationen und Operationsstatus liegt.
- Um die genauen Inhalte und Ergebnisse von Benutzeraktionen besser nachvollziehen zu können, werden Anfrageparameter und -antworten als Metadaten gespeichert. Diese Informationen überschneiden sich teilweise mit den Request-Logs, sind aber nicht vollständig identisch – so enthalten Request-Logs beispielsweise in der Regel keine vollständigen Anfragetexte (Request Bodies).
- Anfrageparameter und -antworten sind **nicht gleichbedeutend** mit Daten-Snapshots. Sie können zwar Aufschluss darüber geben, welche Art von Operationen stattgefunden hat, aber nicht die genauen Daten vor der Änderung. Daher können sie nicht für die Versionskontrolle oder die Wiederherstellung von Daten nach Fehlbedienungen verwendet werden.
- Speicherung erfolgt sowohl in Dateien als auch in Datenbanktabellen.

![](https://static-docs.nocobase.com/202501031627922.png)

## Änderungsverlauf

> Siehe [Änderungsverlauf](/record-history/index.md)

- Erfasst den **Änderungsverlauf** von Dateninhalten.
- Die Hauptinhalte sind Ressourcentyp, Ressourcenobjekt, Operationstyp, geänderte Felder sowie die Werte vor und nach der Änderung.
- Nützlich für den **Datenvergleich und die Überprüfung (Auditing)**.
- Speicherung erfolgt in Datenbanktabellen.

![](https://static-docs.nocobase.com/202511011338499.png)