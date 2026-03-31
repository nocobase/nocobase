---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Genehmigung

## Einführung

Die Genehmigung ist eine Prozessform, die speziell für manuell initiierte und manuell bearbeitete Aufgaben entwickelt wurde, um den Status relevanter Daten zu bestimmen. Sie wird häufig für die Prozessverwaltung in der Büroautomation oder bei anderen manuellen Entscheidungsprozessen eingesetzt. Beispielsweise können Sie manuelle Workflows für Szenarien wie „Urlaubsanträge“, „Spesenabrechnungen“ und „Genehmigungen für den Rohstoffeinkauf“ erstellen und verwalten.

Das Genehmigungs-Plugin bietet einen speziellen Workflow-Typ (Trigger) „Genehmigung (Ereignis)“ und einen dedizierten „Genehmigungs“-Knoten für diesen Prozess. In Kombination mit den einzigartigen benutzerdefinierten Sammlungen und benutzerdefinierten Blöcken von NocoBase können Sie schnell und flexibel verschiedene Genehmigungsszenarien erstellen und verwalten.

## Workflow erstellen

Wenn Sie einen Workflow erstellen, wählen Sie den Typ „Genehmigung“ aus, um einen Genehmigungs-Workflow zu erstellen:

![审批触发器_创建审批流程](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Danach klicken Sie in der Workflow-Konfigurationsoberfläche auf den Trigger, um ein Dialogfenster für weitere Konfigurationen zu öffnen.

## Trigger-Konfiguration

### Sammlung binden

Das Genehmigungs-Plugin von NocoBase ist auf Flexibilität ausgelegt und kann mit jeder benutzerdefinierten Sammlung verwendet werden. Das bedeutet, dass die Genehmigungskonfiguration das Datenmodell nicht neu konfigurieren muss, sondern eine bestehende Sammlung direkt wiederverwendet. Daher müssen Sie nach dem Aufrufen der Trigger-Konfiguration zuerst eine Sammlung auswählen, um zu bestimmen, bei welcher Sammlung die Erstellung oder Aktualisierung von Daten diesen Workflow auslösen soll:

![审批触发器_触发器配置_选择数据表](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

Binden Sie dann in dem Formular zum Erstellen (oder Bearbeiten) von Daten für die entsprechende Sammlung diesen Workflow an die Schaltfläche „Senden“:

![发起审批_绑定工作流](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Danach wird bei der Übermittlung dieses Formulars durch einen Benutzer der entsprechende Genehmigungs-Workflow ausgelöst. Die übermittelten Daten werden nicht nur in der entsprechenden Sammlung gespeichert, sondern auch als Snapshot im Genehmigungs-Workflow abgelegt, damit sie von nachfolgenden Genehmigern eingesehen und verwendet werden können.

### Zurückziehen

Wenn ein Genehmigungs-Workflow es dem Initiator erlaubt, ihn zurückzuziehen, müssen Sie in der Konfiguration der Initiator-Oberfläche die Schaltfläche „Zurückziehen“ aktivieren:

![审批触发器_触发器配置_允许撤回](https://static-docs.nocobase.com/20251029232544.png)

Nach der Aktivierung kann eine durch diesen Workflow initiierte Genehmigung vom Initiator zurückgezogen werden, bevor ein Genehmiger sie bearbeitet hat. Nachdem jedoch ein Genehmiger in einem nachfolgenden Genehmigungsknoten sie bearbeitet hat, kann sie nicht mehr zurückgezogen werden.

:::info{title=Hinweis}
Nach dem Aktivieren oder Löschen der Schaltfläche „Zurückziehen“ müssen Sie im Dialogfenster der Trigger-Konfiguration auf „Speichern“ klicken, damit die Änderungen wirksam werden.
:::

### Konfiguration der Formularoberfläche für den Initiator

Zuletzt müssen Sie die Formularoberfläche des Initiators konfigurieren. Diese Oberfläche wird für Übermittlungsaktionen verwendet, wenn eine Genehmigung über den Genehmigungszentrums-Block initiiert oder nach einem Widerruf erneut eingeleitet wird. Klicken Sie auf die Schaltfläche „Konfigurieren“, um das Dialogfenster zu öffnen:

![审批触发器_触发器配置_发起人表单](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Sie können der Oberfläche des Initiators ein Ausfüllformular hinzufügen, das auf der gebundenen Sammlung basiert, oder beschreibenden Text (Markdown) für Hinweise und Anleitungen. Das Formular muss hinzugefügt werden; andernfalls kann der Initiator nach dem Aufrufen dieser Oberfläche keine Aktionen ausführen.

Nach dem Hinzufügen eines Formularblocks können Sie, wie in einer normalen Formular-Konfigurationsoberfläche, Feldkomponenten aus der entsprechenden Sammlung hinzufügen und diese nach Bedarf anordnen, um die im Formular auszufüllenden Inhalte zu organisieren:

![审批触发器_触发器配置_发起人表单_字段配置](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Zusätzlich zur direkten Schaltfläche „Senden“ können Sie auch eine Aktionsschaltfläche „Als Entwurf speichern“ hinzufügen, um einen temporären Speicherprozess zu unterstützen:

![审批触发器_触发器配置_发起人表单_操作配置](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Genehmigungsknoten

In einem Genehmigungs-Workflow müssen Sie den dedizierten „Genehmigungs“-Knoten verwenden, um die Betriebslogik für Genehmiger zu konfigurieren, die initiierte Genehmigungen bearbeiten (genehmigen, ablehnen oder zurücksenden). Der „Genehmigungs“-Knoten kann auch nur in Genehmigungs-Workflows verwendet werden. Weitere Details finden Sie unter [Genehmigungsknoten](../nodes/approval.md).

## Genehmigungsinitiierung konfigurieren

Nachdem Sie einen Genehmigungs-Workflow konfiguriert und aktiviert haben, können Sie diesen Workflow an die Schaltfläche „Senden“ des Formulars der entsprechenden Sammlung binden, damit Benutzer bei der Übermittlung eine Genehmigung initiieren können:

![发起审批_绑定工作流](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Nach dem Binden des Workflows wird, wenn ein Benutzer das aktuelle Formular übermittelt, eine Genehmigung initiiert.

:::info{title=Hinweis}
Die Schaltfläche zum Initiieren einer Genehmigung unterstützt derzeit nur die Schaltfläche „Senden“ (oder „Speichern“) in einem Erstellungs- oder Aktualisierungsformular. Sie unterstützt nicht die Schaltfläche „An Workflow senden“ (diese Schaltfläche kann nur an „Nach-Aktions-Ereignisse“ gebunden werden).
:::

## Aufgaben-Center

Das Aufgaben-Center bietet einen zentralen Zugangspunkt, der es Benutzern ermöglicht, ihre Aufgaben einzusehen und zu bearbeiten. Vom aktuellen Benutzer initiierte Genehmigungen und ausstehende Aufgaben können über das Aufgaben-Center in der oberen Symbolleiste aufgerufen werden, und verschiedene Arten von Aufgaben können über die linke Navigationsleiste eingesehen werden.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Meine Einreichungen

#### Eingereichte Genehmigungen anzeigen

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Eine neue Genehmigung direkt initiieren

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Meine Aufgaben

#### Aufgabenliste

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Aufgabendetails

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Initiator

#### Von Sammlung initiieren

Um von einem Datenblock aus zu initiieren, können Sie einen Aufruf wie diesen tätigen (am Beispiel der Schaltfläche „Erstellen“ der `posts`-Sammlung):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Dabei ist der URL-Parameter `triggerWorkflows` der Schlüssel des Workflows; mehrere Workflow-Schlüssel werden durch Kommas getrennt. Diesen Schlüssel erhalten Sie, indem Sie den Mauszeiger über den Workflow-Namen oben auf der Workflow-Leinwand bewegen:

![工作流_key_查看方式](https://static-docs.nocobase.com/20240426135108.png)

Nach einem erfolgreichen Aufruf wird der Genehmigungs-Workflow für die entsprechende `posts`-Sammlung ausgelöst.

:::info{title="Hinweis"}
Da externe Aufrufe ebenfalls auf der Benutzeridentität basieren müssen, müssen beim Aufruf über die HTTP API, genau wie bei Anfragen, die von der regulären Oberfläche gesendet werden, Authentifizierungsinformationen bereitgestellt werden, einschließlich des `Authorization`-Headers oder des `token`-Parameters (des bei der Anmeldung erhaltenen Tokens) sowie des `X-Role`-Headers (des aktuellen Rollennamens des Benutzers).
:::

Wenn Sie ein Ereignis für Eins-zu-Eins-Beziehungsdaten in dieser Aktion auslösen müssen (Eins-zu-Viele wird derzeit nicht unterstützt), können Sie `!` im Parameter verwenden, um die Trigger-Daten für das Beziehungsfeld anzugeben:

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

Nach einem erfolgreichen Aufruf oben wird das Genehmigungsereignis für die entsprechende `categories`-Sammlung ausgelöst.

:::info{title="Hinweis"}
Beim Auslösen eines Nach-Aktions-Ereignisses über die HTTP API müssen Sie auch den Aktivierungsstatus des Workflows beachten und ob die Sammlungskonfiguration übereinstimmt, andernfalls kann der Aufruf fehlschlagen oder zu einem Fehler führen.
:::

#### Vom Genehmigungs-Center initiieren

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parameter**

*   `collectionName`: Name der Ziel-Sammlung für die Initiierung der Genehmigung, erforderlich.
*   `workflowId`: ID des Workflows, der für die Initiierung der Genehmigung verwendet wird, erforderlich.
*   `data`: Felder des Sammlungsdatensatzes, der bei der Initiierung der Genehmigung erstellt wird, erforderlich.
*   `status`: Status des Datensatzes, der bei der Initiierung der Genehmigung erstellt wird, erforderlich. Mögliche Werte sind:
    *   `0`: Entwurf, bedeutet Speichern ohne zur Genehmigung einzureichen.
    *   `1`: Zur Genehmigung einreichen, bedeutet, dass der Initiator den Genehmigungsantrag einreicht und der Genehmigungsprozess beginnt.

#### Speichern und Senden

Wenn eine initiierte (oder zurückgezogene) Genehmigung den Status „Entwurf“ hat, können Sie sie über die folgende API erneut speichern oder senden:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Liste der eingereichten Genehmigungen abrufen

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Zurückziehen

Der Initiator kann einen sich derzeit in Genehmigung befindlichen Datensatz über die folgende API zurückziehen:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parameter**

*   `<approval id>`: Die ID des zurückzuziehenden Genehmigungsdatensatzes, erforderlich.

### Genehmiger

Nachdem der Genehmigungs-Workflow einen Genehmigungsknoten erreicht hat, wird für den aktuellen Genehmiger eine Aufgabe erstellt. Der Genehmiger kann die Genehmigungsaufgabe über die Oberfläche abschließen oder durch Aufruf der HTTP API.

#### Genehmigungsdatensätze abrufen

Aufgaben sind Genehmigungsdatensätze. Sie können alle Genehmigungsdatensätze des aktuellen Benutzers über die folgende API abrufen:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Dabei ist `approvalRecords` eine Sammlungsressource, sodass Sie allgemeine Abfragebedingungen verwenden können, wie `filter`, `sort`, `pageSize` und `page`.

#### Einzelnen Genehmigungsdatensatz abrufen

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Genehmigen und Ablehnen

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parameter**

*   `<record id>`: Die ID des zu genehmigenden Datensatzes, erforderlich.
*   `status`: Der Status des Genehmigungsprozesses. `2` für „Genehmigen“, `-1` für „Ablehnen“, erforderlich.
*   `comment`: Bemerkungen zum Genehmigungsprozess, optional.
*   `data`: Änderungen am Sammlungsdatensatz am aktuellen Genehmigungsknoten nach der Genehmigung, optional (nur bei Genehmigung wirksam).

#### Zurücksenden <Badge>v1.9.0+</Badge>

Vor Version v1.9.0 verwendete das Zurücksenden dieselbe API wie „Genehmigen“ und „Ablehnen“, wobei `"status": 1` ein Zurücksenden darstellte.

Ab Version v1.9.0 gibt es eine separate API für das Zurücksenden:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parameter**

*   `<record id>`: Die ID des zu genehmigenden Datensatzes, erforderlich.
*   `returnToNodeKey`: Der Schlüssel des Zielknotens, zu dem zurückgekehrt werden soll, optional. Wenn im Knoten ein Bereich von zurücksendbaren Knoten konfiguriert ist, kann dieser Parameter verwendet werden, um anzugeben, zu welchem Knoten zurückgekehrt werden soll. Wenn nicht konfiguriert, muss dieser Parameter nicht übergeben werden, und es wird standardmäßig zum Startpunkt zurückgekehrt, wo der Initiator erneut einreichen muss.

#### Delegieren

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parameter**

*   `<record id>`: Die ID des zu genehmigenden Datensatzes, erforderlich.
*   `assignee`: Die ID des Benutzers, an den delegiert werden soll, erforderlich.

#### Unterzeichner hinzufügen

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parameter**

*   `<record id>`: Die ID des zu genehmigenden Datensatzes, erforderlich.
*   `assignees`：Eine Liste der Benutzer-IDs, die als Unterzeichner hinzugefügt werden sollen, erforderlich.
*   `order`: Die Reihenfolge des hinzugefügten Unterzeichners. `-1` bedeutet vor „mir“, `1` bedeutet nach „mir“.