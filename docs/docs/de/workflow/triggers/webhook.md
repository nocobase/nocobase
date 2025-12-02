---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Webhook

## Einführung

Der Webhook-Trigger stellt eine URL bereit, die von Drittsystemen über HTTP-Anfragen aufgerufen werden kann. Wenn ein Ereignis in einem Drittsystem auftritt, wird eine HTTP-Anfrage an diese URL gesendet, um die Ausführung des Workflows auszulösen. Dies eignet sich für Benachrichtigungen, die von externen Systemen initiiert werden, wie z.B. Zahlungs-Callbacks oder Nachrichten.

## Workflow erstellen

Beim Erstellen eines Workflows wählen Sie als Typ „Webhook-Ereignis“ aus:

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Hinweis"}
Der Unterschied zwischen „synchronen“ und „asynchronen“ Workflows besteht darin, dass ein synchroner Workflow die Ausführung des Workflows abwartet, bevor er eine Antwort zurückgibt. Ein asynchroner Workflow hingegen gibt die im Trigger konfigurierte Antwort sofort zurück und reiht die Ausführung im Hintergrund ein.
:::

## Trigger-Konfiguration

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### Webhook URL

Die URL für den Webhook-Trigger wird vom System automatisch generiert und an diesen Workflow gebunden. Sie können den Button auf der rechten Seite anklicken, um sie zu kopieren und in das Drittsystem einzufügen.

Es wird nur die HTTP-Methode POST unterstützt; andere Methoden führen zu einem `405`-Fehler.

### Sicherheit

Derzeit wird die HTTP-Basisauthentifizierung unterstützt. Sie können diese Option aktivieren und einen Benutzernamen sowie ein Passwort festlegen. Um die sichere Authentifizierung für den Webhook zu implementieren, fügen Sie den Benutzernamen und das Passwort in die Webhook-URL des Drittsystems ein (Details zum Standard finden Sie unter: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Wenn ein Benutzername und ein Passwort festgelegt sind, überprüft das System, ob diese in der Anfrage übereinstimmen. Werden sie nicht bereitgestellt oder stimmen sie nicht überein, wird ein `401`-Fehler zurückgegeben.

### Anfragedaten parsen

Wenn ein Drittsystem den Webhook aufruft, müssen die in der Anfrage enthaltenen Daten geparst werden, bevor sie im Workflow verwendet werden können. Nach dem Parsen stehen sie als Trigger-Variable zur Verfügung und können in nachfolgenden Knoten referenziert werden.

Das Parsen der HTTP-Anfrage gliedert sich in drei Teile:

1.  Anfrage-Header

    Anfrage-Header sind in der Regel einfache Schlüssel-Wert-Paare vom Typ String. Die benötigten Header-Felder können direkt konfiguriert werden, z.B. `Date`, `X-Request-Id` usw.

2.  Anfrage-Parameter

    Anfrage-Parameter sind die Abfrageparameter im URL, wie z.B. der `query`-Parameter in `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Sie können eine vollständige Beispiel-URL oder nur den Teil der Abfrageparameter einfügen und auf den Parsen-Button klicken, um die Schlüssel-Wert-Paare automatisch zu parsen.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    Die automatische Analyse wandelt den Parameterteil der URL in eine JSON-Struktur um und generiert Pfade wie `query[0]`, `query[0].a` basierend auf der Parameterhierarchie. Der Pfadname kann bei Bedarf manuell geändert werden, ist aber in der Regel nicht notwendig. Der Alias ist der Anzeigename der Variablen, wenn sie verwendet wird, und ist optional. Die Analyse generiert außerdem eine vollständige Parameterliste aus dem Beispiel; nicht benötigte Parameter können Sie löschen.

3.  Anfrage-Body

    Der Anfrage-Body ist der Body-Teil der HTTP-Anfrage. Derzeit werden nur Anfrage-Bodies mit dem `Content-Type` `application/json` unterstützt. Sie können die zu parsenden Pfade direkt konfigurieren oder ein JSON-Beispiel eingeben und auf den Parsen-Button klicken, um eine automatische Analyse durchzuführen.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    Die automatische Analyse wandelt die Schlüssel-Wert-Paare in der JSON-Struktur in Pfade um. Zum Beispiel generiert `{"a": 1, "b": {"c": 2}}` Pfade wie `a`, `b` und `b.c`. Der Alias ist der Anzeigename der Variablen, wenn sie verwendet wird, und ist optional. Die Analyse generiert außerdem eine vollständige Parameterliste aus dem Beispiel; nicht benötigte Parameter können Sie löschen.

### Antwort-Einstellungen

Die Konfiguration der Webhook-Antwort unterscheidet sich bei synchronen und asynchronen Workflows. Bei asynchronen Workflows wird die Antwort direkt im Trigger konfiguriert. Nach Empfang einer Webhook-Anfrage wird die konfigurierte Antwort sofort an das Drittsystem zurückgegeben, und erst danach wird der Workflow ausgeführt. Bei synchronen Workflows müssen Sie hingegen einen Antwort-Knoten innerhalb des Flows hinzufügen, um die Antwort gemäß den Geschäftsanforderungen zu verarbeiten (Details siehe: [Antwort-Knoten](#antwort-knoten)).

Typischerweise hat die Antwort für ein asynchron ausgelöstes Webhook-Ereignis den Statuscode `200` und einen Antwort-Body von `ok`. Sie können den Antwort-Statuscode, die Header und den Body bei Bedarf auch anpassen.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Antwort-Knoten

Referenz: [Antwort-Knoten](../nodes/response.md)

## Beispiel

In einem Webhook-Workflow können Sie je nach Geschäftsbedingungen unterschiedliche Antworten zurückgeben, wie in der Abbildung unten gezeigt:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Verwenden Sie einen Bedingungs-Verzweigungsknoten, um zu prüfen, ob ein bestimmter Geschäftsstatus erfüllt ist. Ist dies der Fall, geben Sie eine Erfolgsantwort zurück; anderenfalls eine Fehlermeldung.