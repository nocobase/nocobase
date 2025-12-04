:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt

Datamodellering är ett avgörande steg när du designar databaser, som innebär en djupgående analys och abstraktion av olika typer av data och deras inbördes relationer i den verkliga världen. Under denna process försöker vi avslöja de inneboende kopplingarna mellan data och formalisera dem till datamodeller, vilket lägger grunden för informationssystemets databasstruktur. NocoBase är en datamodellsdriven plattform med följande funktioner:

## Stöd för data från olika källor

NocoBase kan ansluta till datakällor från olika ursprung, inklusive vanliga databaser, API/SDK-plattformar och filer.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase erbjuder ett [plugin för datakällshantering](/data-sources/data-source-manager) för att hantera olika datakällor och deras samlingar. Pluginet för datakällshantering tillhandahåller endast ett gränssnitt för att hantera alla datakällor och ger inte möjlighet att direkt ansluta till datakällor. Det måste användas tillsammans med olika datakälls-plugins. De datakällor som stöds för närvarande inkluderar:

- [Huvuddatabas](/data-sources/data-source-main): NocoBase huvuddatabas, med stöd för relationsdatabaser som MySQL, PostgreSQL och MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Använd KingbaseES-databasen som datakälla, vilken kan användas både som huvuddatabas och som extern databas.
- [Extern MySQL](/data-sources/data-source-external-mysql): Använd en extern MySQL-databas som datakälla.
- [Extern MariaDB](/data-sources/data-source-external-mariadb): Använd en extern MariaDB-databas som datakälla.
- [Extern PostgreSQL](/data-sources/data-source-external-postgres): Använd en extern PostgreSQL-databas som datakälla.
- [Extern MSSQL](/data-sources/data-source-external-mssql): Använd en extern MSSQL (SQL Server)-databas som datakälla.
- [Extern Oracle](/data-sources/data-source-external-oracle): Använd en extern Oracle-databas som datakälla.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Erbjuder en mängd olika datamodelleringsverktyg

**Enkelt gränssnitt för samlingshantering**: Används för att skapa olika modeller (samlingar) eller ansluta till befintliga.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Visuellt gränssnitt i ER-stil**: Används för att extrahera entiteter och deras relationer från användar- och affärskrav. Detta ger ett intuitivt och lättförståeligt sätt att beskriva datamodeller. Genom ER-diagram kan ni tydligare förstå systemets huvudsakliga dataentiteter och deras kopplingar.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Stöd för olika typer av samlingar

| Samling | Beskrivning |
| - | - |
| [Allmän samling](/data-sources/data-source-main/general-collection) | Inbyggda vanliga systemfält |
| [Kalendersamling](/data-sources/calendar/calendar-collection) | Används för att skapa kalenderrelaterade händelsesamlingar |
| Kommentarsamling | Används för att lagra kommentarer eller feedback om data |
| [Trädsamling](/data-sources/collection-tree) | Trädstrukturerad samling, stöder för närvarande endast grannlistmodellen |
| [Filsamling](/data-sources/file-manager/file-collection) | Används för hantering av fillagring |
| [SQL-samling](/data-sources/collection-sql) | Inte en faktisk databassamling, utan visualiserar SQL-frågor på ett strukturerat sätt |
| [Anslut till databasvy](/data-sources/collection-view) | Ansluter till befintliga databasvyer |
| Uttryckssamling | Används för dynamiska uttrycksscenarier i arbetsflöden |
| [Anslut till extern data](/data-sources/collection-fdw) | Tillåter databassystemet att direkt komma åt och fråga data i externa datakällor baserat på FDW-teknik. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

För mer information, se avsnittet ”[Samling / Översikt](/data-sources/data-modeling/collection)”.

## Erbjuder ett brett utbud av fälttyper

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

För mer information, se avsnittet ”[Samlingsfält / Översikt](/data-sources/data-modeling/collection-fields)”.