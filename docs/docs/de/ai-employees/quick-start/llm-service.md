:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Schnelleinstieg

## Einführung

Bevor Sie den AI-Mitarbeiter verwenden, müssen Sie zuerst einen Online-LLM-Dienst anbinden. NocoBase unterstützt derzeit gängige Online-LLM-Dienste wie OpenAI, Gemini, Claude, DepSeek, Qwen und andere. Neben Online-LLM-Diensten unterstützt NocoBase auch die Anbindung lokaler Ollama-Modelle.

## LLM-Dienst konfigurieren

Gehen Sie zur Konfigurationsseite des AI-Mitarbeiter-Plugins und klicken Sie auf den Tab `LLM service`, um zur LLM-Dienst-Verwaltungsseite zu gelangen.

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

Fahren Sie mit der Maus über die Schaltfläche `Add New` in der oberen rechten Ecke der LLM-Dienst-Liste und wählen Sie den LLM-Dienst aus, den Sie verwenden möchten.

![20251021213358](https://static-docs.nocobase.com/20251021213358.png)

Nehmen wir OpenAI als Beispiel: Geben Sie im Pop-up-Fenster einen leicht zu merkenden `title` ein. Geben Sie anschließend den von OpenAI erhaltenen `API key` ein und klicken Sie auf `Submit`, um zu speichern. Damit ist die Konfiguration des LLM-Dienstes abgeschlossen.

Die `Base URL` kann normalerweise leer gelassen werden. Falls Sie einen Drittanbieter-LLM-Dienst verwenden, der mit der OpenAI-API kompatibel ist, tragen Sie bitte die entsprechende Base URL ein.

![20251021214549](https://static-docs.nocobase.com/20251021214549.png)

## Verfügbarkeitstest

Auf der LLM-Dienst-Konfigurationsseite klicken Sie auf die Schaltfläche `Test flight`. Geben Sie den Namen des Modells ein, das Sie verwenden möchten, und klicken Sie anschließend auf die Schaltfläche `Run`. So können Sie testen, ob der LLM-Dienst und das Modell verfügbar sind.

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)