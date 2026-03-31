---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Genehmigung

## Einführung

In einem Genehmigungs-Workflow ist ein spezieller 'Genehmigungs'-Knoten erforderlich, um die Logik für die Bearbeitung zu konfigurieren, damit Genehmigende die eingeleitete Genehmigung bearbeiten (genehmigen, ablehnen oder zurücksenden) können. Der 'Genehmigungs'-Knoten kann ausschließlich in Genehmigungsprozessen verwendet werden.

:::info{title=Hinweis}
**Unterschied zum regulären 'Manuellen' Knoten:** Der reguläre 'Manuelle' Knoten ist für allgemeinere Szenarien gedacht, wie die manuelle Dateneingabe oder manuelle Entscheidungen über die Fortsetzung des Prozesses in verschiedenen Workflow-Typen. Der 'Genehmigungs'-Knoten ist ein spezialisierter Verarbeitungsknoten, der ausschließlich für Genehmigungsprozesse vorgesehen ist. Er verarbeitet nur die Daten der eingeleiteten Genehmigung und kann nicht in anderen Workflows verwendet werden.
:::

## Knoten erstellen

Klicken Sie im Workflow auf die Plus-Schaltfläche ('+'), fügen Sie einen 'Genehmigungs'-Knoten hinzu und wählen Sie dann einen der Genehmigungsmodi aus, um den Genehmigungs-Knoten zu erstellen:

