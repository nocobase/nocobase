:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# RAG-ophaling

## Introductie

Nadat u de kennisbank heeft geconfigureerd, kunt u de RAG-functionaliteit inschakelen in de instellingen van de AI-medewerker.

Wanneer RAG is ingeschakeld, zal de AI-medewerker bij een gesprek met een gebruiker RAG-ophaling gebruiken om documenten uit de kennisbank op te halen op basis van het bericht van de gebruiker, en vervolgens te antwoorden op basis van de opgehaalde documenten.

## RAG inschakelen

Ga naar de configuratiepagina van de AI-medewerker plugin en klik op het tabblad `AI employees` om de beheerpagina van de AI-medewerkers te openen.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Selecteer de AI-medewerker waarvoor u RAG wilt inschakelen, klik op de knop `Edit` om de bewerkingspagina van de AI-medewerker te openen.

Op het tabblad `Knowledge base` zet u de schakelaar `Enable` aan.

- Voer bij `Knowledge Base Prompt` de prompt in voor het verwijzen naar de kennisbank. `{knowledgeBaseData}` is een vaste placeholder en mag niet worden gewijzigd.
- Selecteer bij `Knowledge Base` de geconfigureerde kennisbank. Zie: [Kennisbank](/ai-employees/knowledge-base/knowledge-base).
- Voer in het invoerveld `Top K` het aantal documenten in dat moet worden opgehaald; de standaardwaarde is 3.
- Voer in het invoerveld `Score` de drempelwaarde voor documentrelevantie in voor de ophaling.

Klik op de knop `Submit` om de instellingen van de AI-medewerker op te slaan.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)