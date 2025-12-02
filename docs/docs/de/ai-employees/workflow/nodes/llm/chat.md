---
pkg: "@nocobase/plugin-ai"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Text-Chat

## Einführung

Mit dem LLM-Knoten in einem Workflow können Sie eine Konversation mit einem Online-LLM-Dienst starten. So nutzen Sie die Fähigkeiten großer Modelle, um eine Reihe von Geschäftsprozessen zu unterstützen.

![](https://static-docs.nocobase.com/202503041012091.png)

## LLM-Knoten erstellen

Da Konversationen mit LLM-Diensten oft zeitaufwendig sind, kann der LLM-Knoten nur in asynchronen Workflows verwendet werden.

![](https://static-docs.nocobase.com/202503041013363.png)

## Modell auswählen

Wählen Sie zunächst einen verbundenen LLM-Dienst aus. Falls noch kein LLM-Dienst verbunden ist, müssen Sie zuerst eine LLM-Dienstkonfiguration hinzufügen. Siehe: [LLM-Dienstverwaltung](/ai-employees/quick-start/llm-service)

Nachdem Sie einen Dienst ausgewählt haben, versucht die Anwendung, eine Liste der verfügbaren Modelle vom LLM-Dienst abzurufen, damit Sie diese auswählen können. Einige Online-LLM-Dienste verfügen möglicherweise über APIs zum Abrufen von Modellen, die nicht den Standard-API-Protokollen entsprechen; in solchen Fällen können Benutzer die Modell-ID auch manuell eingeben.

![](https://static-docs.nocobase.com/202503041013084.png)

## Aufrufparameter festlegen

Sie können die Parameter für den Aufruf des LLM-Modells nach Bedarf anpassen.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Besonders hervorzuheben ist die Einstellung **Response format**. Diese Option wird verwendet, um dem großen Modell das Format seiner Antwort vorzugeben, welche Text oder JSON sein kann. Wenn Sie den JSON-Modus wählen, beachten Sie bitte Folgendes:

- Das entsprechende LLM-Modell muss den Aufruf im JSON-Modus unterstützen. Zusätzlich muss der Benutzer das LLM im Prompt explizit dazu auffordern, im JSON-Format zu antworten, zum Beispiel: „Tell me a joke about cats, respond in JSON with `setup` and `punchline` keys“. Andernfalls gibt es möglicherweise keine Antwort, was zu einem Fehler `400 status code (no body)` führen kann.
- Die Antwort ist ein JSON-String. Der Benutzer muss diesen mithilfe der Funktionen anderer Workflow-Knoten parsen, um dessen strukturierte Inhalte nutzen zu können. Sie können auch die Funktion [Strukturierte Ausgabe](/ai-employees/workflow/nodes/llm/structured-output) verwenden.

## Nachrichten

Das Array von Nachrichten, das an das LLM-Modell gesendet wird, kann eine Reihe von Verlaufsnachrichten enthalten. Nachrichten unterstützen drei Typen:

- System – Wird normalerweise verwendet, um die Rolle und das Verhalten des LLM-Modells in der Konversation zu definieren.
- User – Der vom Benutzer eingegebene Inhalt.
- Assistant – Der vom Modell beantwortete Inhalt.

Für Benutzernachrichten können Sie, sofern das Modell dies unterstützt, mehrere Inhalte in einem einzigen Prompt hinzufügen, die dem Parameter `content` entsprechen. Wenn das von Ihnen verwendete Modell den Parameter `content` nur als String unterstützt (was bei den meisten Modellen der Fall ist, die keine multimodalen Konversationen unterstützen), teilen Sie die Nachricht bitte in mehrere Prompts auf, wobei jeder Prompt nur einen Inhalt enthält. Auf diese Weise sendet der Knoten den Inhalt als String.

![](https://static-docs.nocobase.com/202503041016140.png)

Im Nachrichteninhalt können Sie Variablen verwenden, um auf den Workflow-Kontext zu verweisen.

![](https://static-docs.nocobase.com/202503041017879.png)

## Verwenden des Antwortinhalts des LLM-Knotens

Sie können den Antwortinhalt des LLM-Knotens als Variable in anderen Knoten verwenden.

![](https://static-docs.nocobase.com/202503041018508.png)