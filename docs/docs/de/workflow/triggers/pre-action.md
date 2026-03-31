---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Ereignis vor der Aktion

## Einführung

Das Plugin „Ereignis vor der Aktion“ bietet einen Interzeptionsmechanismus für Aktionen. Es wird ausgelöst, nachdem eine Anfrage für eine Erstellungs-, Aktualisierungs- oder Löschaktion gesendet, aber noch nicht verarbeitet wurde.

Wird im ausgelösten Workflow ein „Workflow beenden“-Knoten ausgeführt oder schlägt ein anderer Knoten fehl (z. B. aufgrund eines Fehlers oder einer unvollständigen Ausführung), wird die Formularaktion abgefangen. Andernfalls wird die vorgesehene Aktion wie gewohnt ausgeführt.

In Kombination mit dem Knoten „Antwortnachricht“ können Sie eine Antwortnachricht konfigurieren, die an den Client zurückgesendet wird, um entsprechende Hinweise zu geben. Ereignisse vor der Aktion eignen sich hervorragend für Geschäftsvalidierungen oder logische Prüfungen, um vom Client gesendete Anfragen für Erstellungs-, Aktualisierungs- und Löschaktionen entweder zuzulassen oder abzufangen.

## Trigger-Konfiguration

### Trigger erstellen

Wenn Sie einen Workflow erstellen, wählen Sie als Typ „Ereignis vor der Aktion“:

![Ereignis vor der Aktion erstellen](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe984fc4b6.png)

### Sammlung auswählen

Im Trigger eines Interzeptions-Workflows konfigurieren Sie zuerst die Sammlung, die der Aktion entspricht:

