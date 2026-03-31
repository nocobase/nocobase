:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erweiterte Konfiguration

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