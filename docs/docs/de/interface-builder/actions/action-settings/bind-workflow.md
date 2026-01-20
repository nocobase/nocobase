:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Workflow binden

## Einführung

Auf einigen Aktionsschaltflächen können Sie einen gebundenen Workflow konfigurieren, um die jeweilige Aktion mit einem Workflow zu verknüpfen und so eine automatisierte Datenverarbeitung zu ermöglichen.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Unterstützte Aktionen und Workflow-Typen

Die derzeit unterstützten Aktionsschaltflächen und Workflow-Typen sind wie folgt aufgeführt:

| Aktionsschaltfläche \ Workflow-Typ | Vor-Aktions-Ereignis | Nach-Aktions-Ereignis | Genehmigungsereignis | Benutzerdefiniertes Aktionsereignis |
| --- | --- | --- | --- | --- |
| Schaltflächen „Senden“, „Speichern“ eines Formulars | ✅ | ✅ | ✅ | ❌ |
| Schaltfläche „Datensatz aktualisieren“ in Datenzeilen (Tabelle, Liste usw.) | ✅ | ✅ | ✅ | ❌ |
| Schaltfläche „Löschen“ in Datenzeilen (Tabelle, Liste usw.) | ✅ | ❌ | ❌ | ❌ |
| Schaltfläche „Workflow auslösen“ | ❌ | ❌ | ❌ | ✅ |

## Mehrere Workflows binden

Eine Aktionsschaltfläche kann mit mehreren Workflows verknüpft werden. Wenn mehrere Workflows verknüpft sind, folgt ihre Ausführungsreihenfolge diesen Regeln:

1.  Bei Workflows desselben Auslösertyps werden synchrone Workflows zuerst ausgeführt, gefolgt von asynchronen Workflows.
2.  Workflows desselben Auslösertyps werden in der konfigurierten Reihenfolge ausgeführt.
3.  Zwischen Workflows unterschiedlicher Auslösertypen:
    1.  Vor-Aktions-Ereignisse werden immer vor Nach-Aktions- und Genehmigungsereignissen ausgeführt.
    2.  Nach-Aktions- und Genehmigungsereignisse haben keine spezifische Reihenfolge, und die Geschäftslogik sollte nicht von der Konfigurationsreihenfolge abhängen.

## Weitere Informationen

Für verschiedene Workflow-Ereignistypen lesen Sie bitte die detaillierte Dokumentation der entsprechenden Plugins:

*   [Nach-Aktions-Ereignis]
*   [Vor-Aktions-Ereignis]
*   [Genehmigungsereignis]
*   [Benutzerdefiniertes Aktionsereignis]