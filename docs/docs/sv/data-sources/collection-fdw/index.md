---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Anslut externa datatabeller (FDW)

## Introduktion

Detta är en plugin som möjliggör anslutning till fjärrdatatabeller, baserad på databasens foreign data wrapper-implementering. För närvarande stöds MySQL- och PostgreSQL-databaser.

:::info{title="Ansluta datakällor vs. Ansluta externa datatabeller"}
- **Ansluta datakällor** innebär att upprätta en anslutning till en specifik databas eller API-tjänst, och ni kan då fullt ut använda databasens funktioner eller de tjänster som API:et tillhandahåller;
- **Ansluta externa datatabeller** innebär att hämta data externt och mappa den för lokal användning. I databassammanhang kallas det FDW (Foreign Data Wrapper), en databasteknik som fokuserar på att använda fjärrtabeller som lokala tabeller och endast kan ansluta en i taget. Eftersom det är fjärråtkomst finns det olika begränsningar och restriktioner vid användning.

De två kan också användas i kombination. Den förstnämnda används för att upprätta en anslutning till datakällan, och den sistnämnda för åtkomst över datakällor. Till exempel, om en viss PostgreSQL-datakälla är ansluten, kan en tabell i den datakällan vara en extern datatabell skapad baserat på FDW.
:::

### MySQL

MySQL använder `federated`-motorn, vilken behöver aktiveras, och stöder anslutning till fjärr-MySQL samt protokollkompatibla databaser, som MariaDB. För mer information, se dokumentationen för [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

I PostgreSQL kan olika typer av `fdw`-tillägg användas för att stödja olika typer av fjärrdata. De för närvarande stödda tilläggen inkluderar:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Anslut till en fjärr-PostgreSQL-databas i PostgreSQL.
- [mysql_fdw(under utveckling)](https://github.com/EnterpriseDB/mysql_fdw): Anslut till en fjärr-MySQL-databas i PostgreSQL.
- För andra typer av fdw-tillägg, se [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). För att ansluta dem till NocoBase behöver ni implementera motsvarande anpassningsgränssnitt i koden.

## Installation

Förutsättningar

- Om NocoBases huvuddatabas är MySQL, behöver `federated` aktiveras. Se [Hur man aktiverar federated-motorn i MySQL](./enable-federated.md)

Installera och aktivera sedan pluginen via pluginhanteraren

![Installera och aktivera pluginen](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Användarmanual

Under "Samlingshanteraren > Skapa samling", välj "Anslut till extern data"

![Anslut extern data](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

I rullgardinsmenyn "Databastjänst", välj en befintlig databastjänst, eller "Skapa databastjänst"

![Databastjänst](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Skapa en databastjänst

![Skapa databastjänst](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Efter att ha valt databastjänsten, välj den datatabell ni vill ansluta i rullgardinsmenyn "Fjärrtabell".

![Välj den datatabell ni vill ansluta](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Konfigurera fältinformation

![Konfigurera fältinformation](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Om fjärrtabellen har strukturella ändringar, kan ni också "Synkronisera från fjärrtabell"

![Synkronisera från fjärrtabell](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synkronisering av fjärrtabell

![Synkronisering av fjärrtabell](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Slutligen visas den i gränssnittet

![Visas i gränssnittet](https://static-docs.nocobase.com/368fca27c99277d9360ca81350949357.png)