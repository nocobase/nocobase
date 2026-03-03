:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/ai-employees/features/llm-service).
:::

# Konfiguracja usług LLM

Przed rozpoczęciem korzystania z AI Employees, należy najpierw skonfigurować dostępne usługi LLM.

Obecnie obsługiwane są modele OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi oraz lokalne modele Ollama.

## Tworzenie nowej usługi

Przejdź do `Ustawienia systemowe -> AI Employees -> LLM service`.

1. Kliknij `Add New`, aby otworzyć okno tworzenia nowej usługi.
2. Wybierz `Provider` (Dostawcę).
3. Wprowadź `Title` (Tytuł), `API Key` (Klucz API) oraz `Base URL` (opcjonalnie).
4. Skonfiguruj `Enabled Models` (Włączone modele):
   - `Recommended models`: użycie oficjalnie rekomendowanych modeli.
   - `Select models`: wybór z listy modeli udostępnionej przez dostawcę.
   - `Manual input`: ręczne wprowadzenie identyfikatora modelu (ID) i nazwy wyświetlanej.
5. Kliknij `Submit`, aby zapisać.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Włączanie i sortowanie usług

Na liście usług LLM mogą Państwo bezpośrednio:

- Używać przełącznika `Enabled`, aby włączać lub wyłączać usługi.
- Przeciągać elementy, aby zmienić kolejność usług (wpływa to na kolejność wyświetlania modeli).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Test dostępności

Użyj przycisku `Test flight` na dole okna konfiguracji usługi, aby sprawdzić dostępność usługi i modeli.

Zaleca się przeprowadzenie testu przed wdrożeniem usługi do użytku operacyjnego.