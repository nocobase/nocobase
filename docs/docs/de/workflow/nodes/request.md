---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# HTTP-Anfrage

## Einführung

Wenn Sie mit einem anderen Web-System interagieren müssen, können Sie den HTTP-Anfrage-Knoten verwenden. Dieser Knoten sendet bei Ausführung eine HTTP-Anfrage an die konfigurierte Adresse. Er kann Daten im JSON- oder `application/x-www-form-urlencoded`-Format übermitteln, um den Datenaustausch mit externen Systemen zu ermöglichen.

Wenn Sie mit Tools zum Senden von Anfragen wie Postman vertraut sind, werden Sie die Verwendung des HTTP-Anfrage-Knotens schnell beherrschen. Im Gegensatz zu diesen Tools können alle Parameter im HTTP-Anfrage-Knoten Kontextvariablen aus dem aktuellen Workflow nutzen. Dies ermöglicht eine nahtlose Integration in die Geschäftsprozesse Ihres Systems.

## Installation

Dieses Plugin ist integriert und erfordert keine separate Installation.

## Knoten erstellen

Klicken Sie in der Workflow-Konfigurationsoberfläche auf das Plus-Symbol („+“) im Workflow, um einen „HTTP-Anfrage“-Knoten hinzuzufügen:

![HTTP-Anfrage_Hinzufügen](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Knotenkonfiguration

![HTTP-Anfrage-Knoten_Knotenkonfiguration](https://static-docs.nocobase.com/2fcb29af3f6869c80f8fbd362a54e644.png)

### Anfragemethode

Verfügbare HTTP-Anfragemethoden: `GET`, `POST`, `PUT`, `PATCH` und `DELETE`.

### Anfrage-URL

Die URL des HTTP-Dienstes muss das Protokoll (`http://` oder `https://`) enthalten. Die Verwendung von `https://` wird empfohlen.

### Anfrage-Datenformat

Dies ist der `Content-Type` im Anfrage-Header. Eine Liste der unterstützten Formate finden Sie im Abschnitt „[Anfrage-Body](#请求体)“.

### Anfrage-Header-Konfiguration

Schlüssel-Wert-Paare für den Anfrage-Header-Bereich. Die Werte können Variablen aus dem Workflow-Kontext verwenden.

:::info{title=Tipp}
Der `Content-Type`-Anfrage-Header wird über das Anfrage-Datenformat konfiguriert. Sie müssen ihn hier nicht ausfüllen, und ein Überschreiben wäre wirkungslos.
:::

### Anfrage-Parameter

Schlüssel-Wert-Paare für den Anfrage-Query-Bereich. Die Werte können Variablen aus dem Workflow-Kontext verwenden.

### Anfrage-Body

Der Body-Teil der Anfrage. Je nach gewähltem `Content-Type` werden verschiedene Formate unterstützt.

#### `application/json`

Unterstützt Text im Standard-JSON-Format. Sie können Variablen aus dem Workflow-Kontext über die Schaltfläche „Variable“ oben rechts im Texteditor einfügen.

:::info{title=Tipp}
Variablen müssen innerhalb eines JSON-Strings verwendet werden, zum Beispiel: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Schlüssel-Wert-Paar-Format. Die Werte können Variablen aus dem Workflow-Kontext verwenden. Wenn Variablen enthalten sind, werden sie als String-Vorlage geparst und zum endgültigen String-Wert zusammengefügt.

#### `application/xml`

Unterstützt Text im Standard-XML-Format. Sie können Variablen aus dem Workflow-Kontext über die Schaltfläche „Variable“ oben rechts im Texteditor einfügen.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Unterstützt Schlüssel-Wert-Paare für Formulardaten. Dateien können hochgeladen werden, wenn der Datentyp auf ein Datei-Objekt eingestellt ist. Dateien können nur über Variablen aus bereits im Kontext vorhandenen Datei-Objekten ausgewählt werden, zum Beispiel als Ergebnis einer Abfrage auf eine Datei-Sammlung oder als verknüpfte Daten aus einer zugehörigen Datei-Sammlung.

:::info{title=Tipp}
Stellen Sie beim Auswählen von Datei-Daten sicher, dass die Variable einem einzelnen Datei-Objekt entspricht und nicht einer Liste von Dateien (bei einer Abfrage mit Mehrfachbeziehung ist der Wert des Beziehungsfeldes ein Array).
:::

### Timeout-Einstellungen

Wenn eine Anfrage längere Zeit nicht reagiert, kann die Timeout-Einstellung verwendet werden, um die Ausführung der Anfrage abzubrechen. Nach einem Timeout wird der aktuelle Workflow vorzeitig mit dem Status „Fehlgeschlagen“ beendet.

### Fehler ignorieren

Der Anfrage-Knoten betrachtet HTTP-Statuscodes zwischen `200` und `299` (einschließlich) als erfolgreich; alle anderen werden als fehlgeschlagen eingestuft. Wenn die Option „Fehlgeschlagene Anfragen ignorieren und Workflow fortsetzen“ aktiviert ist, werden die nachfolgenden Knoten im Workflow auch dann ausgeführt, wenn die Anfrage fehlschlägt.

## Verwendung des Antwort-Ergebnisses

Das Antwort-Ergebnis einer HTTP-Anfrage kann vom [JSON-Abfrage](./json-query.md)-Knoten geparst werden, um es in nachfolgenden Knoten zu verwenden.

Ab Version `v1.0.0-alpha.16` können drei Teile des Antwort-Ergebnisses des Anfrage-Knotens separat als Variablen verwendet werden:

*   Antwort-Statuscode
*   Antwort-Header
*   Antwort-Daten

![HTTP-Anfrage-Knoten_Verwendung des Antwort-Ergebnisses](https://static-docs.nocobase.com/20240529110610.png)

Der Antwort-Statuscode ist in der Regel ein standardmäßiger HTTP-Statuscode in numerischer Form, wie z. B. `200`, `403` usw. (vom Dienstanbieter bereitgestellt).

Die Antwort-Header sind im JSON-Format. Sowohl die Header als auch die JSON-formatierten Antwort-Daten müssen weiterhin mit einem JSON-Knoten geparst werden, bevor sie verwendet werden können.

## Beispiel

Wir können den Anfrage-Knoten beispielsweise verwenden, um eine Cloud-Plattform zum Senden von Benachrichtigungs-SMS anzubinden. Die Konfiguration für eine Cloud-SMS-API könnte wie folgt aussehen (die relevanten Parameter müssen Sie der Dokumentation des jeweiligen Anbieters entnehmen und anpassen):

![HTTP-Anfrage-Knoten_Knotenkonfiguration](https://static-docs.nocobase.com/20240515124004.png)

Wenn der Workflow diesen Knoten auslöst, wird die SMS-API von Alibaba Cloud mit dem konfigurierten Inhalt aufgerufen. Ist die Anfrage erfolgreich, wird über den SMS-Cloud-Dienst eine SMS versendet.