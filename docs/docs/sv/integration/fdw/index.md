:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/integration/fdw/index).
:::

# Anslut externa datatabeller (FDW)

## Introduktion

Denna funktion ansluter till fjärrdatatabeller baserat på databasens Foreign Data Wrapper (FDW). För närvarande stöds databaserna MySQL och PostgreSQL.

:::info{title="Ansluta datakällor vs Ansluta externa datatabeller"}
- **Ansluta datakällor** avser att upprätta en anslutning till en specifik databas eller API-tjänst, där ni fullt ut kan använda databasens funktioner eller de tjänster som API:et tillhandahåller;
- **Ansluta externa datatabeller** avser att hämta data utifrån och mappa den för lokal användning. I databassammanhang kallas detta FDW (Foreign Data Wrapper), vilket är en databasteknik som fokuserar på att använda fjärrtabeller som om de vore lokala tabeller, och man kan endast ansluta en tabell åt gången. Eftersom det rör sig om fjärråtkomst finns det olika begränsningar och restriktioner vid användning.

De två kan även användas i kombination. Den förstnämnda används för att upprätta en anslutning till datakällan, och den sistnämnda används för åtkomst mellan olika datakällor. Till exempel kan en viss PostgreSQL-datakälla vara ansluten, och en specifik tabell i denna datakälla är en extern datatabell skapad baserat på FDW.
:::

### MySQL

MySQL använder motorn `federated`, som behöver aktiveras, och stöder anslutning till fjärr-MySQL och protokollkompatibla databaser som MariaDB. För mer detaljerad dokumentation, se [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

I PostgreSQL kan olika typer av `fdw`-tillägg användas för att stödja olika typer av fjärrdata. De tillägg som stöds för närvarande inkluderar:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Anslut till en fjärr-PostgreSQL-databas i PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Anslut till en fjärr-MySQL-databas i PostgreSQL.
- För övriga typer av fdw-tillägg, se [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Ni behöver implementera motsvarande anpassningsgränssnitt i koden för att ansluta till NocoBase.

## Förutsättningar

- Om NocoBases huvuddatabas är MySQL måste ni aktivera `federated`. Se [Hur man aktiverar federated-motorn i MySQL](./enable-federated)

Installera och aktivera sedan pluginet via plugin-hanteraren.

![Installera och aktivera pluginet](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Användarmanual

Under "Samlingshanterare > Skapa samling" i rullgardinsmenyn, välj "Anslut till externa data".

![Anslut externa data](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

I rullgardinsmenyn för "Databasserver", välj en befintlig databastjänst eller "Skapa databasserver".

![Databastjänst](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Skapa en databasserver.

![Skapa databastjänst](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Efter att ni har valt databasserver, välj den datatabell ni vill ansluta i rullgardinsmenyn för "Fjärrtabell".

![Välj den datatabell ni vill ansluta](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Konfigurera fältinformation.

![Konfigurera fältinformation](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Om fjärrtabellen har strukturella ändringar kan ni även välja "Synkronisera från fjärrtabell".

![Synkronisera från fjärrtabell](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synkronisering av fjärrtabell.

![Synkronisering av fjärrtabell](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Slutligen visas den i gränssnittet.

![Visa i gränssnittet](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)