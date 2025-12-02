---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# CC <Badge>v1.8.2+</Badge>

## Einführung

Der CC-Knoten ermöglicht es Ihnen, bestimmte Kontextinhalte aus der Ausführung eines Workflows an ausgewählte Benutzer zu senden, damit diese informiert sind und die Inhalte einsehen können. Zum Beispiel können in einem Genehmigungs- oder anderen Prozess relevante Informationen an andere Beteiligte gesendet werden, damit diese jederzeit über den Arbeitsfortschritt informiert sind.

Sie können mehrere CC-Knoten in einem Workflow einrichten. Wenn der Workflow diesen Knoten erreicht, werden die relevanten Informationen an die festgelegten Empfänger gesendet.

Die CC-Inhalte werden im Menü „An mich gesendet (CC)“ des Aufgaben-Centers angezeigt, wo Benutzer alle an sie gesendeten Inhalte einsehen können. Es wird auch der Status ungelesener Inhalte angezeigt, um Benutzer auf noch nicht gesehene CC-Inhalte hinzuweisen. Nach dem Ansehen können Benutzer diese manuell als gelesen markieren.

## Knoten erstellen

In der Workflow-Konfigurationsoberfläche klicken Sie auf das Plus-Symbol („+“) im Workflow, um einen „CC“-Knoten hinzuzufügen:

![CC-Knoten hinzufügen](https://static-docs.nocobase.com/20250710222842.png)

## Knotenkonfiguration

![Knotenkonfiguration](https://static-docs.nocobase.com/20250710224041.png)

In der Knotenkonfigurationsoberfläche können Sie die folgenden Parameter einstellen:

### Empfänger

Die Empfänger sind eine Sammlung von Benutzern, an die die Kopie gesendet wird; es kann sich um einen oder mehrere Benutzer handeln. Die Quelle der Auswahl kann ein statischer Wert sein, der aus der Benutzerliste ausgewählt wird, ein dynamischer Wert, der durch eine Variable festgelegt wird, oder das Ergebnis einer Abfrage der Benutzer-Sammlung sein.

![Empfängerkonfiguration](https://static-docs.nocobase.com/20250710224421.png)

### Benutzeroberfläche

Empfänger müssen die CC-Inhalte im Menü „An mich gesendet (CC)“ des Aufgaben-Centers einsehen. Sie können die Ergebnisse des Triggers und beliebiger Knoten im Workflow-Kontext als Inhaltsblöcke konfigurieren.

![Benutzeroberfläche](https://static-docs.nocobase.com/20250710225400.png)

### Aufgaben-Titel

Der Aufgaben-Titel ist der im Aufgaben-Center angezeigte Titel. Sie können Variablen aus dem Workflow-Kontext verwenden, um den Titel dynamisch zu generieren.

![Aufgaben-Titel](https://static-docs.nocobase.com/20250710225603.png)

## Aufgaben-Center

Benutzer können im Aufgaben-Center alle an sie gesendeten Inhalte einsehen und verwalten sowie diese nach dem Lesestatus filtern und anzeigen.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Nach dem Ansehen können Sie die Inhalte als gelesen markieren, woraufhin die Anzahl der ungelesenen Elemente entsprechend abnimmt.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)