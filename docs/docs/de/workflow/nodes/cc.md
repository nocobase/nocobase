---
pkg: '@nocobase/plugin-workflow-cc'
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/workflow/nodes/cc).
:::

# CC <Badge>v1.8.2+</Badge>

## Einführung

Der CC-Knoten wird verwendet, um bestimmte Kontextinhalte aus dem Ausführungsprozess eines Workflows an angegebene Benutzer zu senden, damit diese informiert sind und die Inhalte einsehen können. Beispielsweise können in einem Genehmigungs- oder anderen Prozess relevante Informationen an andere Beteiligte gesendet werden, damit diese rechtzeitig über den Arbeitsfortschritt informiert sind.

Es können mehrere CC-Knoten in einem Workflow eingerichtet werden, um die relevanten Informationen an die angegebenen Empfänger zu senden, wenn der Workflow diesen Knoten erreicht.

Die CC-Inhalte werden im Menü „An mich gesendet (CC)“ des Aufgaben-Centers angezeigt, wo Benutzer alle an sie gesendeten Inhalte einsehen können. Basierend auf dem Ungelesen-Status werden Benutzer auf noch nicht gesehene CC-Inhalte hingewiesen; nach dem Ansehen können Benutzer diese aktiv als gelesen markieren.

## Knoten erstellen

Klicken Sie in der Workflow-Konfigurationsoberfläche auf die Plus-Schaltfläche („+“) im Workflow, um einen „CC“-Knoten hinzuzufügen:

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Knotenkonfiguration

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

In der Knotenkonfigurationsoberfläche können die folgenden Parameter eingestellt werden:

### Empfänger

Empfänger sind die Sammlung der Zielbenutzer für die Kopie, was ein oder mehrere Benutzer sein können. Die Quelle der Auswahl kann ein statischer Wert aus der Benutzerliste, ein durch eine Variable angegebener dynamischer Wert oder das Ergebnis einer Abfrage der Benutzer-Tabelle sein.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Benutzeroberfläche

Empfänger müssen die CC-Inhalte im Menü „An mich gesendet (CC)“ des Aufgaben-Centers einsehen. Sie können Ergebnisse des Triggers und beliebiger Knoten im Workflow-Kontext als Inhaltsblöcke konfigurieren.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Aufgabenkarte <Badge>2.0+</Badge>

Kann verwendet werden, um die Aufgabenkarte in der Liste „An mich gesendet (CC)“ im Aufgaben-Center zu konfigurieren.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

In der Karte können die anzuzeigenden Geschäftsfelder frei konfiguriert werden (außer Beziehungsfelder).

Nachdem die Workflow-CC-Aufgabe erstellt wurde, ist die benutzerdefinierte Aufgabenkarte in der Liste des Aufgaben-Centers sichtbar:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Aufgabentitel

Der Aufgabentitel ist der im Aufgaben-Center angezeigte Titel. Sie können Variablen aus dem Workflow-Kontext verwenden, um den Titel dynamisch zu generieren.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Aufgaben-Center

Benutzer können im Aufgaben-Center alle an sie gesendeten Inhalte einsehen und verwalten sowie basierend auf dem Lesestatus filtern und ansehen.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Nach dem Ansehen können Sie die Inhalte als gelesen markieren, woraufhin die Anzahl der ungelesenen Elemente entsprechend abnimmt.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)