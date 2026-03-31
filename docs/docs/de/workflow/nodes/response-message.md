---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Antwortnachricht

## Einführung

Der Antwortnachricht-Knoten ermöglicht es Ihnen, in bestimmten Workflow-Typen dem Client, der eine Aktion ausgelöst hat, benutzerdefinierte Nachrichten aus dem Workflow zurückzumelden.

:::info{title=Hinweis}
Aktuell wird die Verwendung in Workflows vom Typ „Vor-Aktion-Ereignis“ und „Benutzerdefiniertes Aktion-Ereignis“ im synchronen Modus unterstützt.
:::

## Einen Knoten erstellen

In unterstützten Workflow-Typen können Sie an beliebiger Stelle im Workflow einen „Antwortnachricht“-Knoten hinzufügen. Klicken Sie dazu auf das Plus-Symbol („+“) im Workflow, um den „Antwortnachricht“-Knoten hinzuzufügen:

![Knoten hinzufügen](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Die Antwortnachricht wird während des gesamten Anfrageprozesses als Array gespeichert. Wird ein Antwortnachricht-Knoten im Workflow ausgeführt, wird der neue Nachrichteninhalt an das Array angehängt. Wenn der Server die Antwort sendet, werden alle Nachrichten gemeinsam an den Client gesendet.

## Knotenkonfiguration

Der Nachrichteninhalt ist ein Vorlagen-String, in den Variablen eingefügt werden können. Sie können diesen Vorlageninhalt in der Knotenkonfiguration beliebig gestalten:

![Knotenkonfiguration](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Wenn der Workflow diesen Knoten erreicht, wird die Vorlage analysiert und der Nachrichteninhalt generiert. In der obigen Konfiguration wird die Variable „Lokale Variable / Alle Produkte durchlaufen / Schleifenobjekt / Produkt / Titel“ im tatsächlichen Workflow durch einen spezifischen Wert ersetzt, zum Beispiel:

```
Produkt „iPhone 14 pro“ ist nicht mehr vorrätig
```

![Nachrichteninhalt](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

## Workflow-Konfiguration

Der Status der Antwortnachricht hängt vom Erfolg oder Misserfolg der Workflow-Ausführung ab. Schlägt die Ausführung eines beliebigen Knotens fehl, führt dies zum Scheitern des gesamten Workflows. In diesem Fall wird der Nachrichteninhalt mit dem Status „Fehler“ an den Client zurückgegeben und angezeigt.

Wenn Sie im Workflow aktiv einen Fehlerstatus definieren möchten, können Sie einen „Endknoten“ verwenden und diesen auf den Fehlerstatus konfigurieren. Wird dieser Knoten ausgeführt, beendet der Workflow die Ausführung mit einem Fehlerstatus, und die Nachricht wird mit einem Fehlerstatus an den Client zurückgegeben.

Wenn der gesamte Workflow keinen Fehlerstatus erzeugt und erfolgreich bis zum Ende ausgeführt wird, wird der Nachrichteninhalt mit dem Status „Erfolg“ an den Client zurückgegeben.

:::info{title=Hinweis}
Wenn im Workflow mehrere Antwortnachricht-Knoten definiert sind, hängen die ausgeführten Knoten den Nachrichteninhalt an ein Array an. Bei der endgültigen Rückgabe an den Client werden alle Nachrichten zusammen zurückgegeben und angezeigt.
:::

## Anwendungsfälle

### „Vor-Aktion-Ereignis“-Workflow

Die Verwendung einer Antwortnachricht in einem „Vor-Aktion-Ereignis“-Workflow ermöglicht es, dem Client nach Abschluss des Workflows entsprechende Nachrichtenrückmeldungen zu senden. Weitere Details finden Sie unter [Vor-Aktion-Ereignis](../triggers/pre-action.md).

### „Benutzerdefiniertes Aktion-Ereignis“-Workflow

Die Verwendung einer Antwortnachricht in einem „Benutzerdefiniertes Aktion-Ereignis“ im synchronen Modus ermöglicht es, dem Client nach Abschluss des Workflows entsprechende Nachrichtenrückmeldungen zu senden. Weitere Details finden Sie unter [Benutzerdefiniertes Aktion-Ereignis](../triggers/custom-action.md).