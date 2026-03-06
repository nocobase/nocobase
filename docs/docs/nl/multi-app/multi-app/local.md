---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/multi-app/multi-app/local) voor nauwkeurige informatie.
:::

# Gedeeld geheugenmodus

## Introductie

Wanneer gebruikers hun bedrijfsactiviteiten op applicatieniveau willen opsplitsen, maar geen complexe implementatie- en beheerarchitectuur willen introduceren, kan de gedeeld geheugenmodus voor meerdere applicaties worden gebruikt.

In deze modus kunnen meerdere applicaties gelijktijdig binnen één NocoBase-instantie draaien. Elke applicatie is onafhankelijk, kan verbinding maken met een eigen database, en kan afzonderlijk worden gemaakt, gestart en gestopt. Ze delen echter hetzelfde proces en dezelfde geheugenruimte, waardoor u nog steeds slechts één NocoBase-instantie hoeft te onderhouden.

## Gebruikershandleiding

### Configuratie van omgevingsvariabelen

Zorg ervoor dat de volgende omgevingsvariabelen zijn ingesteld bij het opstarten van NocoBase voordat u de functies voor meerdere applicaties gebruikt:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Applicatie maken

Klik in het menu Systeeminstellingen op "App-supervisor" om de pagina voor applicatiebeheer te openen.

![](https://static-docs.nocobase.com/202512291056215.png)

Klik op de knop "Nieuw toevoegen" om een nieuwe applicatie te maken.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Toelichting op configuratie-items

| Configuratie-item | Beschrijving |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Applicatienaam** | De naam die in de interface wordt weergegeven |
| **Applicatie-ID** | Applicatie-identificatie, wereldwijd uniek |
| **Opstartmodus** | - Starten bij eerste bezoek: start pas wanneer de gebruiker de sub-applicatie voor het eerst via een URL bezoekt<br>- Samen met de hoofdapplicatie starten: start de sub-applicatie tegelijk met de hoofdapplicatie (verlengt de opstarttijd van de hoofdapplicatie) |
| **Omgeving** | In de gedeeld geheugenmodus is alleen de lokale omgeving beschikbaar, namelijk `local` |
| **Databaseverbinding** | Wordt gebruikt om de hoofdgegevensbron van de applicatie te configureren, ondersteunt de volgende drie methoden:<br>- Nieuwe database: hergebruik de huidige databaseservice en maak een onafhankelijke database<br>- Nieuwe gegevensverbinding: verbinding maken met een andere databaseservice<br>- Schema-modus: wanneer de huidige hoofdgegevensbron PostgreSQL is, wordt een onafhankelijk schema voor de applicatie gemaakt |
| **Upgrade** | Of automatische upgrade naar de huidige applicatieversie is toegestaan als er NocoBase-applicatiegegevens van een lagere versie in de verbonden database aanwezig zijn |
| **JWT-geheim** | Genereert automatisch een onafhankelijk JWT-geheim voor de applicatie om ervoor te zorgen dat de applicatiesessie onafhankelijk is van de hoofdapplicatie en andere applicaties |
| **Aangepast domein** | Configureer een onafhankelijk domein voor toegang tot de applicatie |

### Applicatie starten

Klik op de knop **Starten** om de sub-applicatie te starten.

> Als bij het maken de optie _"Starten bij eerste bezoek"_ is aangevinkt, wordt de applicatie bij het eerste bezoek automatisch gestart.

![](https://static-docs.nocobase.com/202512291121065.png)

### Applicatie bezoeken

Klik op de knop **Bezoeken** om de sub-applicatie in een nieuw tabblad te openen.

Standaard wordt `/apps/:appName/admin/` gebruikt om de sub-applicatie te bezoeken, bijvoorbeeld:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Tevens kunt u een onafhankelijk domein voor de sub-applicatie configureren. Het domein moet naar het huidige IP-adres verwijzen. Als u Nginx gebruikt, moet het domein ook aan de Nginx-configuratie worden toegevoegd.

### Applicatie stoppen

Klik op de knop **Stoppen** om de sub-applicatie te stoppen.

![](https://static-docs.nocobase.com/202512291122113.png)

### Applicatiestatus

In de lijst kunt u de huidige status van elke applicatie bekijken.

![](https://static-docs.nocobase.com/202512291122339.png)

### Applicatie verwijderen

Klik op de knop **Verwijderen** om de applicatie te verwijderen.

![](https://static-docs.nocobase.com/202512291122178.png)

## Veelgestelde vragen

### 1. Plugin-beheer

De plugins die andere applicaties kunnen gebruiken zijn identiek aan die van de hoofdapplicatie (inclusief de versie), maar plugins kunnen onafhankelijk worden geconfigureerd en gebruikt.

### 2. Database-isolatie

Andere applicaties kunnen onafhankelijke databases configureren. Als u gegevens tussen applicaties wilt delen, kan dit via externe gegevensbronnen worden gerealiseerd.

### 3. Gegevensback-up en migratie

Momenteel ondersteunt de gegevensback-up op de hoofdapplicatie geen gegevens van andere applicaties (het bevat alleen basisinformatie over de applicatie). Back-ups en migraties moeten handmatig binnen de andere applicaties worden uitgevoerd.

### 4. Implementatie en updates

In de gedeeld geheugenmodus volgt de versie van andere applicaties automatisch de upgrade van de hoofdapplicatie, waardoor de applicatieversies automatisch consistent blijven.

### 5. Applicatiesessies

- Als een applicatie een onafhankelijk JWT-geheim gebruikt, is de applicatiesessie onafhankelijk van de hoofdapplicatie en andere applicaties. Als verschillende applicaties via subpaden van hetzelfde domein worden bezocht, is opnieuw inloggen vereist bij het schakelen tussen applicaties omdat de applicatie-TOKEN in de LocalStorage wordt gecached. Het wordt aanbevolen om onafhankelijke domeinen voor verschillende applicaties te configureren voor een betere sessie-isolatie.
- Als een applicatie geen onafhankelijk JWT-geheim gebruikt, deelt deze de sessie van de hoofdapplicatie. Na het bezoeken van andere applicaties in dezelfde browser hoeft u niet opnieuw in te loggen bij terugkeer naar de hoofdapplicatie. Dit brengt echter veiligheidsrisico's met zich mee: als gebruikers-ID's in verschillende applicaties hetzelfde zijn, kan dit leiden tot ongeoorloofde toegang tot gegevens van andere applicaties.