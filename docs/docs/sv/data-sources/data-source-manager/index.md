---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Datakällshantering

## Introduktion

NocoBase erbjuder ett plugin för datakällshantering, som används för att hantera datakällor och deras samlingar. Pluginet för datakällshantering tillhandahåller endast ett hanteringsgränssnitt för alla datakällor och erbjuder inte möjligheten att ansluta till datakällor. Det måste användas tillsammans med olika datakällsplugins. De datakällor som för närvarande stöds för anslutning inkluderar:

- [Huvuddatabas](/data-sources/data-source-main): NocoBases huvuddatabas, som stöder relationella databaser som MySQL, PostgreSQL och MariaDB.
- [Extern MySQL](/data-sources/data-source-external-mysql): Använd en extern MySQL-databas som datakälla.
- [Extern MariaDB](/data-sources/data-source-external-mariadb): Använd en extern MariaDB-databas som datakälla.
- [Extern PostgreSQL](/data-sources/data-source-external-postgres): Använd en extern PostgreSQL-databas som datakälla.
- [Extern MSSQL](/data-sources/data-source-external-mssql): Använd en extern MSSQL-databas (SQL Server) som datakälla.
- [Extern Oracle](/data-sources/data-source-external-oracle): Använd en extern Oracle-databas som datakälla.

Utöver detta kan fler typer utökas via plugins, vilket kan vara vanliga databastyper eller plattformar som tillhandahåller API:er (SDK:er).

## Installation

Inbyggt plugin, ingen separat installation krävs.

## Användningsinstruktioner

När applikationen initieras och installeras tillhandahålls en datakälla som standard för att lagra NocoBase-data, känd som huvuddatabasen. För mer information, se [Huvuddatabas](/data-sources/data-source-main/) dokumentationen.

### Externa datakällor

Externa databaser stöds som datakällor. För mer information, se [Externa databaser / Introduktion](/data-sources/data-source-manager/external-database) dokumentationen.

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Stöd för synkronisering av anpassade databastabeller

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Ni kan också ansluta till data från HTTP API-källor. För mer information, se [REST API-datakälla](/data-sources/data-source-rest-api/) dokumentationen.