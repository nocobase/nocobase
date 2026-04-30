# KI-Mitarbeiter-Knoten

## Einführung

Der KI-Mitarbeiter-Knoten dient dazu, in einem Workflow einen KI-Mitarbeiter mit der Erledigung einer bestimmten Aufgabe zu beauftragen und anschließend strukturierte Informationen auszugeben.

Nach dem Erstellen eines Workflows können Sie beim Hinzufügen von Workflow-Knoten den KI-Mitarbeiter-Knoten auswählen.

![20260420142250](https://static-docs.nocobase.com/20260420142250.png)

## Knoten-Konfiguration
### Vorbereitung

Vor der Konfiguration des KI-Mitarbeiter-Knotens sollten Sie wissen, wie Workflows aufgebaut werden, wie LLM-Dienste konfiguriert werden, sowie die Funktionen der integrierten KI-Mitarbeiter und wie KI-Mitarbeiter erstellt werden.

Sie können die folgenden Dokumente einsehen:
  - [Workflow](/workflow)
  - [LLM-Dienst konfigurieren](/ai-employees/features/llm-service)
  - [Integrierte KI-Mitarbeiter](/ai-employees/features/built-in-employee)
  - [Neue KI-Mitarbeiter erstellen](/ai-employees/features/new-ai-employees)

### Aufgabe
#### KI-Mitarbeiter auswählen

Wählen Sie einen KI-Mitarbeiter aus, der für die Bearbeitung der Aufgabe dieses Knotens zuständig ist. Wählen Sie aus der Dropdown-Liste einen im System aktivierten integrierten KI-Mitarbeiter oder einen selbst erstellten KI-Mitarbeiter aus.

![20260420143554](https://static-docs.nocobase.com/20260420143554.png)

#### Modell auswählen

Wählen Sie das Large Language Model aus, das den KI-Mitarbeiter antreibt. Wählen Sie aus der Dropdown-Liste ein Modell aus, das von einem im System konfigurierten LLM-Dienst bereitgestellt wird.

![20260420145057](https://static-docs.nocobase.com/20260420145057.png)

#### Operator auswählen

Wählen Sie einen Benutzer im System aus, der dem KI-Mitarbeiter Datenzugriffsrechte gewährt. Bei Datenabfragen ist der KI-Mitarbeiter auf den Berechtigungsumfang dieses Benutzers beschränkt.

Wenn der Trigger einen Operator bereitstellt (z. B. `Custom action event`), werden die Berechtigungen dieses Operators bevorzugt verwendet.

![20260420145244](https://static-docs.nocobase.com/20260420145244.png)

#### Prompt und Aufgabenbeschreibung

`Background` wird als System-Prompt an die KI gesendet und beschreibt üblicherweise Hintergrundinformationen und Rahmenbedingungen der Aufgabe.

`Default user message` ist der User-Prompt, der an die KI gesendet wird und beschreibt üblicherweise den Aufgabeninhalt, also was die KI tun soll.

![20260420174515](https://static-docs.nocobase.com/20260420174515.png)

#### Anhänge

`Attachments` werden zusammen mit `Default user message` an die KI gesendet. Üblicherweise handelt es sich um Dokumente oder Bilder, die für die Aufgabe verarbeitet werden müssen.

Anhänge unterstützen zwei Typen:

1. `File(load via Files collection)` verwendet den Primärschlüssel, um Daten aus der angegebenen Dateitabelle abzurufen und als Anhang an die KI zu senden.

![20260420150933](https://static-docs.nocobase.com/20260420150933.png)

2. `File via URL` ruft die Datei aus der angegebenen URL ab und verwendet sie als Anhang, der an die KI gesendet wird.

![20260420151702](https://static-docs.nocobase.com/20260420151702.png)

#### Skills und Tools

Üblicherweise sind einem KI-Mitarbeiter mehrere Skills und Tools zugeordnet. Hier können Sie einschränken, dass in der aktuellen Aufgabe nur bestimmte Skills oder Tools verwendet werden.

Standardmäßig ist `Preset` eingestellt, wobei die voreingestellten Skills und Tools des KI-Mitarbeiters verwendet werden. Wenn Sie auf `Customer` umstellen, können Sie auswählen, dass nur bestimmte Skills oder Tools des KI-Mitarbeiters verwendet werden.

![20260426231701](https://static-docs.nocobase.com/20260426231701.png)

#### Web-Suche

Der `Web search`-Schalter steuert, ob die KI im aktuellen Knoten die Web-Suchfunktion nutzt. Weitere Informationen zur Web-Suche von KI-Mitarbeitern finden Sie unter: [Web-Suche](/ai-employees/features/web-search)

![20260426231945](https://static-docs.nocobase.com/20260426231945.png)

### Feedback und Benachrichtigungen
#### Strukturierte Ausgabe

Benutzer können nach der [JSON Schema](https://json-schema.org/)-Spezifikation die Datenstruktur definieren, die der KI-Mitarbeiter-Knoten letztendlich ausgibt.

![20260426232117](https://static-docs.nocobase.com/20260426232117.png)

Wenn andere Knoten im Workflow Daten des KI-Mitarbeiter-Knotens abrufen, werden die Optionen ebenfalls anhand dieses `JSON Schema` generiert.

![20260426232509](https://static-docs.nocobase.com/20260426232509.png)

##### Standardwert

Standardmäßig wird die folgende `JSON Schema`-Definition bereitgestellt. Sie definiert ein Objekt, das eine Eigenschaft namens `result` vom Typ String enthält, mit einem festgelegten Titel: Result.

```json
{
  "type": "object",
  "properties": {
    "result": {
      "title": "Result",
      "type": "string",
      "description": "The text message sent to the user"
    }
  }
}
```

Gemäß dieser Definition gibt der KI-Mitarbeiter-Knoten JSON-strukturierte Daten aus, die der Definition entsprechen.

```json
{
  result: "Some text generated from LLM "
}
```

#### Genehmigungseinstellungen

Der Knoten unterstützt drei Genehmigungsmodi:

- `No required` Der KI-Ausgabeinhalt benötigt keine manuelle Prüfung. Nach Abschluss der KI-Ausgabe wird der Workflow automatisch fortgesetzt.
- `Human decision` Der KI-Ausgabeinhalt muss zwingend an die Prüfer zur manuellen Prüfung weitergeleitet werden, der Workflow wird erst nach der manuellen Prüfung fortgesetzt.
- `AI decision` Die KI entscheidet, ob die Prüfer für eine manuelle Prüfung des Ausgabeinhalts benachrichtigt werden.

![20260426232232](https://static-docs.nocobase.com/20260426232232.png)

Wenn der Genehmigungsmodus nicht `No required` ist, müssen für den Knoten ein oder mehrere Prüfer konfiguriert werden.

Sobald die KI im KI-Mitarbeiter-Knoten den gesamten Inhalt ausgegeben hat, wird eine Benachrichtigung an alle für diesen Knoten konfigurierten Prüfer gesendet. Es genügt, wenn einer der benachrichtigten Prüfer die Genehmigung durchführt, damit der Workflow fortgesetzt werden kann.

![20260426232319](https://static-docs.nocobase.com/20260426232319.png)
