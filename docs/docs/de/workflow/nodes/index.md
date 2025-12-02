:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Übersicht

Ein Workflow besteht typischerweise aus mehreren miteinander verbundenen Arbeitsschritten. Jeder Knoten stellt einen dieser Schritte dar und dient als grundlegende logische Einheit im Prozess. Ähnlich wie in einer Programmiersprache repräsentieren verschiedene Knotentypen unterschiedliche Anweisungen, die das Verhalten des Knotens bestimmen. Wenn der Workflow ausgeführt wird, durchläuft das System jeden Knoten nacheinander und führt dessen Anweisungen aus.

:::info{title=Hinweis}
Der Trigger eines Workflows ist kein Knoten. Er wird lediglich als Einstiegspunkt im Flussdiagramm angezeigt, ist aber ein anderes Konzept als ein Knoten. Details hierzu finden Sie im Abschnitt [Trigger](../triggers/index.md).
:::

Aus funktionaler Sicht lassen sich die aktuell implementierten Knoten in mehrere Hauptkategorien unterteilen (insgesamt 29 Knotentypen):

- Künstliche Intelligenz
  - [Großes Sprachmodell](../../ai-employees/workflow/nodes/llm/chat.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-llm)
- Ablaufsteuerung
  - [Bedingung](./condition.md)
  - [Mehrfachbedingungen](./multi-conditions.md)
  - [Schleife](./loop.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-loop)
  - [Variable](./variable.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-variable)
  - [Parallele Verzweigung](./parallel.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-parallel)
  - [Workflow aufrufen](./subflow.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-subflow)
  - [Workflow-Ausgabe](./output.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-subflow)
  - [JSON-Variablenzuordnung](./json-variable-mapping.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-json-variable-mapping)
  - [Verzögerung](./delay.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-delay)
  - [Workflow beenden](./end.md)
- Berechnung
  - [Berechnung](./calculation.md)
  - [Datumsberechnung](./date-calculation.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-date-calculation)
  - [JSON-Berechnung](./json-query.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-json-query)
- Sammlungsaktionen
  - [Daten erstellen](./create.md)
  - [Daten aktualisieren](./update.md)
  - [Daten löschen](./destroy.md)
  - [Daten abfragen](./query.md)
  - [Aggregierte Abfrage](./aggregate.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-aggregate)
  - [SQL-Aktion](./sql.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-sql)
- Manuelle Bearbeitung
  - [Manuelle Bearbeitung](./manual.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-manual)
  - [Genehmigung](./approval.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-approval)
  - [CC](./cc.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-cc)
- Weitere Erweiterungen
  - [HTTP-Anfrage](./request.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-javascript)
  - [E-Mail senden](./mailer.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-mailer)
  - [Benachrichtigung](../../notification-manager/index.md#工作流通知节点) (bereitgestellt vom Plugin @nocobase/plugin-workflow-notification)
  - [Antwort](./response.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-webhook)
  - [Antwortnachricht](./response-message.md) (bereitgestellt vom Plugin @nocobase/plugin-workflow-response-message)