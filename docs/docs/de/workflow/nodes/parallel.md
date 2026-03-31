---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Parallele Verzweigung

Der Parallele Verzweigungsknoten kann einen Workflow in mehrere Zweige aufteilen. Jeder Zweig kann mit unterschiedlichen Knoten konfiguriert werden, und die Ausführung der Zweige variiert je nach Modus. Verwenden Sie den Parallele Verzweigungsknoten, wenn Sie mehrere Aktionen gleichzeitig ausführen müssen.

## Installation

Integriertes Plugin, keine Installation erforderlich.

## Knoten erstellen

In der Workflow-Konfigurationsoberfläche klicken Sie auf das Plus-Symbol („+“) im Workflow, um einen „Parallele Verzweigung“-Knoten hinzuzufügen:

![Parallele Verzweigung hinzufügen](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Nachdem Sie einen Parallele Verzweigungsknoten zum Workflow hinzugefügt haben, werden standardmäßig zwei Unterzweige hinzugefügt. Sie können auch beliebig viele weitere Zweige hinzufügen, indem Sie auf die Schaltfläche zum Hinzufügen von Zweigen klicken. Jedem Zweig können beliebig viele Knoten hinzugefügt werden. Nicht benötigte Zweige können Sie durch Klicken auf die Löschschaltfläche am Anfang des Zweigs entfernen.

![Parallele Zweige verwalten](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Knotenkonfiguration

### Zweigmodus

Der Parallele Verzweigungsknoten verfügt über die folgenden drei Modi:

- **Alle erfolgreich**: Der Workflow setzt die Ausführung der nachfolgenden Knoten erst fort, wenn alle Zweige erfolgreich abgeschlossen wurden. Andernfalls, wenn ein Zweig vorzeitig beendet wird (sei es aufgrund eines Fehlers, einer Störung oder eines anderen nicht erfolgreichen Zustands), wird der gesamte Parallele Verzweigungsknoten mit diesem Status vorzeitig beendet. Dies wird auch als „All-Modus“ bezeichnet.
- **Beliebig erfolgreich**: Der Workflow setzt die Ausführung der nachfolgenden Knoten fort, sobald ein beliebiger Zweig erfolgreich abgeschlossen wurde. Der gesamte Parallele Verzweigungsknoten wird nur dann vorzeitig beendet, wenn *alle* Zweige vorzeitig beendet werden (sei es aufgrund eines Fehlers, einer Störung oder eines anderen nicht erfolgreichen Zustands). Dies wird auch als „Any-Modus“ bezeichnet.
- **Beliebig erfolgreich oder fehlgeschlagen**: Der Workflow setzt die Ausführung der nachfolgenden Knoten fort, sobald ein beliebiger Zweig erfolgreich abgeschlossen wurde. Wenn jedoch ein beliebiger Knoten fehlschlägt, wird die gesamte parallele Verzweigung mit diesem Status vorzeitig beendet. Dies wird auch als „Race-Modus“ bezeichnet.

Unabhängig vom Modus wird jeder Zweig der Reihe nach von links nach rechts ausgeführt, bis die Bedingungen des voreingestellten Zweigmodus erfüllt sind. Danach wird entweder die Ausführung der nachfolgenden Knoten fortgesetzt oder der Prozess vorzeitig beendet.

## Beispiel

Siehe das Beispiel im [Verzögerungsknoten](./delay.md).