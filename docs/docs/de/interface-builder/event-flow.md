:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/event-flow).
:::

# Ereignisfluss

## Einführung

Wenn Sie benutzerdefinierte Aktionen auslösen möchten, wenn sich ein Formular ändert, können Sie dies mit einem Ereignisfluss umsetzen. Neben Formularen können auch Seiten, Blöcke, Schaltflächen und Felder Ereignisflüsse nutzen, um benutzerdefinierte Operationen zu konfigurieren.

## So verwenden Sie es

Im Folgenden wird an einem einfachen Beispiel erklärt, wie ein Ereignisfluss konfiguriert wird. Lassen Sie uns eine Verknüpfung zwischen zwei Tabellen realisieren: Wenn auf eine Zeile der linken Tabelle geklickt wird, werden die Daten der rechten Tabelle automatisch gefiltert.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Die Konfigurationsschritte sind wie folgt:

1. Klicken Sie auf das „Blitz“-Symbol in der oberen rechten Ecke des linken Tabellenblocks, um die Konfigurationsoberfläche für den Ereignisfluss zu öffnen.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Klicken Sie auf „Ereignisfluss hinzufügen (Add event flow)“ und wählen Sie als „Auslösendes Ereignis“ die Option „Zeilenklick“, was bedeutet, dass der Fluss beim Klicken auf eine Tabellenzeile ausgelöst wird.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Konfigurieren Sie den „Ausführungszeitpunkt“, um die Reihenfolge dieses Ereignisflusses im Verhältnis zu den systeminternen Prozessen zu steuern. Im Allgemeinen können Sie die Standardeinstellung beibehalten; wenn Sie möchten, dass nach der Ausführung der internen Logik ein Hinweis erscheint oder eine Weiterleitung erfolgt, können Sie „Nach allen Flüssen“ wählen. Weitere Erläuterungen finden Sie unten unter [Ausführungszeitpunkt](#ausführungszeitpunkt).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. „Auslösebedingung (Trigger condition)“ dient zur Konfiguration von Bedingungen; der Ereignisfluss wird nur ausgelöst, wenn die Bedingungen erfüllt sind. In diesem Fall müssen wir keine Bedingungen konfigurieren, da der Ereignisfluss bei jedem Klick auf eine Zeile ausgelöst werden soll.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Bewegen Sie die Maus über „Schritt hinzufügen (Add step)“, um Operationsschritte hinzuzufügen. Wir wählen „Datenbereich festlegen (Set data scope)“, um den Datenbereich der rechten Tabelle festzulegen.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Kopieren Sie die UID der rechten Tabelle und geben Sie sie in das Eingabefeld „Zielblock-UID (Target block UID)“ ein. Darunter wird sofort eine Oberfläche zur Bedingungskonfiguration angezeigt, in der Sie den Datenbereich der rechten Tabelle konfigurieren können.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Lassen Sie uns eine Bedingung konfigurieren, wie in der folgenden Abbildung gezeigt:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Nach der Konfiguration des Datenbereichs muss der Block aktualisiert werden, damit die gefilterten Ergebnisse angezeigt werden. Als Nächstes konfigurieren wir die Aktualisierung des rechten Tabellenblocks. Fügen Sie einen Schritt „Zielblöcke aktualisieren (Refresh target blocks)“ hinzu und geben Sie die UID der rechten Tabelle ein.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Klicken Sie abschließend auf die Schaltfläche „Speichern“ in der unteren rechten Ecke, um die Konfiguration abzuschließen.

## Ereignisdetails

### Vor dem Rendern

Ein universelles Ereignis, das in Seiten, Blöcken, Schaltflächen oder Feldern verwendet werden kann. In diesem Ereignis können Initialisierungsaufgaben durchgeführt werden, zum Beispiel die Konfiguration unterschiedlicher Datenbereiche unter verschiedenen Bedingungen.

### Zeilenklick (Row click)

Ein spezifisches Ereignis für Tabellenblöcke. Es wird ausgelöst, wenn eine Tabellenzeile angeklickt wird. Beim Auslösen wird ein „Clicked row record“ zum Kontext hinzugefügt, der als Variable in Bedingungen und Schritten verwendet werden kann.

### Formularwertänderung (Form values change)

Ein spezifisches Ereignis für Formularblöcke. Es wird ausgelöst, wenn sich die Werte von Formularfeldern ändern. Sie können die Formularwerte in Bedingungen und Schritten über die Variable „Current form“ abrufen.

### Klick (Click)

Ein spezifisches Ereignis für Schaltflächen. Es wird ausgelöst, wenn die Schaltfläche angeklickt wird.

## Ausführungszeitpunkt

In der Konfiguration des Ereignisflusses gibt es zwei leicht zu verwechselnde Konzepte:

- **Auslösendes Ereignis:** Wann die Ausführung beginnt (z. B.: Vor dem Rendern, Zeilenklick, Klick, Formularwertänderung usw.).
- **Ausführungszeitpunkt:** An welcher Stelle im **internen Prozess** Ihr **benutzerdefinierter Ereignisfluss** eingefügt werden soll, nachdem dasselbe auslösende Ereignis eingetreten ist.

### Was sind „interne Prozesse / interne Schritte“?

Viele Seiten, Blöcke oder Operationen verfügen über systeminterne Verarbeitungsprozesse (z. B.: Übermitteln, Öffnen eines Popups, Datenanfrage usw.). Wenn Sie für dasselbe Ereignis (z. B. „Klick“) einen neuen benutzerdefinierten Ereignisfluss hinzufügen, bestimmt der „Ausführungszeitpunkt“:

- Ob Ihr Ereignisfluss vor oder nach der internen Logik ausgeführt wird;
- Oder ob Ihr Ereignisfluss vor oder nach einem bestimmten Schritt des internen Prozesses eingefügt wird.

### Wie sind die Optionen für den Ausführungszeitpunkt in der Benutzeroberfläche zu verstehen?

- **Vor allen Flüssen (Standard):** Wird zuerst ausgeführt. Geeignet für „Abfangen/Vorbereitung“ (z. B. Validierung, Bestätigung, Initialisierung von Variablen usw.).
- **Nach allen Flüssen:** Wird nach Abschluss der internen Logik ausgeführt. Geeignet für „Abschluss/Feedback“ (z. B. Hinweismeldungen, Aktualisierung anderer Blöcke, Seitennavigation usw.).
- **Vor bestimmtem Fluss / Nach bestimmtem Fluss:** Ein präziserer Einfügepunkt. Nach der Auswahl muss ein spezifischer „interner Prozess“ gewählt werden.
- **Vor bestimmtem Flussschritt / Nach bestimmtem Flussschritt:** Der präziseste Einfügepunkt. Nach der Auswahl müssen sowohl der „interne Prozess“ als auch der „interne Prozessschritt“ gewählt werden.

> Hinweis: Wenn Sie unsicher sind, welchen internen Prozess/Schritt Sie wählen sollen, verwenden Sie vorrangig die ersten beiden Optionen („Vorher / Nachher“).

## Schrittdetails

### Benutzerdefinierte Variable (Custom variable)

Dient dazu, eine benutzerdefinierte Variable zu erstellen und diese dann im Kontext zu verwenden.

#### Gültigkeitsbereich

Benutzerdefinierte Variablen haben einen Gültigkeitsbereich. Eine Variable, die beispielsweise im Ereignisfluss eines Blocks definiert wird, kann nur innerhalb dieses Blocks verwendet werden. Wenn Sie möchten, dass eine Variable in allen Blöcken der aktuellen Seite verfügbar ist, müssen Sie diese im Ereignisfluss der Seite konfigurieren.

#### Formularvariable (Form variable)

Verwenden Sie den Wert eines Formularblocks als Variable. Die Konfiguration ist wie folgt:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Variablentitel
- Variable identifier: Variablenbezeichner
- Form UID: Formular-UID

#### Weitere Variablen

Weitere Variablentypen werden zukünftig unterstützt. Bleiben Sie gespannt!

### Datenbereich festlegen (Set data scope)

Legen Sie den Datenbereich für einen Zielblock fest. Die Konfiguration ist wie folgt:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: Zielblock-UID
- Condition: Filterbedingung

### Zielblöcke aktualisieren (Refresh target blocks)

Aktualisieren Sie Zielblöcke; es können mehrere Blöcke konfiguriert werden. Die Konfiguration ist wie folgt:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: Zielblock-UID

### Zu URL navigieren (Navigate to URL)

Navigieren Sie zu einer URL. Die Konfiguration ist wie folgt:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: Ziel-URL, unterstützt Variablen
- Search parameters: Abfrageparameter in der URL
- Open in new window: Wenn aktiviert, wird beim Navigieren eine neue Browserseite geöffnet.

### Nachricht anzeigen (Show message)

Zeigt globale Feedback-Informationen für Operationen an.

#### Wann verwenden

- Bietet Feedback-Informationen wie Erfolgs-, Warn- und Fehlermeldungen.
- Wird oben zentriert angezeigt und verschwindet automatisch; dies ist eine leichte Benachrichtigungsmethode, die den Benutzer nicht bei seinen Operationen unterbricht.

#### Konfiguration

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Nachrichtentyp
- Message content: Nachrichteninhalt
- Duration: Anzeigedauer in Sekunden

### Benachrichtigung anzeigen (Show notification)

Zeigt globale Benachrichtigungen und Hinweise an.

#### Wann verwenden

Zeigt Benachrichtigungen in den vier Ecken des Systems an. Wird häufig in folgenden Situationen verwendet:

- Bei komplexeren Benachrichtigungsinhalten.
- Bei interaktiven Benachrichtigungen, die dem Benutzer nächste Handlungsschritte v