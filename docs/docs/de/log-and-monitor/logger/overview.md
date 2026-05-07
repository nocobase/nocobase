:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/log-and-monitor/logger/overview).
:::

# Server-Logs, Audit-Logs und Verlauf

## Server-Logs

### System-Logs

> Siehe [System-Logs](./index.md#system-logs)

- Erfassen von Laufzeitinformationen des Anwendungssystems, Verfolgen von Code-Ausführungsketten und Rückverfolgen von Ausnahmen oder Laufzeitfehlern.
- Protokolle sind nach Schweregraden und Funktionsmodulen kategorisiert.
- Ausgabe über das Terminal oder Speicherung in Form von Dateien.
- Hauptsächlich zur Diagnose und Fehlerbehebung von Systemfehlern während des Betriebs verwendet.

### Anfrage-Logs

> Siehe [Anfrage-Logs](./index.md#request-logs)

- Erfassen von HTTP-API-Anfrage- und Antwortdetails, mit Fokus auf Anfrage-ID, API-Pfad, Header, Antwortstatuscode und Dauer.
- Ausgabe über das Terminal oder Speicherung in Form von Dateien.
- Hauptsächlich zur Verfolgung von API-Aufrufen und der Ausführungsleistung verwendet.

## Audit-Logs

> Siehe [Audit-Logs](/security/audit-logger/index.md)

- Erfassen von Benutzer- (oder API-) Aktionen auf Systemressourcen, mit Fokus auf Ressourcentyp, Zielobjekt, Operationstyp, Benutzerinformationen und Operationsstatus.
- Um die spezifischen Inhalte und Ergebnisse von Benutzeraktionen besser verfolgen zu können, werden Anfrageparameter und Antworten als Metadaten gespeichert. Dieser Teil der Informationen überschneidet sich teilweise mit den Anfrage-Logs, ist jedoch nicht identisch – zum Beispiel werden in den aktuellen Anfrage-Logs normalerweise keine vollständigen Anfrage-Bodys aufgezeichnet.
- Anfrageparameter und Antworten sind **nicht gleichbedeutend** mit Datenschnappschüssen. Sie lassen zwar durch Parameter und Codelogik erkennen, welche Änderungen vorgenommen wurden, ermöglichen es jedoch nicht, den genauen Zustand eines Datensatzes vor der Änderung zu kennen, um eine Versionskontrolle oder eine Datenwiederherstellung nach Fehlbedienungen durchzuführen.
- Speicherung sowohl in Form von Dateien als auch in Datenbanktabellen.

![](https://static-docs.nocobase.com/202501031627922.png)

## Verlauf

> Siehe [Verlauf](/record-history/index.md)

- Erfasst die **Änderungshistorie** von Dateninhalten.
- Die aufgezeichneten Inhalte umfassen hauptsächlich Ressourcentyp, Ressourcenobjekt, Operationstyp, geänderte Felder sowie Vorher- und Nachher-Werte.
- Kann für den Datenvergleich verwendet werden.
- Speicherung in Form von Datenbanktabellen.

![](https://static-docs.nocobase.com/202511011338499.png)