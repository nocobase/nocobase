---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Variable

## Einführung

Sie können in einem Workflow Variablen deklarieren oder bereits deklarierten Variablen Werte zuweisen. Dies wird typischerweise verwendet, um temporäre Daten innerhalb des Workflows zu speichern.

## Knoten erstellen

Im Konfigurationsbereich des Workflows klicken Sie auf das Plus-Symbol („+“) im Workflow, um einen „Variablen“-Knoten hinzuzufügen:

![Variablen-Knoten hinzufügen](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Knoten konfigurieren

### Modus

Ein Variablen-Knoten ähnelt Variablen in der Programmierung: Er muss zuerst deklariert werden, bevor er verwendet und ihm ein Wert zugewiesen werden kann. Daher müssen Sie beim Erstellen eines Variablen-Knotens dessen Modus auswählen. Es stehen zwei Modi zur Verfügung:

![Modus auswählen](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- **Neue Variable deklarieren:** Erstellt eine neue Variable.
- **Einer bestehenden Variable einen Wert zuweisen:** Weist einer Variable, die zuvor im Workflow deklariert wurde, einen Wert zu. Dies entspricht einer Änderung des Variablenwerts.

Wenn der zu erstellende Knoten der erste Variablen-Knoten im Workflow ist, können Sie nur den Deklarationsmodus auswählen, da zu diesem Zeitpunkt noch keine Variablen zur Zuweisung verfügbar sind.

Wenn Sie einer deklarierten Variable einen Wert zuweisen möchten, müssen Sie auch die Zielvariable auswählen, d. h. den Knoten, in dem die Variable deklariert wurde:

![Variable zur Zuweisung auswählen](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Wert

Der Wert einer Variable kann von beliebigem Typ sein. Es kann sich um eine Konstante handeln, z. B. eine Zeichenkette, eine Zahl, einen Booleschen Wert oder ein Datum, oder um eine andere Variable aus dem Workflow.

Im Deklarationsmodus entspricht das Festlegen des Variablenwerts der Zuweisung eines Initialwerts zur Variable.

![Initialwert deklarieren](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)

Im Zuweisungsmodus entspricht das Festlegen des Variablenwerts der Änderung des Werts der deklarierten Zielvariable auf einen neuen Wert. Bei nachfolgenden Verwendungen wird dieser neue Wert abgerufen.

![Einer deklarierten Variable einen Trigger-Variablenwert zuweisen](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Den Wert einer Variable verwenden

In nachfolgenden Knoten nach dem Variablen-Knoten können Sie den Wert der Variable verwenden, indem Sie die deklarierte Variable aus der Gruppe „Knotenvariablen“ auswählen. Zum Beispiel können Sie in einem Abfrage-Knoten den Variablenwert als Abfragebedingung nutzen:

![Variablenwert als Abfragefilterbedingung verwenden](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Beispiel

Ein nützlicheres Szenario für Variablen-Knoten sind Verzweigungen, in denen neue Werte mit vorherigen Werten berechnet oder zusammengeführt werden (ähnlich wie `reduce`/`concat` in der Programmierung) und dann nach Beendigung der Verzweigung verwendet werden. Im Folgenden wird ein Beispiel gezeigt, wie Sie eine Empfängerzeichenkette mithilfe einer Schleifenverzweigung und eines Variablen-Knotens zusammenfügen können.

Erstellen Sie zunächst einen Sammlungs-getriggerten Workflow, der ausgelöst wird, wenn „Artikel“-Daten aktualisiert werden, und laden Sie die zugehörigen „Autor“-Beziehungsdaten vorab (um die Empfänger zu erhalten):

![Trigger konfigurieren](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Erstellen Sie anschließend einen Variablen-Knoten, um die Empfängerzeichenkette zu speichern:

![Empfänger-Variablen-Knoten](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Erstellen Sie als Nächstes einen Schleifenverzweigungs-Knoten, um die Autoren des Artikels zu durchlaufen und deren Empfängerinformationen in der Empfänger-Variable zusammenzufügen:

![Autoren im Artikel durchlaufen](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Innerhalb der Schleifenverzweigung erstellen Sie zuerst einen Berechnungs-Knoten, um den aktuellen Autor mit der bereits gespeicherten Autorenzeichenkette zu verketten:

![Empfängerzeichenkette verketten](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Nach dem Berechnungs-Knoten erstellen Sie einen weiteren Variablen-Knoten. Wählen Sie den Zuweisungsmodus, den Empfänger-Variablen-Knoten als Zuweisungsziel und das Ergebnis des Berechnungs-Knotens als Wert aus:

![Die verkettete Empfängerzeichenkette dem Empfänger-Knoten zuweisen](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

Auf diese Weise speichert die Empfänger-Variable nach Abschluss der Schleifenverzweigung die Empfängerzeichenkette aller Autoren des Artikels. Anschließend können Sie nach der Schleife einen HTTP-Anfrage-Knoten verwenden, um eine E-Mail-Sende-API aufzurufen und den Wert der Empfänger-Variable als Empfängerparameter an die API zu übergeben:

![E-Mails an Empfänger über den Anfrage-Knoten senden](https://static-docs.nocobase.com/37f71aa1a63e172bcb2dce10a250947e.png)

Damit ist eine einfache Massen-E-Mail-Funktion mithilfe einer Schleife und eines Variablen-Knotens implementiert.