---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Workflow-Ausgabe

## Einführung

Der „Workflow-Ausgabe“-Knoten dient dazu, in einem aufgerufenen Workflow dessen Ausgabewert zu definieren. Wenn ein Workflow von einem anderen aufgerufen wird, können Sie über den „Workflow-Ausgabe“-Knoten einen Wert an den Aufrufer zurückgeben.

## Knoten erstellen

Fügen Sie im aufgerufenen Workflow einen „Workflow-Ausgabe“-Knoten hinzu:

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Knoten konfigurieren

### Ausgabewert

Geben Sie eine Variable als Ausgabewert ein oder wählen Sie eine aus. Der Ausgabewert kann von beliebigem Typ sein, zum Beispiel eine Konstante (wie eine Zeichenkette, Zahl, ein boolescher Wert, Datum oder benutzerdefiniertes JSON) oder eine andere Variable aus dem Workflow.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Tipp}
Wenn Sie einem aufgerufenen Workflow mehrere „Workflow-Ausgabe“-Knoten hinzufügen, wird beim Aufruf des Workflows der Wert des zuletzt ausgeführten „Workflow-Ausgabe“-Knotens ausgegeben.
:::