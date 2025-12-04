---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# SQL-åtgärd

## Introduktion

I vissa speciella scenarier räcker de enkla samlingsåtgärdsnoderna inte till för komplexa operationer. Då kan ni direkt använda SQL-noden för att låta databasen exekvera komplexa SQL-satser för att manipulera data.

Skillnaden mot att direkt ansluta till databasen för SQL-operationer utanför applikationen är att ni inom ett arbetsflöde kan använda variabler från processkontexten som parametrar i SQL-satsen.

## Installation

Inbyggd plugin, ingen installation krävs.

## Skapa nod

I gränssnittet för arbetsflödeskonfiguration klickar ni på plusknappen ("+") i flödet för att lägga till en "SQL-åtgärd"-nod:

![SQL 操作_添加](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Nodkonfiguration

![SQL节点_节点配置](https://static-docs.nocobase.com/20240904002334.png)

### Datakälla

Välj den datakälla där SQL ska exekveras.

Datakällan måste vara av databastyp, till exempel huvuddatakällan, PostgreSQL eller andra Sequelize-kompatibla datakällor.

### SQL-innehåll

Redigera SQL-satsen. För närvarande stöds endast en SQL-sats.

Infoga de variabler ni behöver med hjälp av variabelknappen i redigeringsrutans övre högra hörn. Före exekvering ersätts dessa variabler med sina motsvarande värden genom textsubstitution. Den resulterande texten används sedan som den slutgiltiga SQL-satsen och skickas till databasen för att utföra frågan.

## Nodens exekveringsresultat

Från och med `v1.3.15-beta` är resultatet av en SQL-nodexekvering en array av ren data. Innan dess var det Sequelize:s ursprungliga returstruktur som innehöll frågemetadata (se: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Till exempel följande fråga:

```sql
select count(id) from posts;
```

Resultat före `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Resultat efter `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Vanliga frågor

### Hur använder man resultatet från en SQL-nod?

Om en `SELECT`-sats används, sparas frågeresultatet i noden i Sequelize:s JSON-format. Det kan sedan parsas och användas med [JSON-query](./json-query.md) pluginen.

### Utlöser SQL-åtgärden samlingshändelser?

**Nej**. SQL-åtgärden skickar SQL-satsen direkt till databasen för bearbetning. De relaterade `CREATE` / `UPDATE` / `DELETE`-operationerna sker i databasen, medan samlingshändelser sker på Node.js applikationslager (hanteras av ORM). Därför utlöses inga samlingshändelser.