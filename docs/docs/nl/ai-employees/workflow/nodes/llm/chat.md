---
pkg: "@nocobase/plugin-ai"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Tekstchat

## Introductie

Met de LLM-node in een workflow kunt u een gesprek starten met een online LLM-service. Zo benut u de mogelijkheden van grote modellen om diverse bedrijfsprocessen te ondersteunen.

![](https://static-docs.nocobase.com/202503041012091.png)

## Een LLM-node aanmaken

Omdat gesprekken met LLM-services vaak veel tijd in beslag nemen, kunt u de LLM-node alleen gebruiken in asynchrone workflows.

![](https://static-docs.nocobase.com/202503041013363.png)

## Model selecteren

Kies eerst een gekoppelde LLM-service. Als u nog geen LLM-service hebt gekoppeld, moet u eerst een LLM-serviceconfiguratie toevoegen. Zie: [LLM Servicebeheer](/ai-employees/quick-start/llm-service)

Nadat u een service hebt geselecteerd, probeert de applicatie een lijst met beschikbare modellen op te halen van de LLM-service, zodat u een keuze kunt maken. Sommige online LLM-services hebben mogelijk API's voor het ophalen van modellen die niet voldoen aan de standaard API-protocollen; in dergelijke gevallen kunt u ook handmatig de model-ID invoeren.

![](https://static-docs.nocobase.com/202503041013084.png)

## Oproepparameters instellen

U kunt de parameters voor het aanroepen van het LLM-model naar behoefte aanpassen.

![](https://static-docs.nocobase.com/202503041014778.png)

### Responseformaat

Het is de moeite waard om de instelling **Responseformaat** te vermelden. Deze optie wordt gebruikt om het grote model te instrueren over het formaat van de respons, wat tekst of JSON kan zijn. Als u de JSON-modus selecteert, houd dan rekening met het volgende:

- Het corresponderende LLM-model moet de JSON-modus ondersteunen. Bovendien moet u het LLM in de prompt expliciet instrueren om in JSON-formaat te reageren, bijvoorbeeld: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Anders krijgt u mogelijk geen respons, wat resulteert in een `400 status code (no body)` fout.
- De respons is een JSON-string. U moet deze parsen met behulp van de mogelijkheden van andere workflow-nodes om de gestructureerde inhoud te kunnen gebruiken. U kunt ook de functie [Gestructureerde uitvoer](/ai-employees/workflow/nodes/llm/structured-output) gebruiken.

## Berichten

De array met berichten die naar het LLM-model wordt gestuurd, kan een reeks historische berichten bevatten. Berichten ondersteunen drie typen:

- System - Wordt meestal gebruikt om de rol en het gedrag van het LLM-model in het gesprek te definiëren.
- User - De inhoud die door de gebruiker is ingevoerd.
- Assistant - De inhoud die door het model is beantwoord.

Voor gebruikersberichten kunt u, mits het model dit ondersteunt, meerdere stukken inhoud toevoegen in één prompt, corresponderend met de `content`-parameter. Als het model dat u gebruikt alleen de `content`-parameter als een string ondersteunt (wat het geval is voor de meeste modellen die geen multi-modale gesprekken ondersteunen), splits het bericht dan op in meerdere prompts, waarbij elke prompt slechts één stuk inhoud bevat. Op deze manier stuurt de node de inhoud als een string.

![](https://static-docs.nocobase.com/202503041016140.png)

U kunt variabelen gebruiken in de berichtinhoud om te verwijzen naar de workflowcontext.

![](https://static-docs.nocobase.com/202503041017879.png)

## De responsinhoud van de LLM-node gebruiken

U kunt de responsinhoud van de LLM-node als variabele gebruiken in andere nodes.

![](https://static-docs.nocobase.com/202503041018508.png)