---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Nach-Aktions-Ereignis

## Einführung

Alle Datenänderungen, die Benutzer im System vornehmen, erfolgen typischerweise durch eine Aktion, meist in Form eines Klicks auf eine Schaltfläche. Diese Schaltfläche kann ein Absende-Button in einem Formular oder ein Aktions-Button in einem Datenblock sein. Nach-Aktions-Ereignisse werden verwendet, um diesen Schaltflächen-Aktionen entsprechende Workflows zuzuordnen. Dadurch wird ein spezifischer Prozess ausgelöst, nachdem die Benutzeraktion erfolgreich abgeschlossen wurde.

Wenn Sie beispielsweise Daten hinzufügen oder aktualisieren, können Sie über die Option „Workflow binden“ für eine Schaltfläche einen Workflow konfigurieren. Nach Abschluss der Aktion wird der gebundene Workflow ausgelöst.

Auf Implementierungsebene können auch HTTP-API-Aufrufe an NocoBase definierte Nach-Aktions-Ereignisse auslösen, da die Verarbeitung von Nach-Aktions-Ereignissen auf der Middleware-Ebene (Koa-Middleware) stattfindet.

## Installation

Dies ist ein integriertes Plugin, eine Installation ist nicht erforderlich.

## Trigger-Konfiguration

### Workflow erstellen

Wählen Sie beim Erstellen eines Workflows als Typ „Nach-Aktions-Ereignis“ aus:

