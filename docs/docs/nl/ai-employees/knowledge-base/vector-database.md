:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Vector Database

## Introductie

In een kennisbank slaat de vector database gevectoriseerde kennisbankdocumenten op. Deze gevectoriseerde documenten fungeren als een index voor de documenten.

Wanneer RAG-retrieval is ingeschakeld in een AI Agent-gesprek, wordt het bericht van de gebruiker gevectoriseerd. Vervolgens worden fragmenten van kennisbankdocumenten uit de vector database opgehaald om relevante documentparagrafen en de originele tekst te matchen.

Momenteel ondersteunt de AI Kennisbank plugin alleen PGVector als ingebouwde vector database. Dit is een PostgreSQL database plugin.

## Beheer van de Vector Database

Ga naar de configuratiepagina van de AI Agent plugin, klik op het tabblad `Vector store`, en selecteer `Vector database` om de beheerpagina van de vector database te openen.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Klik op de knop `Add new` rechtsboven om een nieuwe `PGVector` vector database verbinding toe te voegen:

- Voer in het veld `Name` de naam van de verbinding in.
- Voer in het veld `Host` het IP-adres van de vector database in.
- Voer in het veld `Port` het poortnummer van de vector database in.
- Voer in het veld `Username` de gebruikersnaam van de vector database in.
- Voer in het veld `Password` het wachtwoord van de vector database in.
- Voer in het veld `Database` de naam van de database in.
- Voer in het veld `Table name` de naam van de tabel in. Dit wordt gebruikt bij het aanmaken van een nieuwe tabel voor het opslaan van vector data.

Nadat u alle benodigde informatie hebt ingevoerd, klikt u op de knop `Test` om te controleren of de vector database service beschikbaar is. Klik vervolgens op de knop `Submit` om de verbindingsinformatie op te slaan.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)