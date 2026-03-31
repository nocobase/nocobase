---
pkg: "@nocobase/plugin-workflow-response-message"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# HTTP-Antwort

## Einführung

Dieser Knoten wird ausschließlich in synchronen Webhook-Workflows unterstützt und dient dazu, eine Antwort an ein Drittsystem zurückzugeben. Wenn beispielsweise bei der Verarbeitung eines Zahlungs-Callbacks ein unerwartetes Ergebnis auftritt (z. B. ein Fehler oder ein Fehlschlag), können Sie über den Antwort-Knoten eine entsprechende Fehlermeldung an das Drittsystem senden. Dies ermöglicht es einigen Drittsystemen, den Vorgang später basierend auf dem Status erneut zu versuchen.

Darüber hinaus beendet die Ausführung des Antwort-Knotens den Workflow, und nachfolgende Knoten werden nicht mehr ausgeführt. Ist im gesamten Workflow kein Antwort-Knoten konfiguriert, antwortet das System automatisch basierend auf dem Ausführungsstatus des Flows: Bei erfolgreicher Ausführung wird `200` zurückgegeben, bei fehlgeschlagener Ausführung `500`.

## Einen Antwort-Knoten erstellen

In der Workflow-Konfigurationsoberfläche klicken Sie im Flow auf das Plus-Symbol („+“), um einen „Antwort“-Knoten hinzuzufügen:

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Antwort-Konfiguration

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Im Antwort-Body können Sie Variablen aus dem Workflow-Kontext verwenden.