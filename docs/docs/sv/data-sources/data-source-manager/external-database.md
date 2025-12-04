:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Extern databas

## Introduktion

Ni kan använda en befintlig extern databas som en datakälla. För närvarande stöds följande externa databaser: MySQL, MariaDB, PostgreSQL, MSSQL och Oracle.

## Användningsinstruktioner

### Lägga till en extern databas

När ni har aktiverat `plugin`-et kan ni välja och lägga till det från rullgardinsmenyn "Lägg till ny" under `datakälla`-hanteringen.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Fyll i informationen för den databas ni vill ansluta till.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### `Samling`-synkronisering

Efter att en anslutning har upprättats med en extern databas kommer alla `samlingar` inom `datakällan` att läsas in direkt. Externa databaser stöder inte direkt tillägg av `samlingar` eller ändring av tabellstrukturen. Om ändringar behövs kan ni utföra dem via en databasklient och sedan klicka på knappen "Uppdatera" i gränssnittet för att synkronisera.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Konfigurera fält

Den externa databasen läser automatiskt in och visar fälten från befintliga `samlingar`. Ni kan snabbt granska och konfigurera fältets rubrik, datatyp (`Field type`) och UI-typ (`Field interface`). Ni kan också klicka på knappen "Redigera" för att ändra fler inställningar.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Eftersom externa databaser inte stöder ändringar av tabellstrukturen är den enda tillgängliga fälttypen när ni lägger till ett nytt fält ett relationsfält (association field). Relationsfält är inte faktiska fält, utan används för att upprätta kopplingar mellan `samlingar`.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

För mer information, se kapitlet [`Samlingsfält`/Översikt](/data-sources/data-modeling/collection-fields).

### Fälttypmappning

NocoBase mappar automatiskt fälttyperna från den externa databasen till motsvarande datatyp (`Field type`) och UI-typ (`Field Interface`).

- Datatyp (`Field type`): Definierar vilken typ, vilket format och vilken struktur den data som ett fält kan lagra har.
- UI-typ (`Field interface`): Avser den typ av kontroll som används i användargränssnittet för att visa och mata in fältvärden.

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Fälttyper som inte stöds

Fälttyper som inte stöds visas separat. Dessa fält kräver anpassning via utveckling innan de kan användas.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Filtermålsnyckel

`Samlingar` som visas som block måste ha en `filtermålsnyckel` (`Filter target key`) konfigurerad. `Filtermålsnyckeln` används för att filtrera data baserat på ett specifikt fält, och fältvärdet måste vara unikt. Som standard är `filtermålsnyckeln` `samlingens` primärnyckelfält. För vyer, `samlingar` utan primärnyckel, eller `samlingar` med en sammansatt primärnyckel, behöver ni definiera en anpassad `filtermålsnyckel`.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Endast `samlingar` som har en `filtermålsnyckel` konfigurerad kan läggas till på sidan.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)