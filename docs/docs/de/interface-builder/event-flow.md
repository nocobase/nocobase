:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Ereignis-Workflow

## Einführung

Wenn Sie benutzerdefinierte Aktionen auslösen möchten, sobald sich ein Formular ändert, können Sie dies mit einem Ereignis-Workflow umsetzen. Neben Formularen können auch Seiten, Blöcke, Schaltflächen und Felder Ereignis-Workflows nutzen, um individuelle Operationen zu konfigurieren.

## So verwenden Sie es

Im Folgenden zeigen wir Ihnen anhand eines einfachen Beispiels, wie Sie einen Ereignis-Workflow konfigurieren. Lassen Sie uns eine Verknüpfung zwischen zwei Tabellen herstellen: Wenn Sie auf eine Zeile in der linken Tabelle klicken, werden die Daten in der rechten Tabelle automatisch gefiltert.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Die Konfiguration erfolgt in folgenden Schritten:

1. Klicken Sie auf das „Blitz“-Symbol in der oberen rechten Ecke des linken Tabellenblocks, um die Konfigurationsoberfläche für den Ereignis-Workflow zu öffnen.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Klicken Sie auf „Ereignis-Workflow hinzufügen“ und wählen Sie als „Auslösendes Ereignis“ die Option „Zeilenklick“. Dies bedeutet, dass der Workflow beim Klicken auf eine Tabellenzeile ausgelöst wird.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Die „Auslösebedingung“ dient zur Konfiguration von Bedingungen. Der Ereignis-Workflow wird nur ausgelöst, wenn diese Bedingungen erfüllt sind. In diesem Beispiel müssen wir keine Bedingung konfigurieren; der Workflow wird bei jedem Zeilenklick ausgelöst.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4. Fahren Sie mit der Maus über „Schritt hinzufügen“, um Operationsschritte hinzuzufügen. Wählen Sie „Datenbereich festlegen“, um den Datenbereich für die rechte Tabelle zu konfigurieren.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5. Kopieren Sie die UID der rechten Tabelle und fügen Sie sie in das Eingabefeld „UID des Zielblocks“ ein. Darunter wird sofort eine Oberfläche zur Bedingungskonfiguration angezeigt, wo Sie den Datenbereich für die rechte Tabelle festlegen können.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6. Konfigurieren Sie eine Bedingung wie unten dargestellt:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7. Nachdem Sie den Datenbereich konfiguriert haben, müssen Sie den Block aktualisieren, damit die gefilterten Ergebnisse angezeigt werden. Fügen Sie als Nächstes einen Schritt „Zielblöcke aktualisieren“ hinzu und geben Sie die UID der rechten Tabelle ein.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8. Klicken Sie abschließend auf die Schaltfläche „Speichern“ in der unteren rechten Ecke, um die Konfiguration abzuschließen.

## Ereignistypen im Detail

### Vor dem Rendern

Ein universelles Ereignis, das in Seiten, Blöcken, Schaltflächen oder Feldern verwendet werden kann. Bei diesem Ereignis können Sie Initialisierungsaufgaben durchführen, zum Beispiel unterschiedliche Datenbereiche basierend auf verschiedenen Bedingungen konfigurieren.

### Zeilenklick

Ein spezifisches Ereignis für Tabellenblöcke. Es wird ausgelöst, wenn eine Tabellenzeile angeklickt wird. Beim Auslösen wird ein „Geklickter Zeilendatensatz“ zum Kontext hinzugefügt, der als Variable in Bedingungen und Schritten verwendet werden kann.

### Formularwerte ändern sich

Ein spezifisches Ereignis für Formularblöcke. Es wird ausgelöst, wenn sich die Werte von Formularfeldern ändern. Sie können die Formularwerte in Bedingungen und Schritten über die Variable „Aktuelles Formular“ abrufen.

### Klick

Ein spezifisches Ereignis für Schaltflächen. Es wird ausgelöst, wenn die Schaltfläche angeklickt wird.

## Schritttypen im Detail

### Benutzerdefinierte Variable

Dient dazu, eine benutzerdefinierte Variable zu erstellen und diese dann im Kontext zu verwenden.

#### Gültigkeitsbereich

Benutzerdefinierte Variablen haben einen Gültigkeitsbereich. Eine Variable, die beispielsweise im Ereignis-Workflow eines Blocks definiert wird, kann nur innerhalb dieses Blocks verwendet werden. Wenn Sie möchten, dass eine Variable in allen Blöcken der aktuellen Seite verfügbar ist, müssen Sie diese im Ereignis-Workflow der Seite konfigurieren.

#### Formularvariable

Verwenden Sie die Werte eines Formularblocks als Variable. Die Konfiguration ist wie folgt:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- `Variable title`: Variablentitel
- `Variable identifier`: Variablenbezeichner
- `Form UID`: Formular-UID

#### Weitere Variablen

Weitere Variablentypen werden zukünftig unterstützt. Bleiben Sie dran!

### Datenbereich festlegen

Legen Sie den Datenbereich für einen Zielblock fest. Die Konfiguration ist wie folgt:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- `Target block UID`: UID des Zielblocks
- `Condition`: Filterbedingung

### Zielblöcke aktualisieren

Aktualisieren Sie Zielblöcke. Es können mehrere Blöcke konfiguriert werden. Die Konfiguration ist wie folgt:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- `Target block UID`: UID des Zielblocks

### Zu URL navigieren

Navigieren Sie zu einer URL. Die Konfiguration ist wie folgt:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- `URL`: Ziel-URL, unterstützt Variablen
- `Search parameters`: Abfrageparameter in der URL
- `Open in new window`: Wenn aktiviert, wird die URL in einem neuen Browser-Tab geöffnet.

### Nachricht anzeigen

Zeigt globale Feedback-Nachrichten für Operationen an.

#### Wann verwenden?

- Bietet Feedback-Informationen wie Erfolgs-, Warn- und Fehlermeldungen.
- Wird oben zentriert angezeigt und verschwindet automatisch. Dies ist eine leichte Benachrichtigungsmethode, die den Benutzer nicht bei seinen Operationen unterbricht.

#### Konfiguration

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- `Message type`: Nachrichtentyp
- `Message content`: Nachrichteninhalt
- `Duration`: Anzeigedauer (in Sekunden)

### Benachrichtigung anzeigen

Zeigt globale Benachrichtigungen und Hinweise an.

#### Wann verwenden?

Zeigt Benachrichtigungen in den vier Ecken des Systems an. Wird häufig in folgenden Situationen verwendet:

- Bei komplexeren Benachrichtigungsinhalten.
- Bei interaktiven Benachrichtigungen, die dem Benutzer nächste Handlungsschritte vorschlagen.
- Bei systemgesteuerten Push-Benachrichtigungen.

#### Konfiguration

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- `Notification type`: Benachrichtigungstyp
- `Notification title`: Benachrichtigungstitel
- `Notification description`: Benachrichtigungsbeschreibung
- `Placement`: Position, Optionen: oben links, oben rechts, unten links, unten rechts

### JavaScript ausführen

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Führt JavaScript-Code aus.