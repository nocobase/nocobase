---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/workflow/triggers/approval).
:::

# Genehmigung

## Einführung

Die Genehmigung ist eine Prozessform, die speziell für die manuelle Initiierung und Bearbeitung durch Personen entwickelt wurde, um den Status relevanter Daten zu bestimmen. Sie wird üblicherweise für die Prozessverwaltung in der Büroautomation oder bei anderen manuellen Entscheidungsprozessen eingesetzt. Beispielsweise können Sie manuelle Workflows für Szenarien wie „Urlaubsanträge“, „Spesenabrechnungen“ und „Genehmigungen für den Rohstoffeinkauf“ erstellen und verwalten.

Das Genehmigungs-Plugin bietet einen speziellen Workflow-Typ (Trigger) „Genehmigung (Ereignis)“ und einen dedizierten „Genehmigungs“-Knoten für diesen Prozess. In Kombination mit den einzigartigen benutzerdefinierten Sammlungen und benutzerdefinierten Blöcken von NocoBase können Sie schnell und flexibel verschiedene Genehmigungsszenarien erstellen und verwalten.

## Workflow erstellen

Wählen Sie beim Erstellen eines Workflows den Typ „Genehmigung“, um einen Genehmigungs-Workflow zu erstellen:

![审批触发器_创建审批流程](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Danach klicken Sie in der Workflow-Konfigurationsoberfläche auf den Trigger, um ein Dialogfenster für weitere Konfigurationen zu öffnen.

## Trigger-Konfiguration

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Sammlung binden

Das Genehmigungs-Plugin von NocoBase basiert auf einem flexiblen Design und kann mit jeder benutzerdefinierten Sammlung verwendet werden. Das bedeutet, dass die Genehmigungskonfiguration das Datenmodell nicht neu konfigurieren muss, sondern eine bestehende Sammlung direkt wiederverwendet. Daher müssen Sie nach dem Aufrufen der Trigger-Konfiguration zuerst eine Sammlung auswählen, um zu bestimmen, für welche Sammlung der Prozess durchgeführt werden soll:

![审批触发器_触发器配置_选择数据表](https://static-docs.nocobase.com/20251226103223.png)

### Trigger-Methode

Beim Initiieren einer Genehmigung für Geschäftsdaten können Sie zwischen den folgenden zwei Trigger-Methoden wählen:

*   **Vor dem Speichern der Daten**

    Initiiert die Genehmigung, bevor die übermittelten Daten gespeichert werden. Dies eignet sich für Szenarien, in denen Daten erst nach erfolgter Genehmigung offiziell gespeichert werden sollen. In diesem Modus sind die Daten zum Zeitpunkt der Initiierung nur temporär und werden erst nach der Genehmigung offiziell in der entsprechenden Sammlung gespeichert.

*   **Nach dem Speichern der Daten**

    Initiiert die Genehmigung, nachdem die übermittelten Daten gespeichert wurden. Dies eignet sich für Szenarien, in denen Daten zuerst gespeichert und anschließend genehmigt werden können. In diesem Modus sind die Daten bereits in der Sammlung gespeichert, wenn die Genehmigung beginnt, und alle während des Genehmigungsprozesses vorgenommenen Änderungen werden ebenfalls gespeichert.

### Ort der Genehmigungsinitiierung

Sie können wählen, an welcher Stelle im System die Genehmigung initiiert werden kann:

*   **Nur in Datenblöcken initiieren**

    Sie können die Aktion eines beliebigen Formularblocks dieser Sammlung an den Workflow binden, um Genehmigungen zu initiieren. Der Prozess kann im Genehmigungsblock eines einzelnen Datensatzes bearbeitet und verfolgt werden. Dies eignet sich in der Regel für Geschäftsdaten.

*   **Sowohl in Datenblöcken als auch im Aufgaben-Center initiieren**

    Zusätzlich zu den Datenblöcken können Genehmigungen auch im globalen Aufgaben-Center initiiert und bearbeitet werden. Dies eignet sich in der Regel für administrative Daten.

### Wer kann die Genehmigung initiieren

Sie können Berechtigungen basierend auf dem Benutzerbereich konfigurieren, um zu bestimmen, welche Benutzer die Genehmigung initiieren dürfen:

*   **Alle Benutzer**

    Alle Benutzer im System können die Genehmigung initiieren.

*   **Nur ausgewählte Benutzer**

    Nur Benutzern innerhalb des festgelegten Bereichs ist es gestattet, die Genehmigung zu initiieren. Mehrfachauswahl ist möglich.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Konfiguration der Formularoberfläche des Initiators

Zuletzt müssen Sie die Formularoberfläche des Initiators konfigurieren. Diese Oberfläche wird für Übermittlungsaktionen verwendet, wenn eine Genehmigung über den Block des Genehmigungs-Centers initiiert oder nach einem Widerruf erneut eingeleitet wird. Klicken Sie auf die Schaltfläche „Konfigurieren“, um das Dialogfenster zu öffnen:

![审批触发器_触发器配置_发起人表单](https://static-docs.nocobase.com/20251226130239.png)

Sie können der Oberfläche des Initiators ein Ausfüllformular hinzufügen, das auf der gebundenen Sammlung basiert, oder beschreibenden Text (Markdown) für Hinweise und Anleitungen. Das Hinzufügen eines Formularblocks ist zwingend erforderlich; andernfalls kann der Initiator nach dem Aufrufen dieser Oberfläche keine Aktionen ausführen.

Nach dem Hinzufügen eines Formularblocks können Sie, wie in einer normalen Formular-Konfigurationsoberfläche, entsprechende Feldkomponenten aus der Sammlung hinzufügen und diese beliebig anordnen, um die auszufüllenden Inhalte zu organisieren:

![审批触发器_触发器配置_发起人表单_字段配置](https://static-docs.nocobase.com/20251226130339.png)

Zusätzlich zur Schaltfläche für die direkte Übermittlung können Sie auch eine Aktionsschaltfläche „Als Entwurf speichern“ hinzufügen, um temporäre Speicherprozesse zu unterstützen:

![审批触发器_触发器配置_发起人表单_操作配置_保存](https://static-docs.nocobase.com/20251226130512.png)

Wenn ein Genehmigungs-Workflow es dem Initiator erlaubt, den Antrag zurückzuziehen, müssen Sie in der Konfiguration der Initiator-Oberfläche die Schaltfläche „Zurückziehen“ aktivieren:

![审批触发器_触发器配置_允许撤回](https://static-docs.nocobase.com/20251226130637.png)

Nach der Aktivierung kann eine durch diesen Workflow initiierte Genehmigung vom Initiator zurückgezogen werden, bevor ein Genehmiger sie bearbeitet hat. Nachdem jedoch ein Genehmiger in einem nachfolgenden Genehmigungsknoten die Bearbeitung vorgenommen hat, kann der Antrag nicht mehr zurückgezogen werden.

:::info{title=Hinweis}
Nach dem Aktivieren oder Löschen der Schaltfläche „Zurückziehen“ müssen Sie im Dialogfenster der Trigger-Konfiguration auf „Speichern“ klicken, damit die Änderungen wirksam werden.
:::

### Karte „Mein Antrag“ <Badge>2.0+</Badge>

Kann verwendet werden, um die Aufgabenkarten in der Liste „Meine Anträge“ des Aufgaben-Centers zu konfigurieren.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

In der Karte können Sie die Geschäftsfelder (außer Beziehungsfelder) oder genehmigungsbezogene Informationen, die Sie anzeigen möchten, frei konfigurieren.

Nachdem der Genehmigungsantrag erstellt wurde, ist die benutzerdefinierte Aufgabenkarte in der Liste des Aufgaben-Centers sichtbar:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Anzeigemodus für Datensätze im Workflow

*   **Snapshot**

    Der Zustand des Datensatzes, den der Antragsteller und die Genehmiger beim Aufrufen sehen. Nach der Übermittlung sehen sie nur die von ihnen selbst geänderten Datensätze – sie sehen keine Aktualisierungen, die später von anderen vorgenommen wurden.

*   **Aktuell**

    Der Antragsteller und die Genehmiger sehen während des gesamten Prozesses immer die aktuellste Version des Datensatzes, unabhängig davon, in welchem Zustand sich der Datensatz vor ihrer Aktion befand. Nach Abschluss des Prozesses sehen sie die endgültige Version des Datensatzes.

## Genehmigungsknoten

In einem Genehmigungs-Workflow müssen Sie den speziellen „Genehmigungs“-Knoten verwenden, um die Betriebslogik für Genehmiger zu konfigurieren, damit diese die initiierte Genehmigung bearbeiten (genehmigen, ablehnen oder zurücksenden) können. Der „Genehmigungs“-Knoten kann nur in Genehmigungs-Workflows verwendet werden. Weitere Details finden Sie unter [Genehmigungsknoten](../nodes/approval.md).

:::info{title=Hinweis}
Wenn ein Genehmigungs-Workflow keinen „Genehmigungs“-Knoten enthält, wird dieser Workflow automatisch genehmigt.
:::

## Genehmigungsinitiierung konfigurieren

Nachdem Sie einen Genehmigungs-Workflow konfiguriert und aktiviert haben, können Sie diesen Workflow an die Schaltfläche zum Übermitteln des Formulars der entsprechenden Sammlung binden, damit Benutzer bei der Übermittlung eine Genehmigung initiieren können:

![发起审批_绑定工作流](https://static-docs.nocobase.com/20251226110710.png)

Danach löst die Übermittlung dieses Formulars durch einen Benutzer den entsprechenden Genehmigungs-Workflow aus. Die übermittelten Daten werden nicht nur in der entsprechenden Sammlung gespeichert, sondern auch als Snapshot im Genehmigungs-Workflow abgelegt, damit sie von nachfolgenden Genehmigern eingesehen werden können.

:::info{title=Hinweis}
Die Schaltfläche zum Initiieren einer Genehmigung unterstützt derzeit nur die Schaltfläche „Übermitteln“ (oder „Speichern“) in einem Erstellungs- oder Aktualisierungsformular. Sie unterstützt nicht die Schaltfläche „Workflow auslösen“ (diese Schaltfläche kann nur an „Benutzerdefinierte Aktionsereignisse“ gebunden werden).
:::

## Aufgaben-Center

Das Aufgaben-Center bietet einen einheitlichen Zugangspunkt, über den Benutzer Aufgaben einsehen und bearbeiten können. Vom aktuellen Benutzer initiierte Genehmigungen und ausstehende Aufgaben können über das Aufgaben-Center in der oberen Symbolleiste aufgerufen werden, und verschiedene Arten von Aufgaben können über die linke Navigationsleiste eingesehen werden.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Von mir initiiert

#### Initiierte Genehmigungen anzeigen

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Eine neue Genehmigung direkt initiieren

![20250310161658](https://static-docs.nocobase.com/20250310161658