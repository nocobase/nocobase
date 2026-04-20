---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/workflow/triggers/custom-action).
:::

# Benutzerdefiniertes Aktionsereignis

## Einführung

NocoBase verfügt über integrierte gängige Datenoperationen (Hinzufügen, Löschen, Ändern, Abfragen usw.). Wenn diese Operationen komplexe Geschäftsanforderungen nicht erfüllen können, können Sie benutzerdefinierte Aktionsereignisse in einem Workflow verwenden und dieses Ereignis an die Schaltfläche „Workflow auslösen“ eines Seitenblocks binden. Wenn ein Benutzer darauf klickt, wird ein Workflow für eine benutzerdefinierte Aktion ausgelöst.

## Einen Workflow erstellen

Wählen Sie beim Erstellen eines Workflows „Benutzerdefiniertes Aktionsereignis“:

![Workflow „Benutzerdefiniertes Aktionsereignis“ erstellen](https://static-docs.nocobase.com/20240509091820.png)

## Trigger-Konfiguration

### Kontexttyp

> v.1.6.0+

Unterschiedliche Kontexttypen bestimmen, an welche Schaltflächen von Blöcken dieser Workflow gebunden werden kann:

*   Kein Kontext: Ein globales Ereignis, das an Aktionsschaltflächen im Aktionspanel oder in Datenblöcken gebunden werden kann;
*   Einzelner Datensatz: Kann an Aktionsschaltflächen in Datenblöcken wie Tabellenzeilen, Formularen, Details usw. gebunden werden;
*   Mehrere Datensätze: Kann an Schaltflächen für Massenoperationen in Tabellen gebunden werden.

![Trigger-Konfiguration_Kontexttyp](https://static-docs.nocobase.com/20250215135808.png)

### Sammlung

Wenn der Kontexttyp „Einzelner Datensatz“ oder „Mehrere Datensätze“ ist, müssen Sie die Sammlung auswählen, an die das Datenmodell gebunden werden soll:

![Trigger-Konfiguration_Sammlung auswählen](https://static-docs.nocobase.com/20250215135919.png)

### Zu verwendende Verknüpfungsdaten

Wenn Sie Verknüpfungsdaten der auslösenden Datenzeile im Workflow verwenden müssen, können Sie hier tiefe Verknüpfungsfelder auswählen:

![Trigger-Konfiguration_Zu verwendende Verknüpfungsdaten auswählen](https://static-docs.nocobase.com/20250215135955.png)

Diese Felder werden nach dem Auslösen des Ereignisses automatisch in den Kontext des Workflows vorgeladen, um sie im Workflow zu verwenden.

## Aktionskonfiguration

Je nach konfiguriertem Kontexttyp des Workflows unterscheidet sich die Konfiguration der Aktionsschaltflächen in verschiedenen Blöcken.

### Kein Kontext

> v1.6.0+

Im Aktionspanel und in anderen Datenblöcken kann jeweils die Schaltfläche „Workflow auslösen“ hinzugefügt werden:

![Aktions-Button zum Block hinzufügen_Aktionsleiste](https://static-docs.nocobase.com/20250215221738.png)

![Aktions-Button zum Block hinzufügen_Kalender](https://static-docs.nocobase.com/20250215221942.png)

![Aktions-Button zum Block hinzufügen_Gantt-Diagramm](https://static-docs.nocobase.com/20250215221810.png)

Binden Sie nach dem Hinzufügen der Schaltfläche den zuvor erstellten Workflow ohne Kontext, am Beispiel einer Schaltfläche im Aktionspanel:

![Workflow an Button binden_Aktionsleiste](https://static-docs.nocobase.com/20250215222120.png)

![Zu bindenden Workflow auswählen_Kein Kontext](https://static-docs.nocobase.com/20250215222234.png)

### Einzelner Datensatz

In jedem Datenblock kann in der Aktionsleiste für einzelne Datensätze die Schaltfläche „Workflow auslösen“ hinzugefügt werden, z. B. in Formularen, Tabellenzeilen, Details usw.:

![Aktions-Button zum Block hinzufügen_Formular](https://static-docs.nocobase.com/20240509165428.png)

![Aktions-Button zum Block hinzufügen_Tabellenzeile](https://static-docs.nocobase.com/20240509165340.png)

![Aktions-Button zum Block hinzufügen_Details](https://static-docs.nocobase.com/20240509165545.png)

Binden Sie nach dem Hinzufügen der Schaltfläche den zuvor erstellten Workflow:

![Workflow an Button binden](https://static-docs.nocobase.com/20240509165631.png)

![Zu bindenden Workflow auswählen](https://static-docs.nocobase.com/20240509165658.png)

Klicken Sie anschließend auf diese Schaltfläche, um das benutzerdefinierte Aktionsereignis auszulösen:

![Ergebnis des Button-Klicks](https://static-docs.nocobase.com/20240509170453.png)

### Mehrere Datensätze

> v1.6.0+

In der Aktionsleiste eines Tabellenblocks gibt es beim Hinzufügen der Schaltfläche „Workflow auslösen“ eine zusätzliche Option zur Auswahl des Kontexttyps „Kein Kontext“ oder „Mehrere Datensätze“:

![Aktions-Button zum Block hinzufügen_Tabelle](https://static-docs.nocobase.com/20250215222507.png)

Wenn „Kein Kontext“ gewählt wird, handelt es sich um ein globales Ereignis, das nur an Workflows vom Typ „Kein Kontext“ gebunden werden kann.

Wenn „Mehrere Datensätze“ gewählt wird, kann ein Workflow vom Typ „Mehrere Datensätze“ gebunden werden, der für Massenoperationen nach der Auswahl mehrerer Daten verwendet werden kann (derzeit nur von Tabellen unterstützt). Der Bereich der wählbaren Workflows beschränkt sich hierbei auf Workflows, die passend zur Sammlung des aktuellen Datenblocks konfiguriert wurden:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Beim Auslösen durch Klicken auf die Schaltfläche müssen bereits einige Datenzeilen in der Tabelle markiert sein, andernfalls wird der Workflow nicht ausgelöst:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Beispiel

Angenommen, wir haben eine Sammlung „Proben“. Für Proben mit dem Status „Gesammelt“ soll eine Aktion „Zur Prüfung einreichen“ bereitgestellt werden. Diese Aktion prüft zuerst die Basisinformationen der Probe, erstellt dann einen Datensatz „Prüfprotokoll“ und ändert den Probenstatus auf „Eingereicht“. Diese Abfolge von Prozessen kann nicht durch einfaches Klicken auf Schaltflächen für „Hinzufügen, Löschen, Ändern, Abfragen“ abgeschlossen werden. In diesem Fall können benutzerdefinierte Aktionsereignisse verwendet werden.

Erstellen Sie zuerst eine Sammlung „Proben“ und eine Sammlung „Prüfprotokolle“ und geben Sie Basis-Testdaten für die Proben-Tabelle ein:

![Beispiel_Probensammlung](https://static-docs.nocobase.com/20240509172234.png)

Erstellen Sie dann einen Workflow für ein „Benutzerdefiniertes Aktionsereignis“. Wenn Sie eine zeitnahe Rückmeldung des Operationsprozesses benötigen, können Sie den synchronen Modus wählen (im synchronen Modus können keine asynchronen Knoten wie manuelle Bearbeitung verwendet werden):

![Beispiel_Workflow erstellen](https://static-docs.nocobase.com/20240509173106.png)

Wählen Sie in der Trigger-Konfiguration als Sammlung „Proben“:

![Beispiel_Trigger-Konfiguration](https://static-docs.nocobase.com/20240509173148.png)

Ordnen Sie die Logik im Prozess gemäß den Geschäftsanforderungen an, z. B. ist die Einreichung zur Prüfung nur erlaubt, wenn der Indikatorparameter größer als `90` ist, andernfalls wird ein entsprechender Hinweis angezeigt:

![Beispiel_Geschäftslogik-Anordnung](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Hinweis}
Der Knoten „[Antwortnachricht](../nodes/response-message.md)“ kann in synchronen benutzerdefinierten Aktionsereignissen verwendet werden, um dem Client eine Hinweismeldung zurückzugeben. Im asynchronen Modus kann er nicht verwendet werden.
:::

Nachdem der Prozess konfiguriert und aktiviert wurde, kehren Sie zur Tabellenoberfläche zurück und fügen Sie in der Aktionsspalte der Tabelle die Schaltfläche „Workflow auslösen“ hinzu:

![Beispiel_Aktions-Button hinzufügen](https://static-docs.nocobase.com/20240509174525.png)

Wählen Sie dann im Konfigurationsmenü der Schaltfläche die Bindung des Workflows aus und öffnen Sie das Konfigurations-Popup:

![Beispiel_Bindungs-Workflow-Fenster öffnen](https://static-docs.nocobase.com/20240509174633.png)

Fügen Sie den zuvor aktivierten Workflow hinzu:

![Beispiel_Workflow auswählen](https://static-docs.nocobase.com/20240509174723.png)

Ändern Sie nach dem Absenden den Schaltflächentext in den Namen der Aktion, z. B. „Zur Prüfung einreichen“. Damit ist die Konfiguration abgeschlossen.

Wählen Sie bei der Verwendung einen beliebigen Datensatz in der Tabelle aus und klicken Sie auf die Schaltfläche „Zur Prüfung einreichen“, um das benutzerdefinierte Aktionsereignis auszulösen. Gemäß der zuvor erstellten Logik wird, wenn der Indikatorparameter der Probe kleiner als 90 ist, nach dem Klicken folgender Hinweis angezeigt:

![Beispiel_Indikator erfüllt Kriterien nicht](https://static-docs.nocobase.com/20240509175026.png)

Wenn der Indikatorparameter größer als 90 ist, wird der Prozess normal ausgeführt, ein Datensatz „Prüfprotokoll“ erstellt und der Probenstatus auf „Eingereicht“ geändert:

![Beispiel_Einreichung erfolgreich](https://static-docs.nocobase.com/20240509175247.png)

Damit ist ein einfaches benutzerdefiniertes Aktionsereignis abgeschlossen. Ebenso können komplexe Operationen wie die Auftragsbearbeitung oder das Einreichen von Berichten über benutzerdefinierte Aktionsereignisse realisiert werden.

## Externer Aufruf

Das Auslösen von benutzerdefinierten Aktionsereignissen ist nicht auf Operationen in der Benutzeroberfläche beschränkt, sondern kann auch über HTTP-API-Aufrufe erfolgen. Insbesondere bieten benutzerdefinierte Aktionsereignisse für alle Sammlungsoperationen einen neuen Aktionstyp zum Auslösen von Workflows: `trigger`, welcher über die Standard-Aktions-API von NocoBase aufgerufen werden kann.

:::info{title="Hinweis"}
Da externe Aufrufe ebenfalls auf der Benutzeridentität basieren, müssen bei Aufrufen über die HTTP-API dieselben Authentifizierungsinformationen wie bei Anfragen über die normale Benutzeroberfläche bereitgestellt werden. Dies umfasst den `Authorization`-Header oder den `token`-Parameter (beim Login erhaltener Token) sowie den `X-Role`-Header (aktueller Rollenname des Benutzers).
:::

### Kein Kontext

Workflows ohne Kontext müssen für die Ressource `workflows` ausgelöst werden:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Einzelner Datensatz

Ein Workflow, der wie im Beispiel durch eine Schaltfläche ausgelöst wird, kann so aufgerufen werden:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Da diese Operation für einen einzelnen Datensatz gilt, muss beim Aufruf für vorhandene Daten die ID der Datenzeile angegeben werden, indem der Teil `<:id>` in der URL ersetzt wird.

Wenn der Aufruf für ein Formular erfolgt (z. B. Hinzufügen oder Aktualisieren), muss für das Formular zum Hinzufügen neuer Daten keine ID übergeben werden, aber die übermittelten Daten müssen als Kontext für die Ausführung übergeben werden:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Für ein Aktualisierungsformular müssen sowohl die ID der Datenzeile als auch die aktualisierten Daten übergeben werden:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Wenn sowohl ID als auch Daten übergeben werden, wird zuerst die der ID entsprechende Datenzeile geladen und dann mit den Attributen aus dem übergebenen Datenobjekt überschrieben, um den endgültigen Trigger-Datenkontext zu erhalten.

:::warning{title="Achtung"}
Wenn Verknüpfungsdaten übergeben werden, werden diese ebenfalls überschrieben. Seien Sie besonders vorsichtig beim Umgang mit übergebenen Daten, wenn das Vorladen von Verknüpfungsdaten konfiguriert ist, um zu verhindern, dass Verknüpfungsdaten unerwartet überschrieben werden.
:::

Zusätzlich ist der URL-Parameter `triggerWorkflows` der Key des Workflows. Mehrere Workflows werden durch Kommas getrennt. Dieser Key kann durch Bewegen der Maus über den Workflow-Namen oben im Workflow-Canvas ermittelt werden:

![Workflow_Key_Anzeigemethode](https://static-docs.nocobase.com/20240426135108.png)

Nach erfolgreichem Aufruf wird das benutzerdefinierte Aktionsereignis der entsprechenden Tabelle `samples` ausgelöst.

:::info{title="Hinweis"}
Beim Auslösen von Ereignissen nach einer Operation über die HTTP-API müssen Sie auch den Aktivierungsstatus des Workflows und die Übereinstimmung der Sammlungs-Konfiguration beachten, andernfalls ist der Aufruf möglicherweise nicht erfolgreich oder es treten Fehler auf.
:::

### Mehrere Datensätze

Ähnlich wie beim Aufruf für einzelne Datensätze, aber die übergebenen Daten benötigen nur mehrere Primärschlüssel-Parameter (`filterByTk[]`), und der `data`-Teil ist nicht erforderlich:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Dieser Aufruf löst das benutzerdefinierte Aktionsereignis im Modus für mehrere Datensätze aus und verwendet die Daten mit den IDs 1 und 2 als Daten im Trigger-Kontext.