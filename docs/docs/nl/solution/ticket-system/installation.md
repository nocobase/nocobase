:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/solution/ticket-system/installation) voor nauwkeurige informatie.
:::

# Hoe te installeren

> De huidige versie maakt gebruik van **back-up en herstel** voor de implementatie. In toekomstige versies stappen we mogelijk over op **incrementele migratie**, zodat de oplossing eenvoudiger in uw bestaande systemen kan worden geïntegreerd.

Om u te helpen de ticketing-oplossing snel en soepel in uw eigen NocoBase-omgeving te implementeren, bieden we twee herstelmethoden aan. Kies de methode die het beste past bij uw gebruikersversie en technische achtergrond.

Zorg er voor aanvang voor dat:

- U al een basis NocoBase-omgeving heeft. Raadpleeg voor de installatie van het hoofdsysteem de gedetailleerde [officiële installatiedocumentatie](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase-versie **2.0.0-beta.5 en hoger**
- U de bijbehorende bestanden voor het ticketsysteem heeft gedownload:
  - **Back-upbestand**: [nocobase_tts_v2_backup_260302.nbdata](https://static-docs.nocobase.com/nocobase_tts_v2_backup_260302.nbdata) - Geschikt voor methode 1
  - **SQL-bestand**: [nocobase_tts_v2_sql_260302.zip](https://static-docs.nocobase.com/nocobase_tts_v2_sql_260302.zip) - Geschikt voor methode 2

**Belangrijke opmerking**:
- Deze oplossing is gebaseerd op de **PostgreSQL 16**-database. Zorg ervoor dat uw omgeving PostgreSQL 16 gebruikt.
- **DB_UNDERSCORED mag niet true zijn**: Controleer uw `docker-compose.yml`-bestand en zorg ervoor dat de omgevingsvariabele `DB_UNDERSCORED` niet op `true` is ingesteld, anders ontstaat er een conflict met de back-up van de oplossing, wat leidt tot een mislukt herstel.

---

## Methode 1: Herstellen met de Back-upmanager (aanbevolen voor professionele/enterprise-gebruikers)

Deze methode maakt gebruik van de in NocoBase ingebouwde "[Back-upmanager](https://docs-cn.nocobase.com/handbook/backups)" (professionele/enterprise-versie) plugin voor herstel met één klik. Dit is de eenvoudigste handeling, maar stelt bepaalde eisen aan de omgeving en de gebruikersversie.

### Kernkenmerken

* **Voordelen**:
  1. **Gebruiksgemak**: Kan volledig via de UI-interface worden voltooid en herstelt alle configuraties, inclusief plugins.
  2. **Volledig herstel**: **Kan alle systeembestanden herstellen**, inclusief sjabloonbestanden voor afdrukken, bestanden geüpload in bestandsvelden van tabellen, enz., wat de volledige functionaliteit garandeert.
* **Beperkingen**:
  1. **Alleen voor professionele/enterprise-versie**: De "Back-upmanager" is een enterprise-plugin en is alleen beschikbaar voor professionele/enterprise-gebruikers.
  2. **Strenge omgevingseisen**: Vereist dat uw database-omgeving (versie, hoofdlettergevoeligheid, enz.) in hoge mate compatibel is met de omgeving waarin de back-up is gemaakt.
  3. **Afhankelijkheid van plugins**: Als de oplossing commerciële plugins bevat die niet in uw lokale omgeving aanwezig zijn, zal het herstel mislukken.

### Operatiestappen

**Stap 1: [Sterk aanbevolen] Start de applicatie met de `full`-image**

Om te voorkomen dat het herstel mislukt door het ontbreken van database-clients, raden we u ten zeerste aan de `full`-versie van de Docker-image te gebruiken. Deze bevat alle benodigde ondersteunende programma's, zodat u geen extra configuratie hoeft uit te voeren.

Voorbeeld van de opdracht om de image op te halen:

```bash
docker pull nocobase/nocobase:beta-full
```

Gebruik vervolgens deze image om uw NocoBase-service te starten.

> **Opmerking**: Als u de `full`-image niet gebruikt, moet u mogelijk handmatig de `pg_dump` database-client in de container installeren, wat omslachtig en onstabiel is.

**Stap 2: Schakel de "Back-upmanager" plugin in**

1. Log in op uw NocoBase-systeem.
2. Ga naar **`Plugin-beheer`**.
3. Zoek en schakel de **`Back-upmanager`** plugin in.

**Stap 3: Herstellen vanaf een lokaal back-upbestand**

1. Vernieuw de pagina nadat u de plugin heeft ingeschakeld.
2. Ga in het linkermenu naar **`Systeembeheer`** -> **`Back-upmanager`**.
3. Klik rechtsboven op de knop **`Herstellen van lokale back-up`**.
4. Sleep het gedownloade back-upbestand naar het uploadgebied.
5. Klik op **`Indienen`** en wacht geduldig tot het systeem het herstel heeft voltooid. Dit proces kan enkele tientallen seconden tot enkele minuten duren.

### Aandachtspunten

* **Database-compatibiliteit**: Dit is het meest cruciale punt van deze methode. De **versie, tekenset en hoofdlettergevoeligheid** van uw PostgreSQL-database moeten overeenkomen met het bronbestand van de back-up. Met name de `schema`-naam moet identiek zijn.
* **Overeenkomst van commerciële plugins**: Zorg ervoor dat u alle commerciële plugins die nodig zijn voor de oplossing bezit en heeft ingeschakeld, anders wordt het herstel onderbroken.

---

## Methode 2: Direct SQL-bestand importeren (universeel, geschikter voor de community-versie)

Deze methode herstelt gegevens door de database rechtstreeks te bewerken, waarbij de "Back-upmanager" plugin wordt omzeild. Hierdoor zijn er geen beperkingen voor de professionele/enterprise-versie.

### Kernkenmerken

* **Voordelen**:
  1. **Geen versiebeperking**: Geschikt voor alle NocoBase-gebruikers, inclusief de community-versie.
  2. **Hoge compatibiliteit**: Is niet afhankelijk van de `dump`-tool in de applicatie; het werkt zolang u verbinding kunt maken met de database.
  3. **Hoge fouttolerantie**: Als de oplossing commerciële plugins bevat die u niet heeft, worden de bijbehorende functies niet ingeschakeld, maar dit heeft geen invloed op het normale gebruik van andere functies en de applicatie kan succesvol worden gestart.
* **Beperkingen**:
  1. **Vereist database-vaardigheden**: Gebruikers moeten over basisvaardigheden voor databasebeheer beschikken, zoals het uitvoeren van een `.sql`-bestand.
  2. **Verlies van systeembestanden**: **Bij deze methode gaan alle systeembestanden verloren**, inclusief sjabloonbestanden voor afdrukken, bestanden geüpload in bestandsvelden van tabellen, enz.

### Operatiestappen

**Stap 1: Bereid een schone database voor**

Bereid een gloednieuwe, lege database voor op de gegevens die u gaat importeren.

**Stap 2: Importeer het `.sql`-bestand in de database**

Verkrijg het gedownloade databasebestand (meestal in `.sql`-formaat) en importeer de inhoud ervan in de database die u in de vorige stap heeft voorbereid. De uitvoering kan op verschillende manieren, afhankelijk van uw omgeving:

* **Optie A: Via de server-opdrachtregel (bijv. Docker)**
  Als u Docker gebruikt om NocoBase en de database te installeren, kunt u het `.sql`-bestand naar de server uploaden en de opdracht `docker exec` gebruiken om de import uit te voeren. Stel dat uw PostgreSQL-container `my-nocobase-db` heet en de bestandsnaam `ticket_system.sql` is:

  ```bash
  # Kopieer het sql-bestand naar de container
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Ga de container in en voer de importopdracht uit
  docker exec -it my-nocobase-db psql -U uw_gebruikersnaam -d uw_databasenaam -f /tmp/ticket_system.sql
  ```
* **Optie B: Via een externe database-client**
  Als de poort van uw database openstaat, kunt u elke grafische database-client gebruiken (zoals DBeaver, Navicat, pgAdmin, enz.) om verbinding te maken met de database, een nieuw queryvenster te openen, de volledige inhoud van het `.sql`-bestand erin te plakken en uit te voeren.

**Stap 3: Verbind de database en start de applicatie**

Configureer de opstartparameters van uw NocoBase (zoals omgevingsvariabelen `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, enz.) zodat deze verwijzen naar de database waarin u zojuist de gegevens heeft geïmporteerd. Start vervolgens de NocoBase-service op de normale manier.

### Aandachtspunten

* **Database-machtigingen**: Deze methode vereist dat u beschikt over een account en wachtwoord waarmee u de database rechtstreeks kunt beheren.
* **Status van plugins**: Na een succesvolle import zijn de gegevens van commerciële plugins weliswaar aanwezig in het systeem, maar als u de bijbehorende plugins lokaal niet heeft geïnstalleerd en ingeschakeld, kunnen de gerelateerde functies niet worden weergegeven of gebruikt. Dit zal de applicatie echter niet laten crashen.

---

## Samenvatting en vergelijking

| Kenmerk | Methode 1: Back-upmanager | Methode 2: Directe SQL-import |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Doelgroep** | **Professionele/Enterprise**-gebruikers | **Alle gebruikers** (inclusief community-versie) |
| **Gebruiksgemak** | ⭐⭐⭐⭐⭐ (Zeer eenvoudig, UI-bediening) | ⭐⭐⭐ (Vereist basiskennis van databases) |
| **Omgevingseisen** | **Streng**, database- en systeemversies moeten in hoge mate compatibel zijn | **Gemiddeld**, database-compatibiliteit vereist |
| **Plugin-afhankelijkheid** | **Sterke afhankelijkheid**, plugins worden gecontroleerd tijdens herstel; het ontbreken van een plugin leidt tot **mislukt herstel**. | **Functionaliteit is sterk afhankelijk van plugins**. Gegevens kunnen onafhankelijk worden geïmporteerd, het systeem heeft basisfuncties. Maar bij ontbreken van de bijbehorende plugins zullen de gerelateerde functies **volledig onbruikbaar** zijn. |
| **Systeembestanden** | **Volledig behouden** (afdruksjablonen, geüploade bestanden, enz.) | **Gaan verloren** (afdruksjablonen, geüploade bestanden, enz.) |
| **Aanbevolen scenario** | Enterprise-gebruikers met een gecontroleerde, consistente omgeving die volledige functionaliteit nodig hebben | Ontbreken van sommige plugins, streven naar hoge compatibiliteit en flexibiliteit, niet-professionele/enterprise-gebruikers, acceptatie van verlies van bestandsfunctionaliteit |

We hopen dat deze handleiding u helpt bij het succesvol implementeren van het ticketsysteem. Mocht u tijdens het proces problemen ondervinden, neem dan gerust contact met ons op!