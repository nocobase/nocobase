:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/solution/crm/installation).
:::

# Hur Ni installerar

> Den nuvarande versionen distribueras via **säkerhetskopiering och återställning**. I framtida versioner kan vi komma att byta till **inkrementell migrering** för att göra det enklare att integrera lösningen i Era befintliga system.

För att Ni ska kunna distribuera CRM 2.0-lösningen snabbt och smidigt till Er egen NocoBase-miljö erbjuder vi två återställningsmetoder. Vänligen välj den som bäst passar Er användarversion och tekniska bakgrund.

Innan Ni börjar, se till att:

- Ni redan har en grundläggande NocoBase-driftsmiljö. För installation av huvudsystemet, se den mer detaljerade [officiella installationsdokumentationen](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase-version **v2.1.0-beta.2 och senare**
- Ni har laddat ner motsvarande filer för CRM-systemet:
  - **Säkerhetskopia**: [nocobase_crm_v2_backup_260223.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260223.nbdata) - Gäller metod ett
  - **SQL-fil**: [nocobase_crm_v2_sql_260223.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260223.zip) - Gäller metod två

**Viktig information**:
- Denna lösning är byggd på **PostgreSQL 16**-databasen, se till att Er miljö använder PostgreSQL 16.
- **DB_UNDERSCORED får inte vara true**: Kontrollera Er `docker-compose.yml`-fil och se till att miljövariabeln `DB_UNDERSCORED` inte är inställd på `true`, annars kommer det att krocka med lösningens säkerhetskopia och leda till att återställningen misslyckas.

---

## Metod 1: Återställ med säkerhetskopieringshanteraren (rekommenderas för Pro/Enterprise-användare)

Detta tillvägagångssätt använder NocoBase inbyggda plugin "[Säkerhetskopieringshanterare](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise-version) för återställning med ett klick, vilket är det enklaste tillvägagångssättet. Det ställer dock vissa krav på miljö och användarversion.

### Huvudegenskaper

* **Fördelar**:
  1. **Smidig användning**: Kan slutföras i UI-gränssnittet och kan helt återställa alla konfigurationer inklusive plugin.
  2. **Fullständig återställning**: **Kan återställa alla systemfiler**, inklusive mallutskriftsfiler, filer uppladdade i filfält i samlingar etc., vilket säkerställer funktionell integritet.
* **Begränsningar**:
  1. **Endast Pro/Enterprise-version**: "Säkerhetskopieringshanterare" är ett plugin på företagsnivå och är endast tillgängligt för Pro/Enterprise-användare.
  2. **Stränga miljökrav**: Kräver att Er databasmiljö (version, inställningar för skiftlägeskänslighet etc.) är högt kompatibel med miljön där säkerhetskopian skapades.
  3. **Plugin-beroende**: Om lösningen innehåller kommersiella plugin som inte finns i Er lokala miljö kommer återställningen att misslyckas.

### Steg för steg

**Steg 1: [Rekommenderas starkt] Starta applikationen med `full`-avbildningen**

För att undvika återställningsfel på grund av saknad databasklient rekommenderar vi starkt att Ni använder `full`-versionen av Docker-avbildningen. Den har alla nödvändiga stödprogram inbyggda, så att Ni inte behöver göra några extra konfigurationer.

Exempel på kommando för att hämta avbildningen:

```bash
docker pull nocobase/nocobase:beta-full
```

Använd sedan denna avbildning för att starta Er NocoBase-tjänst.

> **Obs**: Om Ni inte använder `full`-avbildningen kan Ni behöva installera databasklienten `pg_dump` manuellt i containern, vilket är en krånglig och instabil process.

**Steg 2: Aktivera pluginet "Säkerhetskopieringshanterare"**

1. Logga in i Ert NocoBase-system.
2. Gå till **`Pluginhantering`**.
3. Hitta och aktivera pluginet **`Säkerhetskopieringshanterare`**.

**Steg 3: Återställ från lokal säkerhetskopia**

1. Efter att Ni aktiverat pluginet, ladda om sidan.
2. Gå till **`Systemadministration`** -> **`Säkerhetskopieringshanterare`** i menyn till vänster.
3. Klicka på knappen **`Återställ från lokal säkerhetskopia`** i det övre högra hörnet.
4. Dra den nedladdade säkerhetskopian till uppladdningsområdet.
5. Klicka på **`Skicka`** och vänta tålmodigt på att systemet slutför återställningen. Denna process kan ta allt från några tiotals sekunder till flera minuter.

### Observera

* **Databaskompatibilitet**: Detta är den mest kritiska punkten med denna metod. Er PostgreSQL-databas **version, teckenuppsättning och inställningar för skiftlägeskänslighet** måste matcha källfilen för säkerhetskopian. Särskilt namnet på `schema` måste vara konsekvent.
* **Matchning av kommersiella plugin**: Se till att Ni redan äger och har aktiverat alla kommersiella plugin som krävs för lösningen, annars kommer återställningen att avbrytas.

---

## Metod 2: Importera SQL-fil direkt (universell, mer lämplig för Community-versionen)

Detta tillvägagångssätt återställer data genom att direkt operera på databasen och kringgår pluginet "Säkerhetskopieringshanterare", vilket innebär att det inte finns några begränsningar för Pro/Enterprise-plugin.

### Huvudegenskaper

* **Fördelar**:
  1. **Inga versionsbegränsningar**: Gäller alla NocoBase-användare, inklusive Community-versionen.
  2. **Hög kompatibilitet**: Beror inte på `dump`-verktyget i applikationen; så länge Ni kan ansluta till databasen kan Ni utföra åtgärden.
  3. **Hög feltolerans**: Om lösningen innehåller kommersiella plugin som Ni inte har, kommer de relaterade funktionerna inte att aktiveras, men det påverkar inte normal användning av andra funktioner och applikationen kan startas framgångsrikt.
* **Begränsningar**:
  1. **Kräver databaskunskap**: Kräver att användaren har grundläggande kunskaper i databasoperationer, till exempel hur man kör en `.sql`-fil.
  2. **Förlust av systemfiler**: **Denna metod kommer att förlora alla systemfiler**, inklusive mallutskriftsfiler, filer uppladdade i filfält i samlingar etc.

### Steg för steg

**Steg 1: Förbered en ren databas**

Förbered en helt ny, tom databas för den data Ni ska importera.

**Steg 2: Importera `.sql`-filen till databasen**

Hämta den nedladdade databasfilen (vanligtvis i `.sql`-format) och importera dess innehåll till den databas Ni förberedde i föregående steg. Det finns flera sätt att utföra detta på, beroende på Er miljö:

* **Alternativ A: Via serverns kommandorad (med Docker som exempel)**
  Om Ni använder Docker för att installera NocoBase och databasen kan Ni ladda upp `.sql`-filen till servern och sedan använda kommandot `docker exec` för att utföra importen. Anta att Er PostgreSQL-container heter `my-nocobase-db` och filnamnet är `nocobase_crm_v2_sql_260223.sql`:

  ```bash
  # Kopiera sql-filen till containern
  docker cp nocobase_crm_v2_sql_260223.sql my-nocobase-db:/tmp/
  # Gå in i containern och exekvera importkommandot
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260223.sql
  ```
* **Alternativ B: Via en fjärrdatabasklient (Navicat etc.)**
  Om Er databas har en exponerad port kan Ni använda valfri grafisk databasklient (som Navicat, DBeaver, pgAdmin etc.) för att ansluta till databasen, och sedan:
  1. Högerklicka på måldatabasen
  2. Välj "Kör SQL-fil" eller "Exekvera SQL-skript"
  3. Välj den nedladdade `.sql`-filen och exekvera

**Steg 3: Anslut till databasen och starta applikationen**

Konfigurera Era startparametrar för NocoBase (såsom miljövariablerna `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` etc.) så att de pekar på den databas där Ni just importerade data. Starta sedan NocoBase-tjänsten som vanligt.

### Observera

* **Databasbehörigheter**: Denna metod kräver att Ni har ett konto och lösenord som direkt kan operera på databasen.
* **Plugin-status**: Efter en lyckad import finns data för de kommersiella plugin som ingår i systemet kvar, men om Ni inte har installerat och aktiverat motsvarande plugin lokalt kommer de relaterade funktionerna inte att visas eller kunna användas. Detta kommer dock inte att leda till att applikationen kraschar.

---

## Sammanfattning och jämförelse

| Funktion | Metod 1: Säkerhetskopieringshanterare | Metod 2: Importera SQL direkt |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Tillämpliga användare** | **Pro/Enterprise-version** användare | **Alla användare** (inklusive Community-versionen) |
| **Användarvänlighet** | ⭐⭐⭐⭐⭐ (Mycket enkelt, UI-hantering) | ⭐⭐⭐ (Kräver grundläggande databaskunskap) |
| **Miljökrav** | **Stränga**, databas- och systemversioner etc. måste vara högt kompatibla | **Allmänna**, kräver databaskompatibilitet |
| **Plugin-beroende** | **Starkt beroende**, plugin valideras vid återställning; om något plugin saknas leder det till **misslyckad återställning**. | **Funktioner är starkt beroende av plugin**. Data kan importeras oberoende och systemet har grundläggande funktionalitet. Men om motsvarande plugin saknas kommer relaterade funktioner att vara **helt oanvändbara**. |
| **Systemfiler** | **Fullständigt bevarade** (utskriftsmallar, uppladdade filer etc.) | **Kommer att förloras** (utskriftsmallar, uppladdade filer etc.) |
| **Rekommenderade scenarier** | Företagsanvändare med kontrollerad och konsekvent miljö som behöver fullständig funktionalitet | Saknar vissa plugin, eftersträvar hög kompatibilitet och flexibilitet, användare som inte har Pro/Enterprise-versionen, kan acceptera avsaknad av filfunktioner |

Vi hoppas att denna handledning hjälper Er att framgångsrikt distribuera CRM 2.0-systemet. Om Ni stöter på några problem under processen är Ni välkomna att kontakta oss när som helst!