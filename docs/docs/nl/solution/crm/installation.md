:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/solution/crm/installation) voor nauwkeurige informatie.
:::

# Hoe te installeren

> De huidige versie wordt geïmplementeerd via **back-up en herstel**. In toekomstige versies stappen we mogelijk over op **incrementele migratie**, zodat de oplossing eenvoudiger in uw bestaande systemen kan worden geïntegreerd.

Om u te helpen de CRM 2.0-oplossing snel en soepel in uw eigen NocoBase-omgeving te implementeren, bieden wij twee herstelmethoden aan. Kies de methode die het beste bij uw gebruikersversie en technische achtergrond past.

Voordat u begint, moet u ervoor zorgen dat:

- U al een basis NocoBase-omgeving heeft. Raadpleeg voor de installatie van het hoofdsysteem de gedetailleerde [officiële installatiedocumentatie](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase-versie **v2.1.0-beta.2 en hoger**
- U de bijbehorende bestanden van het CRM-systeem heeft gedownload:
  - **Back-upbestand**: [nocobase_crm_v2_backup_260223.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260223.nbdata) - Geschikt voor methode één
  - **SQL-bestand**: [nocobase_crm_v2_sql_260223.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260223.zip) - Geschikt voor methode twee

**Belangrijke opmerking**:
- Deze oplossing is gemaakt op basis van **PostgreSQL 16**, zorg ervoor dat uw omgeving PostgreSQL 16 gebruikt.
- **DB_UNDERSCORED mag niet true zijn**: Controleer uw `docker-compose.yml` bestand en zorg ervoor dat de omgevingsvariabele `DB_UNDERSCORED` niet op `true` is ingesteld, anders ontstaat er een conflict met de back-up van de oplossing, wat leidt tot een mislukt herstel.

---

## Methode één: Herstellen met de back-upmanager (aanbevolen voor Pro/Enterprise-gebruikers)

Deze methode maakt gebruik van de in NocoBase ingebouwde "[Back-upmanager](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise-versie) plugin voor herstel met één klik, wat de eenvoudigste handeling is. Er zijn echter bepaalde eisen aan de omgeving en de gebruikersversie.

### Kernkenmerken

* **Voordelen**:
  1. **Handige bediening**: Kan worden voltooid in de UI-interface en kan alle configuraties, inclusief plugins, volledig herstellen.
  2. **Volledig herstel**: **In staat om alle systeembestanden te herstellen**, inclusief sjabloonbestanden voor afdrukken, bestanden geüpload in bestandsvelden van collecties, enz., om de functionele integriteit te waarborgen.
* **Beperkingen**:
  1. **Beperkt tot Pro/Enterprise-versie**: "Back-upmanager" is een plugin op ondernemingsniveau, alleen beschikbaar voor Pro/Enterprise-gebruikers.
  2. **Strenge omgevingseisen**: Vereist dat uw databaseomgeving (versie, hoofdlettergevoeligheid, enz.) zeer compatibel is met de omgeving waarin de back-up is gemaakt.
  3. **Plugin-afhankelijkheid**: Als de oplossing commerciële plugins bevat die niet in uw lokale omgeving aanwezig zijn, zal het herstel mislukken.

### Stappen

**Stap 1: [Sterk aanbevolen] Gebruik de `full` image om de applicatie te starten**

Om herstelfouten door het ontbreken van een databaseclient te voorkomen, raden wij u ten zeerste aan de `full`-versie van de Docker-image te gebruiken. Deze bevat alle noodzakelijke ondersteunende programma's, zodat u geen extra configuratie hoeft uit te voeren.

Voorbeeld van de instructie om de image op te halen:

```bash
docker pull nocobase/nocobase:beta-full
```

Gebruik vervolgens deze image om uw NocoBase-service te starten.

> **Opmerking**: Als u de `full` image niet gebruikt, moet u mogelijk handmatig de `pg_dump` databaseclient in de container installeren, wat een omslachtig en onstabiel proces is.

**Stap 2: Schakel de "Back-upmanager" plugin in**

1. Log in op uw NocoBase-systeem.
2. Ga naar **`Plugin-beheer`**.
3. Zoek en schakel de **`Back-upmanager`** plugin in.

**Stap 3: Herstellen vanaf een lokaal back-upbestand**

1. Vernieuw de pagina nadat u de plugin heeft ingeschakeld.
2. Ga naar **`Systeembeheer`** -> **`Back-upmanager`** in het linkermenu.
3. Klik op de knop **`Herstellen van lokale back-up`** in de rechterbovenhoek.
4. Sleep het gedownloade back-upbestand naar het uploadgebied.
5. Klik op **`Indienen`** en wacht geduldig tot het systeem het herstel heeft voltooid. Dit proces kan enkele tientallen seconden tot enkele minuten duren.

### Aandachtspunten

* **Databasecompatibiliteit**: Dit is het meest cruciale punt van deze methode. De **versie, tekenset en hoofdlettergevoeligheid** van uw PostgreSQL-database moeten overeenkomen met het bronbestand van de back-up. Met name de `schema`-naam moet consistent zijn.
* **Matching van commerciële plugins**: Zorg ervoor dat u alle commerciële plugins die nodig zijn voor de oplossing al bezit en heeft ingeschakeld, anders wordt het herstel onderbroken.

---

## Methode twee: Direct SQL-bestand importeren (universeel, geschikter voor de Community-versie)

Deze methode herstelt gegevens door de database rechtstreeks te bewerken, waarbij de "Back-upmanager" plugin wordt omzeild. Daarom zijn er geen beperkingen voor de Pro/Enterprise-versie.

### Kernkenmerken

* **Voordelen**:
  1. **Geen versiebeperking**: Geschikt voor alle NocoBase-gebruikers, inclusief de Community-versie.
  2. **Hoge compatibiliteit**: Is niet afhankelijk van de `dump`-tool in de applicatie; zolang u verbinding kunt maken met de database, kunt u de handeling uitvoeren.
  3. **Hoge fouttolerantie**: Als de oplossing commerciële plugins bevat die u niet heeft, worden de bijbehorende functies niet ingeschakeld, maar dit heeft geen invloed op het normale gebruik van andere functies en de applicatie kan succesvol worden gestart.
* **Beperkingen**:
  1. **Vereist databasevaardigheden**: Gebruikers moeten over basisvaardigheden voor databasebeheer beschikken, zoals het uitvoeren van een `.sql`-bestand.
  2. **Verlies van systeembestanden**: **Bij deze methode gaan alle systeembestanden verloren**, inclusief sjabloonbestanden voor afdrukken, bestanden geüpload in bestandsvelden van collecties, enz.

### Stappen

**Stap 1: Bereid een schone database voor**

Bereid een gloednieuwe, lege database voor voor de gegevens die u gaat importeren.

**Stap 2: Importeer het `.sql`-bestand in de database**

Haal het gedownloade databasebestand op (meestal in `.sql`-formaat) en importeer de inhoud ervan in de database die u in de vorige stap heeft voorbereid. Er zijn verschillende manieren om dit uit te voeren, afhankelijk van uw omgeving:

* **Optie A: Via de server-opdrachtregel (bijvoorbeeld met Docker)**
  Als u Docker gebruikt om NocoBase en de database te installeren, kunt u het `.sql`-bestand naar de server uploaden en vervolgens de opdracht `docker exec` gebruiken om de import uit te voeren. Stel dat uw PostgreSQL-container `my-nocobase-db` heet en de bestandsnaam `nocobase_crm_v2_sql_260223.sql` is:

  ```bash
  # Kopieer het sql-bestand naar de container
  docker cp nocobase_crm_v2_sql_260223.sql my-nocobase-db:/tmp/
  # Ga de container in om de importinstructie uit te voeren
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260223.sql
  ```
* **Optie B: Via een externe databaseclient (Navicat, enz.)**
  Als de poort van uw database is blootgesteld, kunt u elke grafische databaseclient (zoals Navicat, DBeaver, pgAdmin, enz.) gebruiken om verbinding te maken met de database, en vervolgens:
  1. Klik met de rechtermuisknop op de doeldatabase.
  2. Kies "SQL-bestand uitvoeren" of "SQL-script uitvoeren".
  3. Selecteer het gedownloade `.sql`-bestand en voer het uit.

**Stap 3: Verbind de database en start de applicatie**

Configureer uw NocoBase-opstartparameters (zoals omgevingsvariabelen `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, enz.) zodat deze verwijzen naar de database waarin u zojuist de gegevens heeft geïmporteerd. Start vervolgens de NocoBase-service op de normale manier.

### Aandachtspunten

* **Databaserechten**: Deze methode vereist dat u beschikt over een account en wachtwoord waarmee u de database rechtstreeks kunt beheren.
* **Plugin-status**: Na een succesvolle import blijven de gegevens van de commerciële plugins in het systeem aanwezig. Als u de bijbehorende plugins echter niet lokaal heeft geïnstalleerd en ingeschakeld, worden de relevante functies niet weergegeven of zijn ze niet bruikbaar. Dit zal de applicatie echter niet laten crashen.

---

## Samenvatting en vergelijking

| Kenmerk | Methode één: Back-upmanager | Methode twee: Direct SQL importeren |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Toepasbare gebruikers** | **Pro/Enterprise-versie** gebruikers | **Alle gebruikers** (inclusief Community-versie) |
| **Gemak van bediening** | ⭐⭐⭐⭐⭐ (Zeer eenvoudig, UI-bediening) | ⭐⭐⭐ (Vereist basisdatabasekennis) |
| **Omgevingseisen** | **Streng**, database, systeemversie enz. moeten zeer compatibel zijn | **Algemeen**, vereist databasecompatibiliteit |
| **Plugin-afhankelijkheid** | **Sterke afhankelijkheid**, bij herstel worden plugins gecontroleerd; het ontbreken van een plugin leidt tot **mislukt herstel**. | **Functies zijn sterk afhankelijk van plugins**. Gegevens kunnen onafhankelijk worden geïmporteerd, het systeem beschikt over basisfuncties. Maar als de bijbehorende plugins ontbreken, zullen de relevante functies **volledig onbruikbaar** zijn. |
| **Systeembestanden** | **Volledig behouden** (afdruksjablonen, geüploade bestanden, enz.) | **Gaan verloren** (afdruksjablonen, geüploade bestanden, enz.) |
| **Aanbevolen scenario's** | Zakelijke gebruikers met een controleerbare en consistente omgeving die volledige functionaliteit nodig hebben | Gebruikers die bepaalde plugins missen, streven naar hoge compatibiliteit en flexibiliteit, geen Pro/Enterprise-gebruikers, en het ontbreken van bestandsfuncties kunnen accepteren |

We hopen dat deze handleiding u helpt bij het succesvol implementeren van het CRM 2.0-systeem. Als u tijdens het proces problemen ondervindt, neem dan gerust contact met ons op!