![Genehmigungs-Knoten erstellen](https://static-docs.nocobase.com/20251107000938.png)

## Knotenkonfiguration

### Genehmigungsmodus

Es gibt zwei Genehmigungsmodi:

1.  **Direktmodus**: Wird typischerweise für einfachere Prozesse verwendet. Ob der Genehmigungs-Knoten genehmigt wird oder nicht, bestimmt lediglich, ob der Prozess endet. Wird er nicht genehmigt, wird der Prozess direkt beendet.

    ![Genehmigungs-Knoten_Durchlaufmodus](https://static-docs.nocobase.com/20251107001043.png)

2.  **Verzweigungsmodus**: Wird typischerweise für komplexere Datenlogiken verwendet. Nachdem der Genehmigungs-Knoten ein Ergebnis erzeugt hat, können andere Knoten innerhalb seines Ergebnis-Zweigs weiter ausgeführt werden.

    ![Genehmigungs-Knoten_Verzweigungsmodus](https://static-docs.nocobase.com/20251107001234.png)

    Wird dieser Knoten 'genehmigt', wird neben der Ausführung des Genehmigungs-Zweigs auch der nachfolgende Workflow fortgesetzt. Nach einer 'Ablehnen'-Aktion kann der nachfolgende Workflow standardmäßig ebenfalls fortgesetzt werden, oder Sie können den Knoten so konfigurieren, dass der Prozess nach Ausführung des Zweigs beendet wird.

:::info{title=Hinweis}
Der Genehmigungsmodus kann nach dem Erstellen des Knotens nicht mehr geändert werden.
:::

### Genehmigende

Die Genehmigenden sind die Benutzergruppe, die für die Genehmigungsaktion dieses Knotens verantwortlich ist. Es kann sich um einen oder mehrere Benutzer handeln. Die Quelle kann ein statischer Wert sein, der aus der Benutzerliste ausgewählt wird, oder ein dynamischer Wert, der durch eine Variable festgelegt wird:

![Genehmigungs-Knoten_Genehmigende](https://static-docs.nocobase.com/20251107001433.png)

Beim Auswählen einer Variable können Sie nur den Primärschlüssel oder Fremdschlüssel von Benutzerdaten aus dem Kontext und den Knotenergebnissen auswählen. Wenn die ausgewählte Variable während der Ausführung ein Array ist (eine N:M-Beziehung), wird jeder Benutzer im Array in die gesamte Gruppe der Genehmigenden zusammengeführt.

Zusätzlich zur direkten Auswahl von Benutzern oder Variablen können Sie auch Benutzer, die bestimmte Kriterien erfüllen, dynamisch über Abfragebedingungen der Benutzer-Sammlung als Genehmigende filtern:

![Benutzer als Genehmigende filtern](https://static-docs.nocobase.com/20251107001703.png)

### Abstimmungsmodus

Wenn zum Zeitpunkt der endgültigen Ausführung nur ein Genehmigender vorhanden ist (auch nach der Deduplizierung mehrerer Variablen), wird unabhängig vom gewählten Abstimmungsmodus nur dieser Benutzer die Genehmigungsaktion ausführen, und das Ergebnis wird ausschließlich von diesem Benutzer bestimmt.

Wenn mehrere Benutzer in der Gruppe der Genehmigenden vorhanden sind, stellen verschiedene Abstimmungsmodi unterschiedliche Verarbeitungsweisen dar:

1.  **Oder-Abstimmung**: Wenn auch nur eine Person genehmigt, gilt der Knoten als genehmigt. Der Knoten wird nur abgelehnt, wenn alle ablehnen.
2.  **Alle-müssen-zustimmen**: Alle müssen genehmigen, damit der Knoten als genehmigt gilt. Lehnt auch nur eine Person ab, wird der Knoten abgelehnt.
3.  **Abstimmung**: Die Anzahl der Personen, die genehmigen, muss ein festgelegtes Verhältnis überschreiten, damit der Knoten als genehmigt gilt; andernfalls wird der Knoten abgelehnt.

Für die Aktion 'Zurücksenden' gilt in jedem Modus: Wenn ein Benutzer in der Gruppe der Genehmigenden die Aktion als 'Zurücksenden' verarbeitet, wird der Knoten den Prozess direkt beenden.

### Verarbeitungsreihenfolge

Ähnlich verhält es sich, wenn mehrere Benutzer in der Gruppe der Genehmigenden vorhanden sind: Die Auswahl unterschiedlicher Verarbeitungsreihenfolgen stellt unterschiedliche Verarbeitungsweisen dar:

1.  **Parallel**: Alle Genehmigenden können in beliebiger Reihenfolge bearbeiten; die Reihenfolge der Bearbeitung spielt keine Rolle.
2.  **Sequenziell**: Die Genehmigenden bearbeiten nacheinander in der Reihenfolge, in der sie in der Gruppe der Genehmigenden aufgeführt sind. Der nächste Genehmigende kann erst bearbeiten, nachdem der vorherige seine Eingabe übermittelt hat.

Unabhängig davon, ob die Verarbeitung auf 'Sequenziell' eingestellt ist, folgt das Ergebnis, das sich aus der tatsächlichen Verarbeitungsreihenfolge ergibt, ebenfalls den oben genannten Regeln des 'Abstimmungsmodus'. Der Knoten schließt seine Ausführung ab, sobald die entsprechenden Bedingungen erfüllt sind.

### Workflow nach Ende des Ablehnungszweigs beenden

Wenn der 'Genehmigungsmodus' auf 'Verzweigungsmodus' eingestellt ist, können Sie wählen, den Workflow nach dem Ende des Ablehnungszweigs zu beenden. Nachdem Sie diese Option aktiviert haben, wird am Ende des Ablehnungszweigs ein '✗' angezeigt, was darauf hinweist, dass nach diesem Zweig keine weiteren Knoten fortgesetzt werden:

![Genehmigungs-Knoten_Nach Ablehnung beenden](https://static-docs.nocobase.com/20251107001839.png)

### Oberflächenkonfiguration für Genehmigende

Die Oberflächenkonfiguration für Genehmigende dient dazu, den Genehmigenden eine Bedienoberfläche bereitzustellen, wenn der Genehmigungs-Workflow diesen Knoten erreicht. Klicken Sie auf die Schaltfläche 'Konfigurieren', um das Pop-up-Fenster zu öffnen:

![Genehmigungs-Knoten_Oberflächenkonfiguration_Pop-up](https://static-docs.nocobase.com/20251107001958.png)

Im Konfigurations-Pop-up können Sie Blöcke wie 'Ursprünglicher Einreichungsinhalt', 'Genehmigungsinformationen', 'Bearbeitungsformular' und 'Benutzerdefinierter Hinweistext' hinzufügen:

![Genehmigungs-Knoten_Oberflächenkonfiguration_Blöcke hinzufügen](https://static-docs.nocobase.com/20251107002604.png)

#### Ursprünglicher Einreichungsinhalt

Der Block 'Genehmigungsinhalt Details' (oder 'Ursprünglicher Einreichungsinhalt') ist der Datenblock, der vom Initiator übermittelt wurde. Ähnlich wie bei einem regulären Datenblock können Sie Feldkomponenten aus der Sammlung hinzufügen und diese frei anordnen, um den Inhalt zu organisieren, den die Genehmigenden einsehen müssen:

![Genehmigungs-Knoten_Oberflächenkonfiguration_Detailblock](https://static-docs.nocobase.com/20251107002925.png)

#### Bearbeitungsformular

Im Block 'Bearbeitungsformular' können Sie von diesem Knoten unterstützte Aktionsschaltflächen hinzufügen, darunter 'Genehmigen', 'Ablehnen', 'Zurücksenden', 'Neu zuweisen' und 'Mitunterzeichner hinzufügen':

![Genehmigungs-Knoten_Oberflächenkonfiguration_Aktionsformular-Block](https://static-docs.nocobase.com/20251107003015.png)

Zusätzlich können dem Bearbeitungsformular Felder hinzugefügt werden, die von den Genehmigenden geändert werden können. Diese Felder werden im Bearbeitungsformular angezeigt, wenn die Genehmigenden die Genehmigung bearbeiten. Die Genehmigenden können die Werte dieser Felder ändern, und bei der Übermittlung werden sowohl die Daten für die Genehmigung als auch der Schnappschuss der entsprechenden Daten im Genehmigungsprozess gleichzeitig aktualisiert.

![Genehmigungs-Knoten_Oberflächenkonfiguration_Aktionsformular_Genehmigungsinhalt ändern](https://static-docs.nocobase.com/20251107003206.png)

#### 'Genehmigen' und 'Ablehnen'

Unter den Genehmigungs-Aktionsschaltflächen sind 'Genehmigen' und 'Ablehnen' entscheidende Aktionen. Nach der Übermittlung ist die Bearbeitung dieses Knotens durch die Genehmigenden abgeschlossen. Zusätzliche Felder, die bei der Übermittlung ausgefüllt werden müssen, wie z.B. 'Kommentar', können im Pop-up 'Verarbeitungskonfiguration' für die Aktionsschaltfläche hinzugefügt werden.

![Genehmigungs-Knoten_Oberflächenkonfiguration_Verarbeitungskonfiguration](https://static-docs.nocobase.com/20251107003314.png)

#### 'Zurücksenden'

'Zurücksenden' ist ebenfalls eine entscheidende Aktion. Neben der Konfiguration von Kommentaren können Sie auch die Knoten konfigurieren, an die zurückgesendet werden kann:

![Konfiguration für 'Zurücksenden'](https://static-docs.nocobase.com/20251107003555.png)

#### 'Neu zuweisen' und 'Mitunterzeichner hinzufügen'

'Neu zuweisen' und 'Mitunterzeichner hinzufügen' sind nicht-entscheidende Aktionen, die verwendet werden, um die Genehmigenden im Genehmigungsprozess dynamisch anzupassen. 'Neu zuweisen' bedeutet, die Genehmigungsaufgabe des aktuellen Benutzers an einen anderen Benutzer zur Bearbeitung zu übergeben. 'Mitunterzeichner hinzufügen' bedeutet, einen Genehmigenden vor oder nach dem aktuellen Genehmigenden hinzuzufügen, wobei der neu hinzugefügte Genehmigende den Genehmigungsprozess gemeinsam fortsetzt.

Nachdem Sie die Aktionsschaltflächen 'Neu zuweisen' oder 'Mitunterzeichner hinzufügen' aktiviert haben, müssen Sie im Konfigurationsmenü der Schaltfläche den 'Zuweisungsbereich' auswählen, um den Bereich der Benutzer festzulegen, die als neue Genehmigende zugewiesen werden können:

![Genehmigungs-Knoten_Oberflächenkonfiguration_Aktionsformular_Zuweisungsbereich](https://static-docs.nocobase.com/20241226232321.png)

Ähnlich wie bei der ursprünglichen Genehmigenden-Konfiguration des Knotens kann der Zuweisungsbereich auch direkt ausgewählte Genehmigende umfassen oder auf Abfragebedingungen der Benutzer-Sammlung basieren. Er wird schließlich zu einer Menge zusammengeführt und enthält keine Benutzer, die bereits in der Gruppe der Genehmigenden enthalten sind.

:::warning{title=Wichtig}
Wenn eine Aktionsschaltfläche aktiviert oder deaktiviert wird oder der Zuweisungsbereich geändert wird, müssen Sie die Konfiguration des Knotens speichern, nachdem Sie das Pop-up für die Aktions-Oberflächenkonfiguration geschlossen haben. Andernfalls werden die Änderungen an der Aktionsschaltfläche nicht wirksam.
:::

## Knotenergebnis

Nach Abschluss der Genehmigung werden der relevante Status und die Daten im Knotenergebnis erfasst und können von nachfolgenden Knoten als Variablen verwendet werden.

![Knotenergebnis](https://static-docs.nocobase.com/20250614095052.png)

### Genehmigungsstatus des Knotens

Stellt den Verarbeitungsstatus des aktuellen Genehmigungs-Knotens dar. Das Ergebnis ist ein Aufzählungswert.

### Daten nach der Genehmigung

Wenn die Genehmigenden den Genehmigungsinhalt im Bearbeitungsformular ändern, werden die geänderten Daten im Knotenergebnis für die Verwendung durch nachfolgende Knoten erfasst. Um Beziehungsfelder zu verwenden, müssen Sie das Vorladen für die Beziehungsfelder im Trigger konfigurieren.

### Genehmigungsprotokolle

> v1.8.0+

Das Genehmigungsprotokoll ist ein Array, das die Bearbeitungsprotokolle aller Genehmigenden in diesem Knoten enthält. Jeder Protokolleintrag enthält die folgenden Felder:

| Feld        | Typ    | Beschreibung                               |
| :---------- | :----- | :----------------------------------------- |
| `id`        | `number` | Eindeutiger Bezeichner des Protokolleintrags |
| `userId`    | `number` | Benutzer-ID, der diesen Eintrag bearbeitet hat |
| `status`    | `number` | Bearbeitungsstatus                         |
| `comment`   | `string` | Kommentar zum Zeitpunkt der Bearbeitung   |
| `updatedAt` | `string` | Aktualisierungszeitpunkt des Protokolleintrags |

Sie können diese Felder bei Bedarf als Variablen in nachfolgenden Knoten verwenden.