---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# SQL-Sammlung

## Einführung

Die SQL-Sammlung bietet eine leistungsstarke Methode, um Daten mithilfe von SQL-Abfragen abzurufen. Indem Sie Datenfelder über SQL-Abfragen extrahieren und die zugehörigen Feld-Metadaten konfigurieren, können Benutzer diese Felder wie bei einer Standardtabelle verwenden. Diese Funktion ist besonders vorteilhaft für Szenarien mit komplexen Join-Abfragen, statistischen Analysen und vielem mehr.

## Benutzerhandbuch

### Eine neue SQL-Sammlung erstellen

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

1. Geben Sie Ihre SQL-Abfrage in das dafür vorgesehene Eingabefeld ein und klicken Sie auf Ausführen (Execute). Das System analysiert die Abfrage, um die beteiligten Tabellen und Felder zu ermitteln, und extrahiert automatisch die relevanten Feld-Metadaten aus den Quelltabellen.

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

2. Wenn die Analyse der Quelltabellen und Felder durch das System nicht korrekt ist, können Sie die entsprechenden Tabellen und Felder manuell auswählen, um die korrekten Metadaten zu verwenden. Wählen Sie zuerst die Quelltabelle aus und wählen Sie dann die entsprechenden Felder im Bereich „Feldquelle“ darunter aus.

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

3. Für Felder, die keine direkte Quelle haben, leitet das System den Feldtyp basierend auf dem Datentyp ab. Ist diese Ableitung falsch, können Sie den korrekten Feldtyp manuell auswählen.

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

4. Während Sie jedes Feld konfigurieren, können Sie dessen Anzeige im Vorschau-Bereich sehen, wodurch Sie die unmittelbaren Auswirkungen Ihrer Einstellungen überprüfen können.

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

5. Nachdem Sie die Konfiguration abgeschlossen und bestätigt haben, dass alles korrekt ist, klicken Sie auf die Schaltfläche Bestätigen (Confirm) unterhalb des SQL-Eingabefeldes, um die Übermittlung abzuschließen.

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Bearbeiten

1. Wenn Sie die SQL-Abfrage ändern müssen, klicken Sie auf die Schaltfläche Bearbeiten (Edit), um die SQL-Anweisung direkt zu ändern und die Felder bei Bedarf neu zu konfigurieren.

2. Um die Feld-Metadaten anzupassen, verwenden Sie die Option Felder konfigurieren (Configure fields), die es Ihnen ermöglicht, die Feldeinstellungen wie bei einer normalen Tabelle zu aktualisieren.

### Synchronisierung

Bleibt die SQL-Abfrage unverändert, aber die zugrunde liegende Datenbanktabellenstruktur wurde geändert, können Sie die Felder synchronisieren und neu konfigurieren, indem Sie Felder konfigurieren (Configure fields) - Aus Datenbank synchronisieren (Sync from database) auswählen.

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### SQL-Sammlung im Vergleich zu verknüpften Datenbankansichten

| Vorlagentyp | Am besten geeignet für | Implementierungsmethode | Unterstützung für CRUD-Operationen |
| :--- | :--- | :--- | :--- |
| SQL | Einfache Modelle, leichtgewichtige Anwendungsfälle<br />Begrenzte Interaktion mit der Datenbank<br />Vermeidung der Wartung von Ansichten<br />Bevorzugung von UI-gesteuerten Operationen | SQL-Unterabfrage | Nicht unterstützt |
| Verbindung zu Datenbankansicht | Komplexe Modelle<br />Erfordert Datenbankinteraktion<br />Datenänderung erforderlich<br />Erfordert stärkere und stabilere Datenbankunterstützung | Datenbankansicht | Teilweise unterstützt |

:::warning
Bei der Verwendung von SQL-Sammlungen stellen Sie sicher, dass Sie Tabellen auswählen, die innerhalb von NocoBase verwaltbar sind. Die Verwendung von Tabellen aus derselben Datenbank, die nicht mit NocoBase verbunden sind, kann zu einer ungenauen SQL-Abfrageanalyse führen. Sollte dies ein Problem darstellen, ziehen Sie in Betracht, eine Ansicht zu erstellen und diese zu verknüpfen.
:::