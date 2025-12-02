---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



pkg: "@nocobase/plugin-ai-ee"
---

# Strukturierte Ausgabe

## Einführung

In bestimmten Anwendungsszenarien möchten Benutzer möglicherweise, dass das LLM-Modell strukturierte Inhalte im JSON-Format zurückgibt. Dies lässt sich durch die Konfiguration der „Strukturierten Ausgabe“ erreichen.

![](https://static-docs.nocobase.com/202503041306405.png)

## Konfiguration

- **JSON Schema** – Sie können die erwartete Struktur der Modellantwort festlegen, indem Sie ein [JSON Schema](https://json-schema.org/) konfigurieren.
- **Name** – _Optional_, hilft dem Modell, das durch das JSON Schema dargestellte Objekt besser zu verstehen.
- **Beschreibung** – _Optional_, hilft dem Modell, den Zweck des JSON Schemas besser zu erfassen.
- **Strict** – Fordert das Modell auf, eine Antwort streng nach der Struktur des JSON Schemas zu generieren. Derzeit unterstützen nur einige neue Modelle von OpenAI diesen Parameter. Bitte prüfen Sie vor der Aktivierung, ob Ihr Modell kompatibel ist.

## Methode zur Generierung strukturierter Inhalte

Die Methode, wie ein Modell strukturierte Inhalte generiert, hängt vom verwendeten **Modell** und dessen **Response format**-Konfiguration ab:

1. Modelle, bei denen das Response format nur `text` unterstützt
   - Beim Aufruf bindet der Knoten ein Tool, das JSON-formatierte Inhalte basierend auf dem JSON Schema generiert. Dieses Tool leitet das Modell an, eine strukturierte Antwort zu erzeugen.

2. Modelle, bei denen das Response format den JSON-Modus (`json_object`) unterstützt
   - Wenn beim Aufruf der JSON-Modus ausgewählt wird, müssen Sie das Modell im Prompt explizit anweisen, die Antwort im JSON-Format zurückzugeben und Beschreibungen für die Antwortfelder bereitzustellen.
   - In diesem Modus dient das JSON Schema lediglich dazu, den vom Modell zurückgegebenen JSON-String zu parsen und in das Ziel-JSON-Objekt umzuwandeln.

3. Modelle, bei denen das Response format JSON Schema (`json_schema`) unterstützt
   - Das JSON Schema wird direkt verwendet, um die Zielantwortstruktur für das Modell festzulegen.
   - Der optionale Parameter **Strict** fordert das Modell auf, bei der Generierung der Antwort das JSON Schema streng zu befolgen.

4. Ollama lokale Modelle
   - Wenn ein JSON Schema konfiguriert ist, übergibt der Knoten es beim Aufruf als `format`-Parameter an das Modell.

## Verwendung des Ergebnisses der strukturierten Ausgabe

Die strukturierten Inhalte der Modellantwort werden als JSON-Objekt im Feld „Structured content“ des Knotens gespeichert und können von nachfolgenden Knoten verwendet werden.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)