![Workflow erstellen_Nach-Aktions-Ereignis-Trigger](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Ausführungsmodus

Für Nach-Aktions-Ereignisse können Sie beim Erstellen auch den Ausführungsmodus „Synchron“ oder „Asynchron“ wählen:

![Workflow erstellen_Synchron oder Asynchron auswählen](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Wenn der Prozess sofort nach der Benutzeraktion ausgeführt und zurückgegeben werden soll, verwenden Sie den synchronen Modus; andernfalls ist der asynchrone Modus die Standardeinstellung. Im asynchronen Modus ist die Aktion sofort abgeschlossen, nachdem der Workflow ausgelöst wurde, und der Workflow wird nacheinander im Hintergrund der Anwendung als Warteschlange ausgeführt.

### Sammlung konfigurieren

Betreten Sie den Workflow-Canvas, klicken Sie auf den Trigger, um das Konfigurations-Popup zu öffnen, und wählen Sie zuerst die zu bindende Sammlung aus:

![Workflow-Konfiguration_Sammlung auswählen](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Trigger-Modus auswählen

Wählen Sie dann den Trigger-Modus aus, es gibt zwei Optionen: lokalen Modus und globalen Modus.

![Workflow-Konfiguration_Trigger-Modus auswählen](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Dabei gilt:

*   Der lokale Modus wird nur auf Aktions-Schaltflächen ausgelöst, denen dieser Workflow zugewiesen ist. Das Klicken auf Schaltflächen, denen dieser Workflow nicht zugewiesen ist, löst ihn nicht aus. Sie können entscheiden, ob Sie diesen Workflow zuweisen möchten, basierend auf der Überlegung, ob Formulare mit unterschiedlichen Zwecken denselben Prozess auslösen sollen.
*   Der globale Modus wird auf allen konfigurierten Aktions-Schaltflächen der Sammlung ausgelöst, unabhängig davon, aus welchem Formular sie stammen, und es ist keine Zuweisung des entsprechenden Workflows erforderlich.

Im lokalen Modus werden derzeit folgende Aktions-Schaltflächen zur Zuweisung unterstützt:

*   Die Schaltflächen „Absenden“ und „Speichern“ in den Hinzufügen-Formularen.
*   Die Schaltflächen „Absenden“ und „Speichern“ in den Aktualisierungs-Formularen.
*   Die Schaltfläche „Daten aktualisieren“ in Datenzeilen (Tabelle, Liste, Kanban usw.).

### Aktionstyp auswählen

Wenn Sie den globalen Modus gewählt haben, müssen Sie auch den Aktionstyp auswählen. Derzeit werden „Daten erstellen“ und „Daten aktualisieren“ unterstützt. Beide Aktionen lösen den Workflow nach erfolgreichem Abschluss aus.

### Vorab geladene Beziehungsdaten auswählen

Wenn Sie die verknüpften Daten der Trigger-Daten in nachfolgenden Prozessen verwenden möchten, können Sie die Beziehungsfelder auswählen, die vorab geladen werden sollen:

![Workflow-Konfiguration_Beziehung vorab laden](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Nach dem Auslösen können Sie diese verknüpften Daten direkt im Prozess verwenden.

## Aktionskonfiguration

Für Aktionen im lokalen Trigger-Modus müssen Sie nach der Workflow-Konfiguration zur Benutzeroberfläche zurückkehren und den Workflow der Formular-Aktions-Schaltfläche des entsprechenden Datenblocks zuweisen.

Workflows, die für die Schaltfläche „Absenden“ (einschließlich der Schaltfläche „Daten speichern“) konfiguriert sind, werden ausgelöst, nachdem der Benutzer das entsprechende Formular abgesendet und die Datenaktion abgeschlossen hat.

![Nach-Aktions-Ereignis_Absende-Schaltfläche](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Wählen Sie im Menü der Schaltflächenkonfiguration „Workflow zuweisen“, um das Zuweisungs-Konfigurations-Popup zu öffnen. Im Popup können Sie beliebig viele Workflows konfigurieren, die ausgelöst werden sollen. Wenn keiner konfiguriert ist, bedeutet dies, dass kein Trigger erforderlich ist. Für jeden Workflow müssen Sie zuerst festlegen, ob die Trigger-Daten die Daten des gesamten Formulars oder die Daten eines bestimmten Beziehungsfeldes im Formular sind. Anschließend wählen Sie basierend auf der Sammlung, die dem ausgewählten Datenmodell entspricht, den Formular-Workflow aus, der für dieses Sammlungsmodell konfiguriert wurde.

![Nach-Aktions-Ereignis_Workflow-Zuweisungskonfiguration_Kontextauswahl](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Nach-Aktions-Ereignis_Workflow-Zuweisungskonfiguration_Workflow-Auswahl](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Hinweis"}
Der Workflow muss aktiviert sein, bevor er in der obigen Oberfläche ausgewählt werden kann.
:::

## Beispiel

Hier demonstrieren wir dies anhand einer Hinzufügen-Aktion.

Stellen Sie sich ein Szenario für einen „Spesenantrag“ vor. Nachdem ein Mitarbeiter eine Spesenabrechnung eingereicht hat, müssen wir eine automatische Prüfung des Betrags und eine manuelle Prüfung für Beträge durchführen, die das Limit überschreiten. Nur erfolgreich geprüfte Anträge werden genehmigt und anschließend zur Bearbeitung an die Finanzabteilung weitergeleitet.

Zuerst erstellen wir eine Sammlung „Spesenabrechnung“ mit den folgenden Feldern:

-   Projektname: Einzeiliger Text
-   Antragsteller: Viele-zu-Eins (Benutzer)
-   Betrag: Zahl
-   Status: Einzelauswahl („Genehmigt“, „Verarbeitet“)

Danach erstellen wir einen Workflow vom Typ „Nach-Aktions-Ereignis“ und konfigurieren das Sammlungsmodell im Trigger als Sammlung „Spesenabrechnung“:

![Beispiel_Trigger-Konfiguration_Sammlung auswählen](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Nachdem der Workflow aktiviert wurde, werden wir die spezifischen Verarbeitungsknoten des Prozesses später konfigurieren.

Anschließend erstellen wir auf der Oberfläche einen Tabellenblock für die Sammlung „Spesenabrechnung“, fügen der Symbolleiste eine Schaltfläche „Hinzufügen“ hinzu und konfigurieren die entsprechenden Formularfelder. In den Konfigurationsoptionen der Formular-Aktions-Schaltfläche „Absenden“ öffnen wir den Konfigurationsdialog „Workflow zuweisen“, wählen die gesamten Formulardaten als Kontext und unseren zuvor erstellten Workflow aus:

![Beispiel_Formular-Schaltflächenkonfiguration_Workflow zuweisen](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Nachdem die Formular-Konfiguration abgeschlossen ist, kehren wir zur Logik-Orchestrierung des Workflows zurück. Wenn der Betrag beispielsweise 500 Euro übersteigt, ist eine manuelle Prüfung durch einen Administrator erforderlich; andernfalls wird er direkt genehmigt. Erst nach erfolgreicher Prüfung wird ein Spesenabrechnungsdatensatz erstellt und anschließend von der Finanzabteilung weiterbearbeitet (ausgelassen).

![Beispiel_Verarbeitungsprozess](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Wenn wir die weitere Bearbeitung durch die Finanzabteilung außer Acht lassen, ist die Konfiguration des Spesenantragsprozesses nun abgeschlossen. Wenn ein Mitarbeiter einen Spesenantrag ausfüllt und absendet, wird der entsprechende Workflow ausgelöst. Beträgt der Spesenbetrag weniger als 500 Euro, wird automatisch ein Datensatz erstellt und die weitere Bearbeitung durch die Finanzabteilung abgewartet. Andernfalls wird der Antrag von einem Vorgesetzten geprüft, und nach Genehmigung wird ebenfalls ein Datensatz erstellt und an die Finanzabteilung übergeben.

Der Prozess in diesem Beispiel kann auch auf einer regulären Schaltfläche „Absenden“ konfiguriert werden. Sie können je nach spezifischem Geschäftsszenario entscheiden, ob zuerst ein Datensatz erstellt werden soll, bevor nachfolgende Prozesse ausgeführt werden.

## Externer Aufruf

Das Auslösen von Nach-Aktions-Ereignissen ist nicht auf Operationen der Benutzeroberfläche beschränkt, sondern kann auch über HTTP-API-Aufrufe erfolgen.

:::info{title="Hinweis"}
Beim Auslösen eines Nach-Aktions-Ereignisses über einen HTTP-API-Aufruf müssen Sie auch den Aktivierungsstatus des Workflows und die Übereinstimmung der Sammlungs-Konfiguration beachten, da der Aufruf sonst möglicherweise nicht erfolgreich ist oder ein Fehler auftritt.
:::

Für Workflows, die lokal an eine Aktions-Schaltfläche gebunden sind, können Sie diese wie folgt aufrufen (am Beispiel der Erstellen-Schaltfläche der `posts`-Sammlung):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Dabei ist der URL-Parameter `triggerWorkflows` der Schlüssel des Workflows, wobei mehrere Workflows durch Kommas getrennt werden. Dieser Schlüssel kann durch Bewegen der Maus über den Workflow-Namen oben im Workflow-Canvas abgerufen werden:

![Workflow_Schlüssel_Anzeigemethode](https://static-docs.nocobase.com/20240426135108.png)

Nach erfolgreichem Aufruf wird das Nach-Aktions-Ereignis der entsprechenden `posts`-Sammlung ausgelöst.

:::info{title="Hinweis"}
Da externe Aufrufe ebenfalls auf der Benutzeridentität basieren müssen, ist bei HTTP-API-Aufrufen, genau wie bei Anfragen, die von der normalen Oberfläche gesendet werden, die Angabe von Authentifizierungsinformationen erforderlich. Dazu gehören der `Authorization`-Anfrage-Header oder der `token`-Parameter (der beim Login erhaltene Token) sowie der `X-Role`-Anfrage-Header (der aktuelle Rollenname des Benutzers).
:::

Wenn Sie ein Ereignis für Eins-zu-Eins-Beziehungsdaten (Eins-zu-Viele wird derzeit nicht unterstützt) in dieser Aktion auslösen müssen, können Sie `!` im Parameter verwenden, um die Trigger-Daten des Beziehungsfeldes anzugeben:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Nach erfolgreichem Aufruf wird das Nach-Aktions-Ereignis der entsprechenden `categories`-Sammlung ausgelöst.

:::info{title="Hinweis"}
Wenn das Ereignis im globalen Modus konfiguriert ist, müssen Sie den URL-Parameter `triggerWorkflows` nicht verwenden, um den entsprechenden Workflow anzugeben. Ein direkter Aufruf der entsprechenden Sammlungsaktion löst das Ereignis aus.
:::

## Häufig gestellte Fragen

### Unterschied zum Vor-Aktions-Ereignis

*   **Vor-Aktions-Ereignis**: Wird ausgelöst, bevor eine Aktion (z. B. Hinzufügen, Aktualisieren usw.) ausgeführt wird. Vor der Ausführung der Aktion können die angeforderten Daten im Workflow validiert oder verarbeitet werden. Wenn der Workflow beendet wird (die Anfrage wird abgefangen), wird die Aktion (Hinzufügen, Aktualisieren usw.) nicht ausgeführt.
*   **Nach-Aktions-Ereignis**: Wird ausgelöst, nachdem eine Benutzeraktion erfolgreich war. Zu diesem Zeitpunkt wurden die Daten erfolgreich übermittelt und in der Datenbank gespeichert, und verwandte Prozesse können basierend auf dem erfolgreichen Ergebnis weiterverarbeitet werden.

Wie in der Abbildung unten gezeigt:

![Aktionsausführungsreihenfolge](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Unterschied zum Sammlungsereignis

Nach-Aktions-Ereignisse und Sammlungsereignisse ähneln sich darin, dass beides Prozesse sind, die nach Datenänderungen ausgelöst werden. Ihre Implementierungsebenen unterscheiden sich jedoch: Nach-Aktions-Ereignisse beziehen sich auf die API-Ebene, während Sammlungsereignisse auf Datenänderungen in der Sammlung abzielen.

Sammlungsereignisse liegen näher an der zugrunde liegenden Systemebene. In einigen Fällen kann eine Datenänderung, die durch ein Ereignis verursacht wird, ein anderes Ereignis auslösen und eine Kettenreaktion hervorrufen. Insbesondere wenn sich Daten in einigen verknüpften Sammlungen auch während des Betriebs der aktuellen Sammlung ändern, können auch Ereignisse ausgelöst werden, die mit der verknüpften Sammlung zusammenhängen.

Das Auslösen von Sammlungsereignissen enthält keine benutzerbezogenen Informationen. Nach-Aktions-Ereignisse hingegen sind näher am Benutzer und sind das Ergebnis von Benutzeraktionen. Der Kontext des Workflows enthält auch benutzerbezogene Informationen, wodurch sie sich gut für die Verarbeitung von Prozessen eignen, die mit Benutzeraktionen zusammenhängen. Im zukünftigen Design von NocoBase könnten weitere Nach-Aktions-Ereignisse zur Auslösung erweitert werden, daher **wird die Verwendung von Nach-Aktions-Ereignissen stärker empfohlen**, um Prozesse zu handhaben, bei denen Datenänderungen durch Benutzeraktionen verursacht werden.

Ein weiterer Unterschied besteht darin, dass Nach-Aktions-Ereignisse lokal an bestimmte Formular-Schaltflächen gebunden werden können. Wenn es mehrere Formulare gibt, können die Absendungen einiger Formulare das Ereignis auslösen, während andere es nicht tun. Sammlungsereignisse hingegen beziehen sich auf Datenänderungen in der gesamten Sammlung und können nicht lokal gebunden werden.