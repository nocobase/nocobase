# Erweiterte Konfiguration

## Timeout-Einstellungen

Ab Version `2.1.0` unterstützen Workflows Timeout-Einstellungen, um die maximale Dauer einer einzelnen Ausführung vom Beginn der Verarbeitung bis zum Ende zu begrenzen. Timeout-Einstellungen eignen sich, um zu verhindern, dass Workflows aufgrund langer Laufzeiten, wartender manueller Bearbeitung oder wartender externer Rückrufe dauerhaft Ausführungsressourcen belegen.

Öffnen Sie im Dialog zum Erstellen oder Bearbeiten eines Workflows die „Erweiterten Optionen“, um die „Timeout-Einstellungen“ zu konfigurieren:

![20260604212454](https://static-docs.nocobase.com/20260604212454.png)

Die verfügbaren Optionen sind:

- Geben Sie `0` ein, um keine Timeout-Begrenzung festzulegen (Standardwert).
- Geben Sie einen Wert größer als `0` ein, um die Timeout-Begrenzung zu aktivieren. In der Oberfläche können Sekunden, Minuten, Stunden und Tage als Einheit ausgewählt werden.
- Die maximale Timeout-Dauer beträgt 180 Tage.

### Zeitmessung

Die Timeout-Zeit beginnt zu laufen, wenn der Workflow zum ersten Mal in einen Prozessor eintritt. Nachdem ein Workflow ausgelöst wurde, zählt die Zeit, in der er noch in der Warteschlange auf die Planung wartet oder für einen verzögerten Start zwischengespeichert ist, nicht zum Timeout.

Nach dem Eintritt in einen Prozessor läuft die Timeout-Zeit kontinuierlich weiter. Dazu gehören die tatsächliche Ausführungszeit von Knoten sowie die Zeit von Knoten, die sich bereits in einem Wartezustand befinden, z. B. manuelle Bearbeitung, Genehmigung, Verzögerung oder Warten auf einen externen Rückruf. Die Timeout-Zeit wird nicht angehalten, während der Workflow auf eine Benutzeraktion wartet.

Der Timeout-Stichtag wird beim Start dieser Ausführung festgelegt. Änderungen an den Timeout-Einstellungen eines Workflows wirken sich nur auf Ausführungen aus, die danach mit der Verarbeitung beginnen; bereits gestartete Ausführungen werden nicht neu berechnet.

### Verhalten nach Timeout

Wenn die Ausführung beim Erreichen des Timeouts noch nicht beendet ist, beendet das System diese Ausführung:

- Der Status im Ausführungsverlauf wird zu „Abgebrochen“, und als Beendigungsgrund wird „Zeitüberschreitung“ angezeigt.
- Knotenaufgaben, die aktuell ausgeführt werden oder warten, werden als „Abgebrochen“ markiert.
- Nachfolgende Knoten werden nicht weiter ausgeführt.
- Wenn unter dieser Ausführung noch Unterprozess-Ausführungen laufen, werden diese zusammen mit der übergeordneten Ausführung abgebrochen.

Beispiele:

- Wenn ein Schleifenknoten eine sehr lange Schleife ausführt und die Verarbeitung innerhalb der Schleife zeitaufwendig ist, sodass die gesamte Ausführungszeit des Schleifenknotens das konfigurierte Timeout überschreitet, werden der aktuell ausgeführte Schleifenknoten und seine internen Knoten zwangsweise beendet. Nachfolgende Knoten werden nicht weiter ausgeführt.
- Wenn ein Knoten für manuelle Bearbeitung oder Genehmigung sehr lange wartet und das konfigurierte Timeout überschreitet, wird der aktuell wartende Knoten zwangsweise beendet. Nachfolgende Knoten werden nicht weiter ausgeführt, und die zugehörigen Aufgaben werden abgebrochen.

:::info{title=Hinweis}
Timeout-Einstellungen sind eine globale Begrenzung für die gesamte Workflow-Ausführung, nicht für einen einzelnen Knoten. Wenn Sie nur die Wartezeit eines bestimmten Knotens begrenzen möchten, z. B. eines HTTP-Request- oder JavaScript-Skript-Knotens, verwenden Sie die Timeout-Einstellungen dieses Knotens.
:::

:::info{title=Hinweis}
Wenn Sie eine fachliche zeitbegrenzte Verarbeitung umsetzen möchten, z. B. „einen Arbeitsauftrag als zeitüberschritten markieren, wenn ihn innerhalb von 10 Minuten niemand bearbeitet“, verwenden Sie in der Regel den [Verzögerungsknoten](../nodes/delay.md) zusammen mit parallelen Zweigen, um die anschließende Verarbeitung zu modellieren. Das globale Timeout beendet die aktuelle Ausführung direkt und eignet sich daher als Schutzmechanismus, nicht aber für nachfolgende fachliche Verzweigungen.
:::

## Ausführungsmodus

Workflows werden je nach dem bei der Erstellung ausgewählten Auslösertyp entweder asynchron oder synchron ausgeführt. Im asynchronen Modus gelangt der Workflow nach dem Auslösen eines bestimmten Ereignisses in eine Warteschlange und wird nacheinander durch eine Hintergrundplanung ausgeführt. Der synchrone Modus hingegen tritt nach dem Auslösen nicht in die Planungswarteschlange ein, sondern beginnt sofort mit der Ausführung und liefert nach Abschluss umgehend Feedback.

Sammlungsereignisse, Ereignisse nach einer Aktion, benutzerdefinierte Aktionsereignisse, geplante Ereignisse und Genehmigungsereignisse werden standardmäßig asynchron ausgeführt. Ereignisse vor einer Aktion werden standardmäßig synchron ausgeführt. Sowohl Sammlungsereignisse als auch Formularereignisse unterstützen beide Modi, die Sie bei der Erstellung eines Workflows auswählen können:

![Synchroner Modus_Synchronen Workflow erstellen](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Hinweis}
Aufgrund ihrer Natur können synchrone Workflows keine Knoten verwenden, die einen „Warte“-Zustand erzeugen, wie zum Beispiel „Manuelle Bearbeitung“.
:::

## Ausführungsverlauf automatisch löschen

Wenn ein Workflow häufig ausgelöst wird, können Sie durch die Konfiguration des automatischen Löschens des Ausführungsverlaufs die Unübersichtlichkeit reduzieren und gleichzeitig den Speicherplatzbedarf der Datenbank verringern.

Ebenso können Sie in den Erstellungs- und Bearbeitungsdialogen eines Workflows konfigurieren, ob dessen Ausführungsverlauf automatisch gelöscht werden soll:

![Konfiguration zum automatischen Löschen des Ausführungsverlaufs](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

Das automatische Löschen kann basierend auf dem Status des Ausführungsergebnisses konfiguriert werden. In den meisten Fällen wird empfohlen, nur den Status „Abgeschlossen“ auszuwählen, um fehlgeschlagene Ausführungen für die spätere Fehlerbehebung zu erhalten.

Es wird empfohlen, das automatische Löschen des Ausführungsverlaufs beim Debuggen eines Workflows nicht zu aktivieren, damit Sie den Verlauf nutzen können, um zu überprüfen, ob die Ausführungslogik des Workflows den Erwartungen entspricht.

:::info{title=Hinweis}
Das Löschen des Verlaufs eines Workflows reduziert nicht die Anzahl der bisherigen Ausführungen des Workflows.
:::
