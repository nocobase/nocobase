---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Migrationshanterare

## Introduktion

Denna plugin hjälper er att överföra applikationskonfigurationer från en applikationsmiljö till en annan. Migrationshanteraren fokuserar främst på migrering av "applikationskonfigurationer". Om ni behöver en komplett datamigrering rekommenderar vi att ni använder '[Säkerhetskopieringshanteraren](../backup-manager/index.mdx)' för att säkerhetskopiera och återställa hela er applikation.

## Installation

Migrationshanteraren är beroende av [Säkerhetskopieringshanteraren](../backup-manager/index.mdx) pluginen. Se till att den redan är installerad och aktiverad.

## Process och principer

Migrationshanteraren överför tabeller och data från den primära databasen, baserat på angivna migrationsregler, från en applikation till en annan. Observera att den inte migrerar data från externa databaser eller underapplikationer.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Migrationsregler

### Inbyggda regler

Migrationshanteraren kan migrera alla tabeller i den primära databasen och stöder för närvarande följande fem regler:

- Endast struktur: Migrerar endast tabellernas struktur (schema) – ingen data infogas eller uppdateras.
- Skriv över (rensa och infoga igen): Raderar alla befintliga poster från måltabellerna i databasen och infogar sedan den nya datan.
- Infoga eller uppdatera (Upsert): Kontrollerar om varje post finns (via primärnyckel). Om den finns uppdateras posten; annars infogas den.
- Infoga och ignorera dubbletter: Infogar nya poster, men om en post redan finns (via primärnyckel) ignoreras infogningen (inga uppdateringar sker).
- Hoppa över: Hoppar över all bearbetning för tabellen (inga strukturförändringar, ingen datamigrering).

**Anmärkningar:**

- "Skriv över", "Infoga eller uppdatera" och "Infoga och ignorera dubbletter" synkroniserar även tabellstrukturförändringar.
- Om en tabell använder ett autoinkrementerande ID som primärnyckel, eller om den saknar primärnyckel, kan varken "Infoga eller uppdatera" eller "Infoga och ignorera dubbletter" tillämpas.
- "Infoga eller uppdatera" och "Infoga och ignorera dubbletter" förlitar sig på primärnyckeln för att avgöra om posten redan finns.

### Detaljerad design

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Konfigurationsgränssnitt

Konfigurera migrationsregler

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Aktivera oberoende regler

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Välj oberoende regler och de tabeller som ska bearbetas enligt de aktuella oberoende reglerna.

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Migrationsfiler

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Skapa en ny migrering

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Utföra en migrering

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Kontroll av applikationens miljövariabler (läs mer om [Miljövariabler](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Om några saknas kommer ett popup-fönster att uppmana er att ange de nödvändiga nya miljövariablerna här, och sedan fortsätta.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Migrationsloggar

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Återställning

Innan en migrering utförs säkerhetskopieras den aktuella applikationen automatiskt. Om migreringen misslyckas eller resultatet inte är som förväntat, kan ni återställa med hjälp av [Säkerhetskopieringshanteraren](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)