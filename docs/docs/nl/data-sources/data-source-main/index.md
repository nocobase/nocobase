---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Hoofddatabase

## Introductie

De hoofddatabase van NocoBase kan zowel worden gebruikt voor het opslaan van bedrijfsgegevens als voor de metadata van de applicatie, inclusief systeemtabellen en aangepaste tabellen. De hoofddatabase ondersteunt relationele databases zoals MySQL, PostgreSQL, enzovoort. Bij de installatie van de NocoBase-applicatie wordt de hoofddatabase gelijktijdig geïnstalleerd en kan deze niet worden verwijderd.

## Installatie

Dit is een ingebouwde plugin, dus u hoeft deze niet apart te installeren.

## Collectiebeheer

De hoofdgegevensbron biedt volledige functionaliteit voor collectiebeheer. U kunt via NocoBase nieuwe tabellen aanmaken, maar ook bestaande tabelstructuren uit de database synchroniseren.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Bestaande tabellen synchroniseren vanuit de database

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Een belangrijke functie van de hoofdgegevensbron is de mogelijkheid om tabellen die al in uw database bestaan te synchroniseren met NocoBase voor beheer. Dit betekent:

- **Bescherm bestaande investeringen**: Als u al veel bedrijfstabellen in uw database heeft, hoeft u deze niet opnieuw aan te maken; u kunt ze direct synchroniseren en gebruiken.
- **Flexibele integratie**: Tabellen die zijn aangemaakt met andere tools (zoals SQL-scripts, databasebeheertools, enz.) kunnen onder NocoBase-beheer worden gebracht.
- **Geleidelijke migratie**: Ondersteuning voor het geleidelijk migreren van bestaande systemen naar NocoBase, in plaats van een eenmalige herstructurering.

Met de functie "Laden vanuit database" kunt u:
1. Alle tabellen in de database bekijken
2. De tabellen selecteren die u wilt synchroniseren
3. Tabelstructuren en veldtypen automatisch laten herkennen
4. Met één klik importeren in NocoBase voor beheer

### Ondersteuning voor meerdere collectietypen

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase ondersteunt het aanmaken en beheren van verschillende soorten collecties:
- **Algemene collectie**: bevat ingebouwde, veelgebruikte systeemvelden;
- **Overervingscollectie**: hiermee kunt u een bovenliggende tabel aanmaken waarvan onderliggende tabellen kunnen worden afgeleid. Onderliggende tabellen erven de structuur van de bovenliggende tabel en kunnen tegelijkertijd hun eigen kolommen definiëren.
- **Boomstructuurcollectie**: een tabel met een boomstructuur, die momenteel alleen het ontwerp van een aangrenzende lijst ondersteunt;
- **Kalendercollectie**: voor het aanmaken van kalendergerelateerde gebeurtenistabellen;
- **Bestandscollectie**: voor het beheren van bestandsopslag;
- **Expressiecollectie**: voor dynamische expressiescenario's in workflows;
- **SQL-collectie**: geen feitelijke databasetabel, maar presenteert SQL-query's snel en gestructureerd;
- **Databaseweergavecollectie**: maakt verbinding met bestaande databaseweergaven;
- **FDW-collectie**: stelt het databasesysteem in staat om gegevens in externe gegevensbronnen direct te benaderen en te bevragen, gebaseerd op FDW-technologie;

### Ondersteuning voor classificatiebeheer van collecties

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Rijke veldtypen

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Flexibele veldtypeconversie

NocoBase ondersteunt flexibele veldtypeconversie op basis van hetzelfde databasetype.

**Voorbeeld: Conversieopties voor velden van het type String**

Wanneer een databaseveld van het type String is, kan het in NocoBase worden geconverteerd naar een van de volgende vormen:

- **Basistypen**: Tekst (één regel), Tekst (meerdere regels), Telefoonnummer, E-mail, URL, Wachtwoord, Kleur, Icoon
- **Keuzetypen**: Keuzelijst (enkele selectie), Keuzerondjes
- **Mediatypen**: Markdown, Markdown (Vditor), Rich Text, Bijlage (URL)
- **Datum & Tijdtypen**: Datum/tijd (met tijdzone), Datum/tijd (zonder tijdzone)
- **Geavanceerde typen**: Volgnummer, Collectie-selector, Versleuteling

Dit flexibele conversiemechanisme betekent:
- **Geen wijziging van de databasestructuur nodig**: Het onderliggende opslagtype van het veld blijft ongewijzigd; alleen de weergave ervan in NocoBase verandert.
- **Aanpassing aan bedrijfswijzigingen**: Naarmate de bedrijfsbehoeften evolueren, kunt u snel de weergave en interactiemethoden van velden aanpassen.
- **Gegevensbeveiliging**: Het conversieproces heeft geen invloed op de integriteit van bestaande gegevens.

### Flexibele synchronisatie op veldniveau

NocoBase synchroniseert niet alleen hele tabellen, maar ondersteunt ook gedetailleerd synchronisatiebeheer op veldniveau:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Kenmerken van veldsynchronisatie:

1. **Realtime synchronisatie**: Wanneer de tabelstructuur van de database verandert, kunnen nieuw toegevoegde velden op elk moment worden gesynchroniseerd.
2. **Selectieve synchronisatie**: U kunt selectief de benodigde velden synchroniseren, in plaats van alle velden.
3. **Automatische typeherkenning**: Automatisch identificeren van databasetypes en deze toewijzen aan NocoBase-veldtypen.
4. **Gegevensintegriteit behouden**: Het synchronisatieproces heeft geen invloed op bestaande gegevens.

#### Gebruiksscenario's:

- **Evolutie van databaseschema**: Wanneer bedrijfsbehoeften veranderen en nieuwe velden moeten worden toegevoegd aan de database, kunnen deze snel worden gesynchroniseerd met NocoBase.
- **Teamwork**: Wanneer andere teamleden of DBA's velden toevoegen aan de database, kunnen deze tijdig worden gesynchroniseerd.
- **Hybride beheermodus**: Sommige velden worden beheerd via NocoBase, andere via traditionele methoden – flexibele combinaties zijn mogelijk.

Dit flexibele synchronisatiemechanisme zorgt ervoor dat NocoBase goed kan integreren in bestaande technische architecturen, zonder dat de bestaande databasebeheerpraktijken hoeven te worden gewijzigd. Tegelijkertijd profiteert u van het gemak van low-code ontwikkeling dat NocoBase biedt.

Meer informatie vindt u in het hoofdstuk "[Collectievelden / Overzicht](/data-sources/data-modeling/collection-fields)".