![Interzeptor-Ereignis-Konfiguration_Sammlung](https://static-docs.nocobase.com/8f7122caca159d334cf77f838d53d6.png)

Wählen Sie anschließend den Interzeptionsmodus. Sie können festlegen, dass nur Aktionsschaltflächen abgefangen werden, die an diesen Workflow gebunden sind, oder dass alle ausgewählten Aktionen für diese Sammlung abgefangen werden (unabhängig davon, von welchem Formular sie stammen und ohne dass der entsprechende Workflow gebunden werden muss).

### Interzeptionsmodus

![Interzeptor-Ereignis-Konfiguration_Interzeptionsmodus](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Derzeit werden die Aktionstypen „Erstellen“, „Aktualisieren“ und „Löschen“ unterstützt. Sie können auch mehrere Aktionstypen gleichzeitig auswählen.

## Aktionskonfiguration

Wenn in der Trigger-Konfiguration der Modus „Interzeption nur auslösen, wenn ein an diesen Workflow gebundenes Formular gesendet wird“ ausgewählt ist, müssen Sie zur Formularoberfläche zurückkehren und diesen Workflow an die entsprechende Aktionsschaltfläche binden:

![Bestellung hinzufügen_Workflow binden](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

Wählen Sie in der Konfiguration zum Binden des Workflows den entsprechenden Workflow aus. Normalerweise reicht es aus, als Standardkontext für die Trigger-Daten „Gesamte Formulardaten“ zu wählen:

![Zu bindenden Workflow auswählen](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Hinweis}
Die Schaltflächen, die an ein Ereignis vor der Aktion gebunden werden können, unterstützen derzeit nur die Schaltflächen „Senden“ (oder „Speichern“), „Daten aktualisieren“ und „Löschen“ in Erstellungs- oder Aktualisierungsformularen. Die Schaltfläche „Workflow auslösen“ wird nicht unterstützt (diese Schaltfläche kann nur an ein „Ereignis nach der Aktion“ gebunden werden).
:::

## Bedingungen für die Interzeption

Bei einem „Ereignis vor der Aktion“ gibt es zwei Bedingungen, die dazu führen, dass die entsprechende Aktion abgefangen wird:

1.  Der Workflow erreicht einen beliebigen „Workflow beenden“-Knoten. Ähnlich wie in den vorherigen Anweisungen wird, wenn die Daten, die den Workflow ausgelöst haben, die voreingestellten Bedingungen in einem „Bedingung“-Knoten nicht erfüllen, der „Nein“-Zweig betreten und der „Workflow beenden“-Knoten ausgeführt. Zu diesem Zeitpunkt endet der Workflow, und die angeforderte Aktion wird abgefangen.
2.  Ein beliebiger Knoten im Workflow schlägt fehl, einschließlich Ausführungsfehlern oder anderen Ausnahmen. In diesem Fall endet der Workflow mit einem entsprechenden Status, und die angeforderte Aktion wird ebenfalls abgefangen. Wenn der Workflow beispielsweise externe Daten über eine „HTTP-Anfrage“ aufruft und die Anfrage fehlschlägt, endet der Workflow mit einem Fehlerstatus und fängt gleichzeitig die entsprechende Aktionsanfrage ab.

Sobald die Interzeptionsbedingungen erfüllt sind, wird die entsprechende Aktion nicht mehr ausgeführt. Wenn beispielsweise eine Bestellübermittlung abgefangen wird, werden keine entsprechenden Bestelldaten erstellt.

## Zugehörige Parameter für die entsprechende Aktion

In einem Workflow vom Typ „Ereignis vor der Aktion“ können je nach Aktion unterschiedliche Daten aus dem Trigger als Variablen im Workflow verwendet werden:

| Aktionstyp \\ Variable     | „Operator“ | „Operator-Rollenbezeichner“ | Aktionsparameter: „ID“ | Aktionsparameter: „Gesendetes Datenobjekt“ |
| -------------------------- | ---------- | --------------------------- | ---------------------- | ------------------------------------------ |
| Eine Datensatz erstellen   | ✓          | ✓                           | -                      | ✓                                          |
| Eine Datensatz aktualisieren | ✓          | ✓                           | ✓                      | ✓                                          |
| Einzelne oder mehrere Datensätze löschen | ✓          | ✓                           | ✓                      | -                                          |

:::info{title=Hinweis}
Die Variable „Trigger-Daten / Aktionsparameter / Gesendetes Datenobjekt“ in einem Ereignis vor der Aktion sind nicht die tatsächlichen Daten aus der Datenbank, sondern lediglich die mit der Aktion gesendeten Parameter. Wenn Sie die tatsächlichen Daten aus der Datenbank benötigen, müssen Sie diese im Workflow über einen „Daten abfragen“-Knoten abrufen.

Bei einer Löschaktion ist die „ID“ in den Aktionsparametern ein einfacher Wert, wenn ein einzelner Datensatz betroffen ist, aber ein Array, wenn mehrere Datensätze betroffen sind.
:::

## Antwortnachricht ausgeben

Nachdem Sie den Trigger konfiguriert haben, können Sie die entsprechende Entscheidungslogik im Workflow anpassen. Typischerweise verwenden Sie den Verzweigungsmodus des Knotens „Bedingung“, um basierend auf den spezifischen Geschäftsbedingungen zu entscheiden, ob der „Workflow beendet“ und eine voreingestellte „Antwortnachricht“ zurückgegeben werden soll:

![Interzeptor-Workflow-Konfiguration](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

Damit ist die Konfiguration des entsprechenden Workflows abgeschlossen. Sie können nun versuchen, Daten zu senden, die die im Workflow festgelegten Bedingungen nicht erfüllen, um die Interzeptionslogik des Interzeptors auszulösen. Daraufhin sehen Sie die zurückgegebene Antwortnachricht:

![Fehler-Antwortnachricht](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Status der Antwortnachricht

Wenn der Knoten „Workflow beenden“ so konfiguriert ist, dass er mit dem Status „Erfolg“ beendet wird und dieser Knoten ausgeführt wird, wird die Anfrage für diese Aktion weiterhin abgefangen. Die zurückgegebene Antwortnachricht wird jedoch mit dem Status „Erfolg“ (und nicht „Fehler“) angezeigt:

![Antwortnachricht mit Erfolgsstatus](https://static-docs.nocobase.com/9559b3b6067144759451294b18c790e.png)

## Beispiel

Basierend auf den obigen grundlegenden Anweisungen nehmen wir ein Szenario zur „Bestellübermittlung“ als Beispiel. Angenommen, wir müssen beim Absenden einer Bestellung durch den Benutzer den Lagerbestand aller ausgewählten Produkte überprüfen. Wenn der Lagerbestand eines ausgewählten Produkts nicht ausreicht, wird die Bestellübermittlung abgefangen und eine entsprechende Hinweismeldung zurückgegeben. Der Workflow durchläuft dann jedes Produkt, bis der Lagerbestand aller Produkte ausreichend ist. Erst dann wird die Bestellung zugelassen und die Bestelldaten für den Benutzer generiert.

Die weiteren Schritte sind dieselben wie in den Anweisungen. Da eine Bestellung jedoch mehrere Produkte umfasst, müssen Sie zusätzlich zur Hinzufügung einer Viele-zu-Viele-Beziehung „Bestellung“ <-- m:1 -- „Bestelldetail“ -- 1:m --> „Produkt“ im Datenmodell auch einen „Schleife“-Knoten im Workflow „Ereignis vor der Aktion“ hinzufügen, um iterativ zu überprüfen, ob der Lagerbestand jedes Produkts ausreichend ist:

![Beispiel_Schleifenprüfungs-Workflow](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

Das Objekt für die Schleife wird als „Bestelldetail“-Array aus den gesendeten Bestelldaten ausgewählt:

![Beispiel_Schleifenobjekt-Konfiguration](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Der Bedingungsknoten im Schleifen-Workflow wird verwendet, um zu prüfen, ob der Lagerbestand des aktuell durchlaufenen Produktobjekts ausreichend ist:

![Beispiel_Bedingung in Schleife](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Die weiteren Konfigurationen sind identisch mit denen der grundlegenden Nutzung. Wenn die Bestellung schließlich gesendet wird und der Lagerbestand eines Produkts nicht ausreicht, wird die Bestellübermittlung abgefangen und eine entsprechende Hinweismeldung zurückgegeben. Beim Testen können Sie auch versuchen, mehrere Produkte in einer Bestellung zu senden, wobei ein Produkt einen unzureichenden und ein anderes einen ausreichenden Lagerbestand hat. Sie sehen dann die zurückgegebene Antwortnachricht:

![Beispiel_Antwortnachricht nach dem Senden](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Wie Sie sehen, weist die Antwortnachricht nicht auf einen unzureichenden Lagerbestand des ersten Produkts „iPhone 15 Pro“ hin, sondern nur auf den des zweiten Produkts „iPhone 14 Pro“. Dies liegt daran, dass im Schleifendurchlauf der Lagerbestand des ersten Produkts ausreichend war und es daher nicht abgefangen wurde, während der Lagerbestand des zweiten Produkts unzureichend war, was zur Abfangung der Bestellübermittlung führte.

## Externer Aufruf

Das Ereignis vor der Aktion wird selbst während der Anforderungsverarbeitungsphase injiziert und kann daher auch über HTTP-API-Aufrufe ausgelöst werden.

Workflows, die lokal an eine Aktionsschaltfläche gebunden sind, können Sie wie folgt aufrufen (am Beispiel der Erstellungsschaltfläche der `posts`-Sammlung):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Der URL-Parameter `triggerWorkflows` ist der Schlüssel des Workflows; mehrere Workflow-Schlüssel werden durch Kommas getrennt. Diesen Schlüssel erhalten Sie, indem Sie den Mauszeiger über den Workflow-Namen oben auf der Workflow-Leinwand bewegen:

![Workflow_Schlüssel_Anzeigemethode](https://static-docs.nocobase.com/20240426135108.png)

Nach dem Absenden des obigen Aufrufs wird das Ereignis vor der Aktion für die entsprechende `posts`-Sammlung ausgelöst. Nachdem der entsprechende Workflow synchron verarbeitet wurde, werden die Daten normal erstellt und zurückgegeben.

Wenn der konfigurierte Workflow einen „Endknoten“ erreicht, ist die Logik dieselbe wie bei einer Oberflächenaktion: Die Anfrage wird abgefangen, und es werden keine Daten erstellt. Ist der Status des Endknotens als fehlgeschlagen konfiguriert, ist der zurückgegebene Antwortstatuscode `400`; bei Erfolg ist er `200`.

Wenn vor dem Endknoten auch ein „Antwortnachricht“-Knoten konfiguriert ist, wird die generierte Nachricht ebenfalls im Antwortresultat zurückgegeben. Die Struktur bei einem Fehler ist:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

Die Nachrichtenstruktur, wenn der „Endknoten“ auf Erfolg konfiguriert ist, lautet:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Hinweis}
Da im Workflow mehrere „Antwortnachricht“-Knoten hinzugefügt werden können, ist die Datenstruktur der zurückgegebenen Nachricht ein Array.
:::

Ist das Ereignis vor der Aktion im globalen Modus konfiguriert, müssen Sie beim Aufruf der HTTP-API den URL-Parameter `triggerWorkflows` nicht verwenden, um den entsprechenden Workflow anzugeben. Ein direkter Aufruf der entsprechenden Sammlung-Aktion löst es aus.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Hinweis"}
Beim Auslösen eines Ereignisses vor der Aktion über einen HTTP-API-Aufruf müssen Sie auch den Aktivierungsstatus des Workflows und die Übereinstimmung der Sammlung-Konfiguration beachten, da der Aufruf sonst möglicherweise nicht erfolgreich ist oder Fehler auftreten können.
:::