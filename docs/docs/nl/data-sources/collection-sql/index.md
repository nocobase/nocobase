---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# SQL collectie

## Introductie

De SQL collectie biedt een krachtige methode om gegevens op te halen met SQL-queries. Door gegevensvelden via SQL-queries te extraheren en de bijbehorende veldmetadata te configureren, kunt u deze velden gebruiken alsof u met een standaard tabel werkt, bijvoorbeeld in tabellen, grafieken en workflows. Deze functionaliteit is bijzonder nuttig voor scenario's met complexe join-queries, statistische analyses en meer.

## Gebruikershandleiding

### Een nieuwe SQL collectie aanmaken

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

1. Voer uw SQL-query in het daarvoor bestemde invoerveld in en klik op Uitvoeren (Execute). Het systeem analyseert de query om de betrokken tabellen en velden te bepalen, waarbij automatisch de relevante veldmetadata uit de brontabellen wordt geëxtraheerd.

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

2. Als de analyse van de brontabellen en velden door het systeem niet correct is, kunt u handmatig de juiste tabellen en velden selecteren om ervoor te zorgen dat de correcte metadata wordt gebruikt. Begin met het selecteren van de brontabel, en kies vervolgens de corresponderende velden in het gedeelte 'Veldbron' hieronder.

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

3. Voor velden die geen directe bron hebben, zal het systeem het veldtype afleiden op basis van het gegevenstype. Als deze afleiding onjuist is, kunt u handmatig het juiste veldtype selecteren.

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

4. Terwijl u elk veld configureert, kunt u de weergave ervan in het voorbeeldgebied bekijken, zodat u de directe impact van uw instellingen ziet.

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

5. Nadat u de configuratie hebt voltooid en hebt bevestigd dat alles correct is, klikt u op de knop Bevestigen (Confirm) onder het SQL-invoerveld om de indiening af te ronden.

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Bewerken

1. Als u de SQL-query moet wijzigen, klikt u op de knop Bewerken (Edit) om de SQL-instructie direct aan te passen en de velden opnieuw te configureren indien nodig.

2. Om de veldmetadata aan te passen, gebruikt u de optie Velden configureren (Configure fields), waarmee u de veldinstellingen kunt bijwerken net zoals u dat voor een reguliere tabel zou doen.

### Synchronisatie

Als de SQL-query ongewijzigd blijft, maar de onderliggende databasetabelstructuur is gewijzigd, kunt u de velden synchroniseren en opnieuw configureren door 'Velden configureren (Configure fields) - Synchroniseren vanuit database (Sync from database)' te selecteren.

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### SQL collectie versus gekoppelde databaseweergaven

| Sjabloontype | Meest geschikt voor | Implementatiemethode | Ondersteuning voor CRUD-bewerkingen |
| :--- | :--- | :--- | :--- |
| SQL | Eenvoudige modellen, lichtgewicht gebruiksscenario's<br />Beperkte interactie met de database<br />Onderhoud van weergaven vermijden<br />Voorkeur voor UI-gestuurde bewerkingen | SQL-subquery | Niet ondersteund |
| Verbinden met databaseweergave | Complexe modellen<br />Vereist database-interactie<br />Gegevensaanpassing nodig<br />Vereist sterkere en stabielere databaseondersteuning | Databaseweergave | Gedeeltelijk ondersteund |

:::warning
Zorg er bij het gebruik van een SQL collectie voor dat u tabellen selecteert die binnen NocoBase beheersbaar zijn. Het gebruik van tabellen uit dezelfde database die niet zijn verbonden met NocoBase kan leiden tot onnauwkeurige SQL-queryparsing. Als dit een probleem is, overweeg dan om een weergave aan te maken en deze te koppelen.
:::