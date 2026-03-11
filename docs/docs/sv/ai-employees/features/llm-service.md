:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/ai-employees/features/llm-service).
:::

# Konfigurera LLM-tjänst

Innan ni använder AI-medarbetare behöver ni först konfigurera tillgängliga LLM-tjänster.

För närvarande stöds OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi samt lokala Ollama-modeller.

## Skapa ny tjänst

Gå till `Systeminställningar -> AI-medarbetare -> LLM-tjänst`.

1. Klicka på `Lägg till ny` för att öppna dialogrutan för skapande.
2. Välj `Leverantör`.
3. Fyll i `Titel`, `API-nyckel` och `Bas-URL` (valfritt).
4. Konfigurera `Aktiverade modeller`:
   - `Rekommenderade modeller`: använd officiellt rekommenderade modeller.
   - `Välj modeller`: välj från leverantörens lista över modeller.
   - `Manuell inmatning`: ange modell-ID och visningsnamn manuellt.
5. Klicka på `Skicka` för att spara.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Aktivera och sortera tjänster

I listan över LLM-tjänster kan ni direkt:

- Använda reglaget `Aktiverad` för att aktivera eller inaktivera tjänster.
- Dra och släpp för att ändra ordning på tjänsterna (påverkar i vilken ordning modellerna visas).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Tillgänglighetstest

Använd `Test flight` längst ner i konfigurationsfönstret för att verifiera tjänstens och modellens tillgänglighet.

Det rekommenderas att ni testar tjänsten innan den tas i bruk i verksamheten.