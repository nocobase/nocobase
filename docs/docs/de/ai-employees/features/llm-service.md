:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/ai-employees/features/llm-service).
:::

# LLM-Dienst konfigurieren

Bevor Sie AI-Mitarbeiter verwenden, müssen Sie zunächst die verfügbaren LLM-Dienste konfigurieren.

Derzeit werden OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi sowie lokale Ollama-Modelle unterstützt.

## Neuen Dienst erstellen

Gehen Sie zu `Systemeinstellungen -> AI-Mitarbeiter -> LLM-Dienst`.

1. Klicken Sie auf `Neu hinzufügen`, um das Erstellungsfenster zu öffnen.
2. Wählen Sie den `Anbieter` aus.
3. Geben Sie `Titel`, `API-Schlüssel` und `Basis-URL` (optional) ein.
4. Konfigurieren Sie die `Aktivierten Modelle`:
   - `Empfohlene Modelle`: Verwendung der offiziell empfohlenen Modelle.
   - `Modelle auswählen`: Auswahl aus der vom Anbieter bereitgestellten Liste.
   - `Manuelle Eingabe`: Manuelle Eingabe der Modell-ID und des Anzeigenamens.
5. Klicken Sie auf `Absenden`, um zu speichern.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Dienste aktivieren und sortieren

In der Liste der LLM-Dienste können Sie direkt:

- Den Schalter `Aktiviert` verwenden, um Dienste zu starten oder zu stoppen.
- Die Reihenfolge der Dienste per Drag-and-Drop verschieben (dies beeinflusst die Anzeigereihenfolge der Modelle).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Verfügbarkeitstest

Verwenden Sie `Testflug` am Ende des Konfigurationsfensters, um die Verfügbarkeit des Dienstes und der Modelle zu prüfen.

Es wird empfohlen, diesen Test durchzuführen, bevor Sie den Dienst im Geschäftsbetrieb einsetzen.