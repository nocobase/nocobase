---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Gestructureerde uitvoer

## Introductie

In sommige toepassingsscenario's wilt u misschien dat het LLM-model gestructureerde inhoud in JSON-formaat retourneert. Dit kunt u bereiken door 'Gestructureerde uitvoer' te configureren.

![](https://static-docs.nocobase.com/202503041306405.png)

## Configuratie

-   **JSON Schema** - U kunt de verwachte structuur van de respons van het model specificeren door een [JSON Schema](https://json-schema.org/) te configureren.
-   **Naam** - _Optioneel_, helpt het model om het object dat door het JSON Schema wordt vertegenwoordigd beter te begrijpen.
-   **Beschrijving** - _Optioneel_, helpt het model om het doel van het JSON Schema beter te begrijpen.
-   **Strict** - Vereist dat het model een respons genereert die strikt overeenkomt met de JSON Schema-structuur. Momenteel ondersteunen alleen enkele nieuwe modellen van OpenAI deze parameter. Controleer of uw model compatibel is voordat u deze optie inschakelt.

## Methode voor het genereren van gestructureerde inhoud

De manier waarop een model gestructureerde inhoud genereert, hangt af van het gebruikte **model** en de configuratie van het **Response format**:

1.  Modellen waarbij Response format alleen `text` ondersteunt
    -   Bij aanroep koppelt het knooppunt een Tool die JSON-geformatteerde inhoud genereert op basis van het JSON Schema, en leidt het model om een gestructureerde respons te genereren door deze Tool aan te roepen.

2.  Modellen waarbij Response format de JSON-modus (`json_object`) ondersteunt
    -   Als de JSON-modus wordt geselecteerd bij aanroep, moet u het model expliciet instrueren in de Prompt om in JSON-formaat te retourneren en beschrijvingen voor de responsvelden op te geven.
    -   In deze modus wordt het JSON Schema alleen gebruikt om de door het model geretourneerde JSON-string te parseren en om te zetten in het doel-JSON-object.

3.  Modellen waarbij Response format JSON Schema (`json_schema`) ondersteunt
    -   Het JSON Schema wordt direct gebruikt om de doelresponsstructuur voor het model te specificeren.
    -   De optionele **Strict**-parameter vereist dat het model het JSON Schema strikt volgt bij het genereren van de respons.

4.  Ollama lokale modellen
    -   Als een JSON Schema is geconfigureerd, geeft het knooppunt dit door als de `format`-parameter aan het model bij aanroep.

## Het resultaat van gestructureerde uitvoer gebruiken

De gestructureerde inhoud van de respons van het model wordt opgeslagen als een JSON-object in het veld 'Structured content' van het knooppunt en kan worden gebruikt door volgende knooppunten.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)