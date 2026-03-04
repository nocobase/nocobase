:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/ai-employees/features/llm-service).
:::

# Konfigurace LLM služeb

Před použitím AI zaměstnanců je nutné nejprve nakonfigurovat dostupné LLM služby.

Aktuálně jsou podporovány modely OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi a lokální modely Ollama.

## Vytvoření nové služby

Přejděte do `Nastavení systému -> AI zaměstnanci -> LLM service`.

1. Klikněte na `Add New` pro otevření dialogového okna pro vytvoření.
2. Vyberte `Provider` (poskytovatele).
3. Vyplňte `Title` (název), `API Key` a `Base URL` (volitelné).
4. Nakonfigurujte `Enabled Models` (povolené modely):
   - `Recommended models`: použijte oficiálně doporučené modely.
   - `Select models`: vyberte ze seznamu poskytnutého poskytovatelem.
   - `Manual input`: ručně zadejte ID modelu a zobrazovaný název.
5. Klikněte na `Submit` pro uložení.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Povolení a řazení služeb

V seznamu LLM služeb můžete přímo:

- Použít přepínač `Enabled` pro aktivaci nebo deaktivaci služby.
- Přetažením změnit pořadí služeb (ovlivňuje pořadí zobrazení modelů).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Test dostupnosti

Pro ověření dostupnosti služby a modelů použijte tlačítko `Test flight` v dolní části konfiguračního okna.

Doporučujeme provést tento test před ostrým nasazením do provozu.