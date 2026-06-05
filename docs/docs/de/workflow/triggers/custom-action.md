---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Benutzerdefiniertes Aktionsereignis

## Einführung

NocoBase bietet integrierte, gängige Datenaktionen (Hinzufügen, Löschen, Aktualisieren, Anzeigen usw.). Wenn diese Aktionen jedoch komplexe Geschäftsanforderungen nicht erfüllen können, haben Sie die Möglichkeit, benutzerdefinierte Aktionsereignisse in einem Workflow zu nutzen. Indem Sie ein solches Ereignis an einen „Workflow auslösen“-Button in einem Seitenblock binden, wird bei einem Klick des Benutzers ein Workflow für eine benutzerdefinierte Aktion gestartet.

## Einen Workflow erstellen

Wenn Sie einen Workflow erstellen, wählen Sie „Benutzerdefiniertes Aktionsereignis“ aus:

![Workflow „Benutzerdefiniertes Aktionsereignis“ erstellen](https://static-docs.nocobase.com/20240509091820.png)

## Trigger-Konfiguration

### Kontexttyp

> v.1.6.0+

Der Kontexttyp legt fest, an welche Buttons in den Blöcken der Workflow gebunden werden kann:

*   Kein Kontext: Ein globales Ereignis, das an Aktions-Buttons in der Aktionsleiste und in Datenblöcken gebunden werden kann.
*   Einzelner Datensatz: Kann an Aktions-Buttons in Datenblöcken wie Tabellenzeilen, Formularen und Detailansichten gebunden werden.
*   Mehrere Datensätze: Kann an Buttons für Massenaktionen in einer Tabelle gebunden werden.

![Trigger-Konfiguration_Kontexttyp](https://static-docs.nocobase.com/20250215135808.png)

### Sammlung

Wenn der Kontexttyp „Einzelner Datensatz“ oder „Mehrere Datensätze“ ist, müssen Sie die Sammlung auswählen, an die das Datenmodell gebunden werden soll:

![Trigger-Konfiguration_Sammlung auswählen](https://static-docs.nocobase.com/20250215135919.png)

### Zu verwendende Verknüpfungsdaten

Wenn Sie die Verknüpfungsdaten der auslösenden Datenzeile im Workflow verwenden möchten, können Sie hier tiefere Verknüpfungsfelder auswählen:

![Trigger-Konfiguration_Zu verwendende Verknüpfungsdaten auswählen](https://static-docs.nocobase.com/20250215135955.png)

Diese Felder werden nach dem Auslösen des Ereignisses automatisch in den Workflow-Kontext vorgeladen, sodass Sie sie im Workflow verwenden können.

## Aktionskonfiguration

Die Konfiguration der Aktions-Buttons in verschiedenen Blöcken unterscheidet sich je nach dem im Workflow konfigurierten Kontexttyp.

### Kein Kontext

> v.1.6.0+

In der Aktionsleiste und anderen Datenblöcken können Sie jeweils einen „Workflow auslösen“-Button hinzufügen:

![Aktions-Button zum Block hinzufügen_Aktionsleiste](https://static-docs.nocobase.com/20250215221738.png)

![Aktions-Button zum Block hinzufügen_Kalender](https://static-docs.nocobase.com/20250215221942.png)

![Aktions-Button zum Block hinzufügen_Gantt-Diagramm](https://static-docs.nocobase.com/20250215221810.png)

Nachdem Sie den Button hinzugefügt haben, binden Sie den zuvor erstellten Workflow ohne Kontext. Hier ein Beispiel mit einem Button in der Aktionsleiste:

![Workflow an Button binden_Aktionsleiste](https://static-docs.nocobase.com/20250215222120.png)

![Zu bindenden Workflow auswählen_Kein Kontext](https://static-docs.nocobase.com/20250215222234.png)

### Einzelner Datensatz

In jedem Datenblock kann ein „Workflow auslösen“-Button zur Aktionsleiste für einen einzelnen Datensatz hinzugefügt werden, beispielsweise in Formularen, Tabellenzeilen oder Detailansichten:

![Aktions-Button zum Block hinzufügen_Formular](https://static-docs.nocobase.com/20240509165428.png)

![Aktions-Button zum Block hinzufügen_Tabellenzeile](https://static-docs.nocobase.com/20240509165340.png)

![Aktions-Button zum Block hinzufügen_Details](https://static-docs.nocobase.com/20240509165545.png)

Nachdem Sie den Button hinzugefügt haben, binden Sie den zuvor erstellten Workflow:

![Workflow an Button binden](https://static-docs.nocobase.com/20240509165631.png)

![Zu bindenden Workflow auswählen](https://static-docs.nocobase.com/20240509165658.png)

Anschließend löst ein Klick auf diesen Button das benutzerdefinierte Aktionsereignis aus:

![Ergebnis des Button-Klicks](https://static-docs.nocobase.com/20240509170453.png)

### Mehrere Datensätze

> v.1.6.0+

Wenn Sie in der Aktionsleiste eines Tabellenblocks einen „Workflow auslösen“-Button hinzufügen, gibt es eine zusätzliche Option zur Auswahl des Kontexttyps: „Kein Kontext“ oder „Mehrere Datensätze“:

![Aktions-Button zum Block hinzufügen_Tabelle](https://static-docs.nocobase.com/20250215222507.png)

Wenn „Kein Kontext“ ausgewählt ist, handelt es sich um ein globales Ereignis, das nur an Workflows ohne Kontext gebunden werden kann.

Wenn „Mehrere Datensätze“ ausgewählt ist, können Sie einen Workflow für mehrere Datensätze binden, der für Massenaktionen nach der Auswahl mehrerer Datensätze verwendet werden kann (derzeit nur von Tabellen unterstützt). Die Auswahl der verfügbaren Workflows ist dann auf jene beschränkt, die für die passende Sammlung des aktuellen Datenblocks konfiguriert sind:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Beim Klicken des Buttons zur Auslösung müssen zuvor einige Datenzeilen in der Tabelle ausgewählt worden sein; andernfalls wird der Workflow nicht ausgelöst:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Beispiel

Nehmen wir an, Sie haben eine Sammlung namens „Proben“. Für Proben mit dem Status „Gesammelt“ soll eine Aktion „Zur Prüfung einreichen“ angeboten werden. Diese Aktion würde zunächst die grundlegenden Informationen der Probe überprüfen, dann einen „Prüfbericht“ erstellen und schließlich den Status der Probe auf „Eingereicht“ ändern. Da diese Abfolge von Schritten nicht durch einfache „Hinzufügen-, Löschen-, Aktualisieren-, Anzeigen“-Buttons abgedeckt werden kann, lässt sich dies mithilfe eines benutzerdefinierten Aktionsereignisses umsetzen.

Erstellen Sie zunächst eine Sammlung „Proben“ und eine Sammlung „Prüfberichte“ und geben Sie grundlegende Testdaten in die Probensammlung ein:

![Beispiel_Probensammlung](https://static-docs.nocobase.com/20240509172234.png)

Erstellen Sie anschließend einen Workflow für ein „Benutzerdefiniertes Aktionsereignis“. Wenn Sie eine zeitnahe Rückmeldung vom Prozess benötigen, können Sie den synchronen Modus wählen (im synchronen Modus können keine asynchronen Knoten wie manuelle Bearbeitung verwendet werden):

![Beispiel_Workflow erstellen](https://static-docs.nocobase.com/20240509173106.png)

Wählen Sie in der Trigger-Konfiguration die Sammlung „Proben“ aus:

![Beispiel_Trigger-Konfiguration](https://static-docs.nocobase.com/20240509173148.png)

Ordnen Sie die Logik im Prozess gemäß den Geschäftsanforderungen an. Beispielsweise soll die Einreichung zur Prüfung nur erlaubt sein, wenn der Indikatorparameter größer als `90` ist; andernfalls wird eine entsprechende Meldung angezeigt:

![Beispiel_Geschäftslogik-Anordnung](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Tipp}
Der Knoten „[Antwortnachricht](../nodes/response-message.md)“ kann in synchronen benutzerdefinierten Aktionsereignissen verwendet werden, um eine Hinweismeldung an den Client zurückzugeben. Im asynchronen Modus ist er nicht verfügbar.
:::

Nachdem Sie den Workflow konfiguriert und aktiviert haben, kehren Sie zur Tabellenoberfläche zurück und fügen Sie in der Aktionsspalte der Tabelle einen „Workflow auslösen“-Button hinzu:

![Beispiel_Aktions-Button hinzufügen](https://static-docs.nocobase.com/20240509174525.png)

Wählen Sie anschließend im Konfigurationsmenü des Buttons die Option „Workflow binden“ und öffnen Sie das Konfigurationsfenster:

![Beispiel_Bindungs-Workflow-Fenster öffnen](https://static-docs.nocobase.com/20240509174633.png)

Fügen Sie den zuvor aktivierten Workflow hinzu:

![Beispiel_Workflow auswählen](https://static-docs.nocobase.com/20240509174723.png)

Nach dem Absenden ändern Sie den Button-Text in den Aktionsnamen, zum Beispiel „Zur Prüfung einreichen“. Damit ist der Konfigurationsprozess abgeschlossen.

Um die Funktion zu nutzen, wählen Sie beliebige Probendaten in der Tabelle aus und klicken Sie auf den Button „Zur Prüfung einreichen“, um das benutzerdefinierte Aktionsereignis auszulösen. Entsprechend der zuvor festgelegten Logik wird, wenn der Indikatorparameter der Probe kleiner als 90 ist, nach dem Klick die folgende Meldung angezeigt:

![Beispiel_Indikator erfüllt Kriterien nicht](https://static-docs.nocobase.com/20240509175026.png)

Ist der Indikatorparameter größer als 90, wird der Prozess normal ausgeführt, ein „Prüfbericht“ erstellt und der Status der Probe auf „Eingereicht“ geändert:

![Beispiel_Einreichung erfolgreich](https://static-docs.nocobase.com/20240509175247.png)

Damit ist ein einfaches benutzerdefiniertes Aktionsereignis abgeschlossen. Ähnlich können auch komplexe Geschäftsabläufe wie die Auftragsbearbeitung oder das Einreichen von Berichten mithilfe benutzerdefinierter Aktionsereignisse umgesetzt werden.

## Externer Aufruf

Das Auslösen von benutzerdefinierten Aktionsereignissen ist nicht nur auf Aktionen in der Benutzeroberfläche beschränkt, sondern kann auch über HTTP-API-Aufrufe erfolgen. Insbesondere bieten benutzerdefinierte Aktionsereignisse für alle Sammlungsaktionen einen neuen Aktionstyp zum Auslösen von Workflows: `trigger`. Dieser kann über die Standard-Aktions-API von NocoBase aufgerufen werden.

Ein Workflow, der wie im Beispiel durch einen Button ausgelöst wird, kann wie folgt aufgerufen werden:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Da diese Aktion für einen einzelnen Datensatz gedacht ist, müssen Sie beim Aufruf für vorhandene Daten die ID der Datenzeile angeben und den `<:id>`-Teil in der URL ersetzen.

Wenn der Aufruf für ein Formular erfolgt (z. B. zum Erstellen oder Aktualisieren), können Sie die ID für ein Formular, das neue Daten erstellt, weglassen. Sie müssen jedoch die übermittelten Daten als Ausführungskontext übergeben:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Für ein Aktualisierungsformular müssen Sie sowohl die ID der Datenzeile als auch die aktualisierten Daten übergeben:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Wenn sowohl eine ID als auch Daten übergeben werden, wird zuerst die der ID entsprechende Datenzeile geladen. Anschließend werden die Eigenschaften aus dem übergebenen Datenobjekt verwendet, um die ursprüngliche Datenzeile zu überschreiben und so den endgültigen Trigger-Datenkontext zu erhalten.

:::warning{title="Hinweis"}
Wenn Verknüpfungsdaten übergeben werden, werden diese ebenfalls überschrieben. Seien Sie besonders vorsichtig beim Umgang mit eingehenden Daten, wenn das Vorladen von Verknüpfungsdatenelementen konfiguriert ist, um unerwartete Überschreibungen von Verknüpfungsdaten zu vermeiden.
:::

Zusätzlich ist der URL-Parameter `triggerWorkflows` der Key des Workflows; mehrere Workflow-Keys werden durch Kommas getrennt. Diesen Key erhalten Sie, indem Sie den Mauszeiger über den Workflow-Namen oben auf der Workflow-Leinwand bewegen:

![Workflow_Key_Anzeigemethode](https://static-docs.nocobase.com/20240426135108.png)

Nach einem erfolgreichen Aufruf wird das benutzerdefinierte Aktionsereignis für die entsprechende Sammlung `samples` ausgelöst.

:::info{title="Tipp"}
Da externe Aufrufe ebenfalls auf der Benutzeridentität basieren müssen, ist es bei HTTP-API-Aufrufen, genau wie bei Anfragen, die über die normale Benutzeroberfläche gesendet werden, erforderlich, Authentifizierungsinformationen bereitzustellen. Dazu gehören der `Authorization`-Request-Header oder der `token`-Parameter (der beim Login erhaltene Token) sowie der `X-Role`-Request-Header (der aktuelle Rollenname des Benutzers).
:::

Wenn Sie ein Ereignis für eine 1:1-Verknüpfungsdaten (1:n wird derzeit nicht unterstützt) in dieser Aktion auslösen möchten, können Sie im Parameter `!` verwenden, um die Trigger-Daten des Verknüpfungsfeldes anzugeben:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Nach einem erfolgreichen Aufruf wird das benutzerdefinierte Aktionsereignis für die entsprechende Sammlung `categories` ausgelöst.

:::info{title="Tipp"}
Beim Auslösen eines Aktionsereignisses über einen HTTP-API-Aufruf müssen Sie auch auf den Aktivierungsstatus des Workflows und die Übereinstimmung der Sammlungs-Konfiguration achten; andernfalls kann der Aufruf fehlschlagen oder zu einem Fehler führen.
:::