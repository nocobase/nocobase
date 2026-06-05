---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Workflow aufrufen

## Einführung

Mit dieser Funktion können Sie andere Workflows innerhalb eines Workflows aufrufen. Dabei können Sie Variablen des aktuellen Workflows als Eingabe für den Unter-Workflow verwenden und die Ausgabe des Unter-Workflows als Variablen im aktuellen Workflow für nachfolgende Knoten nutzen.

Der Prozess des Workflow-Aufrufs ist in der folgenden Abbildung dargestellt:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Indem Sie Workflows aufrufen, können Sie gängige Prozesslogiken wiederverwenden, wie zum Beispiel das Senden von E-Mails oder SMS. Alternativ können Sie einen komplexen Workflow in mehrere Unter-Workflows aufteilen, um die Verwaltung und Wartung zu erleichtern.

Im Wesentlichen unterscheidet ein Workflow nicht, ob ein Prozess ein Unter-Workflow ist. Jeder Workflow kann als Unter-Workflow von anderen Workflows aufgerufen werden und selbst andere Workflows aufrufen. Alle Workflows sind gleichberechtigt; es besteht lediglich eine Aufruf- und Aufgerufenen-Beziehung.

Ebenso findet die Verwendung des Workflow-Aufrufs an zwei Stellen statt:

1. Im Haupt-Workflow: Als aufrufende Instanz ruft er über den Knoten „Workflow aufrufen“ andere Workflows auf.
2. Im Unter-Workflow: Als aufgerufene Instanz speichert er über den Knoten „Workflow-Ausgabe“ die Variablen, die aus dem aktuellen Workflow ausgegeben werden sollen. Diese können dann von nachfolgenden Knoten in dem Workflow verwendet werden, der ihn aufgerufen hat.

## Knoten erstellen

Klicken Sie in der Workflow-Konfigurationsoberfläche auf das Plus-Symbol („+“) im Workflow, um einen Knoten „Workflow aufrufen“ hinzuzufügen:

![Add Invoke Workflow Node](https://static-docs.nocobase.com/20241230001323.png)

## Knoten konfigurieren

### Workflow auswählen

Wählen Sie den aufzurufenden Workflow aus. Sie können das Suchfeld für eine schnelle Suche verwenden:

![Select Workflow](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Tipp}
* Nicht aktivierte Workflows können ebenfalls als Unter-Workflows aufgerufen werden.
* Wenn der aktuelle Workflow im synchronen Modus ist, kann er nur Unter-Workflows aufrufen, die ebenfalls im synchronen Modus sind.
:::

### Workflow-Trigger-Variablen konfigurieren

Nachdem Sie einen Workflow ausgewählt haben, müssen Sie auch die Variablen des Triggers als Eingabedaten für den Unter-Workflow konfigurieren. Sie können direkt statische Daten auswählen oder Variablen aus dem aktuellen Workflow wählen:

![Configure Trigger Variables](https://static-docs.nocobase.com/20241230162722.png)

Verschiedene Trigger-Typen erfordern unterschiedliche Variablen, die je nach Bedarf im Formular konfiguriert werden können.

## Workflow-Ausgabe-Knoten

Beziehen Sie sich auf den Inhalt des Knotens [Workflow-Ausgabe](./output.md), um die Ausgabevariablen des Unter-Workflows zu konfigurieren.

## Workflow-Ausgabe verwenden

Zurück im Haupt-Workflow, in anderen Knoten unterhalb des Knotens „Workflow aufrufen“, können Sie das Ergebnis des Knotens „Workflow aufrufen“ auswählen, wenn Sie den Ausgabewert des Unter-Workflows verwenden möchten. Wenn der Unter-Workflow einen einfachen Wert ausgibt, wie einen String, eine Zahl, einen Booleschen Wert oder ein Datum (Datum ist ein String im UTC-Format), kann dieser direkt verwendet werden. Handelt es sich um ein komplexes Objekt (z. B. ein Objekt aus einer Sammlung), muss es zuerst über einen JSON-Parse-Knoten gemappt werden, bevor seine Eigenschaften verwendet werden können; andernfalls kann es nur als ganzes Objekt verwendet werden.

Wenn der Unter-Workflow keinen Workflow-Ausgabe-Knoten konfiguriert hat oder keinen Ausgabewert liefert, erhalten Sie bei der Verwendung des Ergebnisses des Knotens „Workflow aufrufen“ im Haupt-Workflow lediglich einen Nullwert (`null`).