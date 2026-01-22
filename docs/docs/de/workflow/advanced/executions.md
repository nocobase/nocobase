:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Ausführungsplan (Verlauf)

Nach dem Auslösen eines Workflows wird ein entsprechender Ausführungsplan erstellt, um den Ausführungsprozess dieser Aufgabe zu verfolgen. Jeder Ausführungsplan besitzt einen Statuswert, der den aktuellen Ausführungsstatus anzeigt. Dieser Status ist sowohl in der Liste als auch in den Details des Ausführungsverlaufs sichtbar:

![Execution Plan Status](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Wenn alle Knoten im Hauptprozesszweig mit dem Status „Abgeschlossen“ das Ende des Workflows erreichen, wird der gesamte Ausführungsplan mit dem Status „Abgeschlossen“ beendet. Erreicht ein Knoten im Hauptprozesszweig einen Endstatus wie „Fehlgeschlagen“, „Fehler“, „Abgebrochen“ oder „Abgelehnt“, wird der gesamte Ausführungsplan mit dem entsprechenden Status **vorzeitig beendet**. Wenn ein Knoten im Hauptprozesszweig den Status „Wartend“ annimmt, wird der gesamte Ausführungsplan angehalten, zeigt aber weiterhin den Status „Wird ausgeführt“ an, bis der wartende Knoten fortgesetzt wird. Verschiedene Knotentypen behandeln den Wartestatus unterschiedlich. Ein manueller Knoten muss beispielsweise auf eine manuelle Bearbeitung warten, während ein Verzögerungsknoten warten muss, bis die angegebene Zeit abgelaufen ist, bevor er fortgesetzt wird.

Die Status eines Ausführungsplans sind in der folgenden Tabelle aufgeführt:

| Status            | Entsprechender Status des zuletzt ausgeführten Knotens im Hauptprozess | Bedeutung                                                                                             |
| :---------------- | :--------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| In Warteschlange  | -                                                    | Der Workflow wurde ausgelöst und ein Ausführungsplan erstellt, der in der Warteschlange auf die Planung durch den Scheduler wartet. |
| Wird ausgeführt   | Wartend                                              | Der Knoten erfordert eine Pause und wartet auf weitere Eingaben oder einen Callback zur Fortsetzung.  |
| Abgeschlossen     | Abgeschlossen                                        | Es wurden keine Probleme festgestellt, und alle Knoten wurden wie erwartet nacheinander ausgeführt.   |
| Fehlgeschlagen    | Fehlgeschlagen                                       | Fehlgeschlagen, da die Knotenkonfiguration nicht erfüllt wurde.                                        |
| Fehler            | Fehler                                               | Der Knoten ist auf einen unbehandelten Programmfehler gestoßen und wurde vorzeitig beendet.           |
| Abgebrochen       | Abgebrochen                                          | Ein wartender Knoten wurde vom Workflow-Administrator extern abgebrochen und vorzeitig beendet.        |
| Abgelehnt         | Abgelehnt                                            | Bei einem manuell bearbeiteten Knoten wurde die Fortsetzung des nachfolgenden Prozesses manuell abgelehnt. |

Im Beispiel unter [Schnellstart](../getting-started.md) haben wir bereits gelernt, dass wir durch die Anzeige der Details des Ausführungsverlaufs eines Workflows überprüfen können, ob alle Knoten ordnungsgemäß ausgeführt wurden, sowie den Ausführungsstatus und die Ergebnisdaten jedes ausgeführten Knotens einsehen können. Bei einigen fortgeschrittenen Workflows und Knoten kann ein Knoten auch mehrere Ergebnisse liefern, wie zum Beispiel die Ergebnisse eines Schleifenknotens:

![Node results from multiple executions](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Tipp}
Workflows können gleichzeitig ausgelöst werden, werden aber nacheinander in einer Warteschlange ausgeführt. Selbst wenn mehrere Workflows gleichzeitig ausgelöst werden, werden sie einzeln und nicht parallel ausgeführt. Ein Status „In Warteschlange“ bedeutet daher, dass andere Workflows gerade ausgeführt werden und gewartet werden muss.

Der Status „Wird ausgeführt“ bedeutet lediglich, dass der Ausführungsplan gestartet wurde und in der Regel aufgrund des Wartestatus eines internen Knotens pausiert ist. Er bedeutet nicht, dass dieser Ausführungsplan die Ausführungsressourcen am Anfang der Warteschlange belegt hat. Daher können, auch wenn ein Ausführungsplan den Status „Wird ausgeführt“ hat, andere Ausführungspläne „In Warteschlange“ weiterhin zur Ausführung eingeplant werden.
:::

## Knotenausführungsstatus

Der Status eines Ausführungsplans wird durch die Ausführung jedes einzelnen Knotens bestimmt. In einem Ausführungsplan, der nach einem Trigger erstellt wurde, erzeugt jeder Knoten nach seiner Ausführung einen Status, der wiederum festlegt, ob der nachfolgende Prozess fortgesetzt wird. Im Normalfall wird nach erfolgreicher Ausführung eines Knotens der nächste Knoten ausgeführt, bis alle Knoten nacheinander abgeschlossen oder der Prozess unterbrochen wird. Bei der Begegnung mit flusskontrollbezogenen Knoten, wie Verzweigungen, Schleifen, parallelen Zweigen oder Verzögerungen, wird der Ausführungsfluss zum nächsten Knoten basierend auf den in der Konfiguration des Knotens festgelegten Bedingungen und den Laufzeitkontextdaten bestimmt.

Die möglichen Status eines Knotens nach der Ausführung sind in der folgenden Tabelle aufgeführt:

| Status          | Ist Endzustand | Wird vorzeitig beendet | Bedeutung                                                                                             |
| :-------------- | :------------: | :-------------------: | :---------------------------------------------------------------------------------------------------- |
| Wartend         |       Nein     |          Nein         | Der Knoten erfordert eine Pause und wartet auf weitere Eingaben oder einen Callback zur Fortsetzung.  |
| Abgeschlossen   |       Ja       |          Nein         | Es wurden keine Probleme festgestellt, erfolgreich ausgeführt und wird bis zum Ende mit dem nächsten Knoten fortgesetzt. |
| Fehlgeschlagen  |       Ja       |          Ja           | Fehlgeschlagen, da die Knotenkonfiguration nicht erfüllt wurde.                                        |
| Fehler          |       Ja       |          Ja           | Der Knoten ist auf einen unbehandelten Programmfehler gestoßen und wurde vorzeitig beendet.           |
| Abgebrochen     |       Ja       |          Ja           | Ein wartender Knoten wurde vom Workflow-Administrator extern abgebrochen und vorzeitig beendet.        |
| Abgelehnt       |       Ja       |          Ja           | Bei einem manuell bearbeiteten Knoten wurde die Fortsetzung des nachfolgenden Prozesses manuell abgelehnt. |

Mit Ausnahme des Status „Wartend“ sind alle anderen Status Endzustände für die Knotenausführung. Nur wenn der Endzustand „Abgeschlossen“ ist, wird der Prozess fortgesetzt; andernfalls wird die gesamte Workflow-Ausführung vorzeitig beendet. Befindet sich ein Knoten in einem Verzweigungsfluss (parallele Verzweigung, Bedingung, Schleife usw.), wird der durch die Knotenausführung erzeugte Endzustand von dem Knoten übernommen, der die Verzweigung initiiert hat, und dies bestimmt den weiteren Fluss des gesamten Workflows.

Wenn wir beispielsweise einen Bedingungsknoten im Modus „‚Ja‘ zum Fortfahren“ verwenden und das Ergebnis während der Ausführung „Nein“ ist, wird der gesamte Workflow vorzeitig mit dem Status „Fehlgeschlagen“ beendet, und nachfolgende Knoten werden nicht mehr ausgeführt, wie in der Abbildung unten dargestellt:

![Node execution failed](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Tipp}
Alle Endzustände außer „Abgeschlossen“ können als Fehler betrachtet werden, die Gründe für das Scheitern sind jedoch unterschiedlich. Sie können die Ausführungsergebnisse des Knotens einsehen, um die Ursache des Fehlers genauer zu verstehen.
:::