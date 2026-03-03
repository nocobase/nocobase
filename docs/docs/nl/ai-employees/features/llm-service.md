:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/ai-employees/features/llm-service) voor nauwkeurige informatie.
:::

# LLM-service configureren

Voordat u AI-medewerkers kunt gebruiken, moet u eerst de beschikbare LLM-services configureren.

Momenteel worden OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi en lokale Ollama-modellen ondersteund.

## Service aanmaken

Ga naar `Systeeminstellingen -> AI-medewerkers -> LLM-service`.

1. Klik op `Add New` om het venster voor een nieuwe service te openen.
2. Selecteer de `Provider`.
3. Vul de `Title`, `API Key` en `Base URL` (optioneel) in.
4. Configureer `Enabled Models`:
   - `Recommended models`: gebruik officieel aanbevolen modellen.
   - `Select models`: selecteer uit de lijst die door de provider wordt geretourneerd.
   - `Manual input`: voer handmatig de model-ID en weergavenaam in.
5. Klik op `Submit` om op te slaan.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Services inschakelen en sorteren

In de LLM-servicelijst kunt u direct:

- De service in- of uitschakelen met de `Enabled`-schakelaar.
- De volgorde van de services verslepen (dit beïnvloedt de weergavevolgorde van de modellen).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Beschikbaarheidstest

Gebruik `Test flight` onderaan het configuratievenster om de beschikbaarheid van de service en het model te testen.

Het wordt aanbevolen om eerst te testen voordat u de service voor zakelijke doeleinden in gebruik neemt.