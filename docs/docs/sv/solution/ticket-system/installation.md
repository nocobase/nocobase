:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/solution/ticket-system/installation).
:::

# Hur Ni installerar

> Den nuvarande versionen använder **säkerhetskopiering och återställning** för driftsättning. I framtida versioner kan vi komma att byta till **inkrementell migrering** för att underlätta integreringen av lösningen i Era befintliga system.

För att Ni ska kunna driftsätta ärendesystemet snabbt och smidigt i Er egen NocoBase-miljö erbjuder vi två återställningsmetoder. Vänligen välj den som bäst passar Er användarversion och tekniska bakgrund.

Innan Ni börjar, se till att:

- Ni redan har en grundläggande NocoBase-miljö. För installation av huvudsystemet, vänligen se den detaljerade [officiella installationsdokumentationen](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase version **2.0.0-beta.5 och senare**
- Ni har laddat ner motsvarande filer för ärendesystemet:
  - **Säkerhetskopia**: [nocobase_tts_v2_backup_260302.nbdata](https://static-docs.nocobase.com/nocobase_tts_v2_backup_260302.nbdata) - Gäller för metod ett
  - **SQL-fil**: [nocobase_tts_v2_sql_260302.zip](https://static-docs.nocobase.com/nocobase_tts_v2_sql_260302.zip) - Gäller för metod två

**Viktig information**:
- Denna lösning är byggd på **PostgreSQL 16**. Se till att Er miljö använder PostgreSQL 16.
- **DB_UNDERSCORED får inte vara true**: Kontrollera Er `docker-compose.yml`-fil och säkerställ att miljövariabeln `DB_UNDERSCORED` inte är inställd på `true`, annars kommer det att krocka med lösningens säkerhetskopia och leda till misslyckad återställning.

---

## Metod 1: Återställ med säkerhetskopieringshanteraren (rekommenderas för Pro/Enterprise-användare)

Denna metod använder NocoBases inbyggda plugin "[säkerhetskopieringshanterare](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise) för återställning med ett klick, vilket är det enklaste tillvägagångssättet. Den ställer dock vissa krav på miljö och användarversion.

### Kärnegenskaper

* **Fördelar**:
  1. **Smidig hantering**: Kan slutföras i UI-gränssnittet och återställer alla konfigurationer inklusive plugins fullständigt.
  2. **Fullständig återställning**: **Kan återställa alla systemfiler**, inklusive mallar för utskrift, filer uppladdade i tabellers filfält etc., vilket säkerställer full funktionalitet.
* **Begränsningar**:
  1. **Endast Pro/Enterprise**: "Säkerhetskopieringshanteraren" är en plugin på företagsnivå och är endast tillgänglig för Pro/Enterprise-användare.
  2. **Stränga miljökrav**: Kräver att Er databasmiljö (version, inställningar för skiftlägeskänslighet etc.) är högt kompatibel med miljön där säkerhetskopian skapades.
  3. **Plugin-beroenden**: Om lösningen innehåller kommersiella plugins som inte finns i Er lokala miljö kommer återställningen att misslyckas.

### Steg för steg

**Steg 1: [Rekommenderas starkt] Starta applikationen med `full`-imagen**

För att undvika misslyckad återställning på grund av saknade databasklienter rekommenderar vi starkt att Ni använder `full`-versionen av Docker-imagen. Den innehåller alla nödvändiga stödprogram så att Ni slipper extra konfiguration.

Exempel på kommando för att hämta imagen:

```bash
docker pull nocobase/nocobase:beta-full
```

Använd sedan denna image för att starta Er NocoBase-tjänst.

> **Obs**: Om Ni inte använder `full`-imagen kan Ni behöva installera databasklienten `pg_dump` manuellt i containern, vilket är krångligt och instabilt.

**Steg 2: Aktivera pluginen "säkerhetskopieringshanterare"**

1. Logga in i Er NocoBase.
2. Gå till **`Pluginhantering`**.
3. Hitta och aktivera pluginen **`säkerhetskopieringshanterare`**.

**Steg 3: Återställ från lokal säkerhetskopia**

1. Uppdatera sidan efter att pluginen aktiverats.
2. Gå till **`Systemadministration`** -> **`säkerhetskopieringshanterare`** i vänstermenyn.
3. Klicka på knappen **`Återställ från lokal säkerhetskopia`** i övre högra hörnet.
4. Dra den nedladdade säkerhetskopian till uppladdningsområdet.
5. Klicka på **`Skicka`** och vänta tålmodigt på att systemet slutför återställningen. Processen kan ta allt från några tiotals sekunder till flera minuter.

### Observera

* **Databaskompatibilitet**: Detta är den mest kritiska punkten för denna metod. Er PostgreSQL-databass **version, teckenuppsättning och inställningar för skiftlägeskänslighet** måste matcha källfilen. Särskilt namnet på `schema` måste vara identiskt.
* **Matchning av kommersiella plugins**: Se till att Ni äger och har aktiverat alla kommersiella plugins som krävs för lösningen, annars kommer återställningen att avbrytas.

---

## Metod 2: Importera SQL-fil direkt (universell, passar bättre för Community-versionen)

Denna metod återställer data genom att operera direkt i databasen och går förbi pluginen "säkerhetskopieringshanterare", vilket innebär att det inte finns några begränsningar för Pro/Enterprise-plugins.

### Kärnegenskaper

* **Fördelar**:
  1. **Inga versionsbegränsningar**: Fungerar för alla NocoBase-användare, inklusive Community-versionen.
  2. **Hög kompatibilitet**: Beror inte på applikationens `dump`-verktyg; det fungerar så länge Ni kan ansluta till databasen.
  3. **Hög feltolerans**: Om lösningen innehåller kommersiella plugins som Ni saknar kommer relaterade funktioner inte att aktiveras, men det påverkar inte andra funktioners normala användning och applikationen kan startas framgångsrikt.
* **Begränsningar**:
  1. **Kräver databaskunskap**: Användaren behöver grundläggande kunskaper i databashantering, till exempel hur man kör en `.sql`-fil.
  2. **Systemfiler går förlorade**: **Denna metod förlorar alla systemfiler**, inklusive mallar för utskrift, filer uppladdade i tabellers filfält etc.

### Steg för steg

**Steg 1: Förbered en ren databas**

Förbered en helt ny, tom databas för den data Ni ska importera.

**Steg 2: Importera `.sql`-filen till databasen**

Hämta den nedladdade databasfilen (vanligtvis i `.sql`-format) och importera dess innehåll till databasen Ni förberedde i föregående steg. Det finns flera sätt att göra detta beroende på Er miljö:

* **Alternativ A: Via serverns kommandorad (exempel med Docker)**
  Om Ni använder Docker för att installera NocoBase och databasen kan Ni ladda upp `.sql`-filen till servern och använda kommandot `docker exec` för att utföra importen. Antag att Er PostgreSQL-container heter `my-nocobase-db` och filnamnet är `ticket_system.sql`:

  ```bash
  # Kopiera sql-filen till containern
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Gå in i containern och kör importkommandot
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/ticket_system.sql
  ```
* **Alternativ B: Via en fjärrdatabasklient**
  Om Er databasport är öppen kan Ni använda valfri grafisk databasklient (som DBeaver, Navicat, pgAdmin etc.) för att ansluta till databasen, öppna ett nytt frågefönster, klistra in hela innehållet från `.sql`-filen och köra det.

**Steg 3: Anslut databasen och starta applikationen**

Konfigurera Era startparametrar för NocoBase (såsom miljövariablerna `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` etc.) så att de pekar på databasen där Ni just importerade data. Starta sedan NocoBase-tjänsten som vanligt.

### Observera

* **Databasbehörigheter**: Denna metod kräver att Ni har ett konto och lösenord med behörighet att operera direkt i databasen.
* **Plugin-status**: Efter lyckad import finns data för kommersiella plugins i systemet, men om Ni inte har installerat och aktiverat motsvarande plugins lokalt kommer relaterade funktioner inte att visas eller kunna användas. Detta kommer dock inte att få applikationen att krascha.

---

## Sammanfattning och jämförelse

| Egenskap | Metod 1: Säkerhetskopieringshanterare | Metod 2: Direkt SQL-import |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Målanvändare** | **Pro/Enterprise**-användare | **Alla användare** (inklusive Community) |
| **Användarvänlighet** | ⭐⭐⭐⭐⭐ (Mycket enkelt, UI-hantering) | ⭐⭐⭐ (Kräver grundläggande databaskunskap) |
| **Miljökrav** | **Stränga**, databas och systemversioner måste vara högt kompatibla | **Allmänna**, kräver databaskompatibilitet |
| **Plugin-beroende** | **Starkt beroende**, plugins valideras vid återställning; saknas någon plugin leder det till **misslyckad återställning**. | **Funktioner är beroende av plugins**. Data kan importeras oberoende och systemet har grundläggande funktioner. Men om motsvarande plugins saknas blir relaterade funktioner **helt oanvändbara**. |
| **Systemfiler** | **Fullständigt bevarade** (utskriftsmallar, uppladdade filer etc.) | **Går förlorade** (utskriftsmallar, uppladdade filer etc.) |
| **Rekommenderat scenario** | Företagsanvändare med kontrollerad och enhetlig miljö som behöver fullständig funktionalitet | Saknar vissa plugins, söker hög kompatibilitet och flexibilitet, icke-Pro/Enterprise-användare, kan acceptera förlust av filfunktioner |

Vi hoppas att denna guide hjälper Er att driftsätta ärendesystemet framgångsrikt. Om Ni stöter på några problem under processen är Ni välkomna att kontakta oss när som helst!