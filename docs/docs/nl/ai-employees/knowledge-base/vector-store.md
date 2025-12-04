:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Vectoropslag

## Introductie

Binnen een kennisbank worden documenten gevectoriseerd wanneer u ze opslaat. Wanneer u documenten ophaalt, worden de zoektermen gevectoriseerd. Voor beide processen is een `Embedding model` nodig om de originele tekst te vectoriseren.

In de AI Kennisbank plugin is een vectoropslag de koppeling tussen een `Embedding model` en een vectordatabase.

## Beheer van vectoropslag

Ga naar de configuratiepagina van de AI Medewerkers plugin, klik op het tabblad `Vector store` en selecteer `Vector store` om de beheerpagina voor vectoropslag te openen.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Klik op de knop `Add new` rechtsboven om een nieuwe vectoropslag toe te voegen:

- Voer in het invoerveld `Name` de naam van de vectoropslag in;
- Selecteer onder `Vector store` een reeds geconfigureerde vectordatabase. Raadpleeg: [Vectordatabase](/ai-employees/knowledge-base/vector-database);
- Selecteer onder `LLM service` een reeds geconfigureerde LLM-service. Raadpleeg: [LLM Service Beheer](/ai-employees/quick-start/llm-service);
- Voer in het invoerveld `Embedding model` de naam in van het `Embedding` model dat u wilt gebruiken;

Klik op de knop `Submit` om de informatie van de vectoropslag op te slaan.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)