:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Externe database

## Introductie

Gebruik een bestaande externe database als gegevensbron. Momenteel worden de volgende externe databases ondersteund: MySQL, MariaDB, PostgreSQL, MSSQL en Oracle.

## Gebruiksaanwijzing

### Een externe database toevoegen

Nadat u de plugin heeft geactiveerd, kunt u deze selecteren en toevoegen via het vervolgkeuzemenu 'Nieuwe toevoegen' in het gegevensbronbeheer.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Vul de informatie in voor de database waarmee u verbinding wilt maken.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Collecties synchroniseren

Nadat een verbinding met een externe database is gelegd, worden alle collecties binnen de gegevensbron direct ingelezen. Externe databases ondersteunen het direct toevoegen van collecties of het wijzigen van de tabelstructuur niet. Als wijzigingen nodig zijn, kunt u deze uitvoeren via een databaseclient en vervolgens op de knop 'Vernieuwen' in de interface klikken om te synchroniseren.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Velden configureren

De externe database leest automatisch de velden van bestaande collecties in en toont deze. U kunt snel de titel, het gegevenstype (Field type) en het UI-type (Field interface) van een veld bekijken en configureren. U kunt ook op de knop 'Bewerken' klikken om meer configuraties aan te passen.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Omdat externe databases het wijzigen van de tabelstructuur niet ondersteunen, is het enige beschikbare type bij het toevoegen van een nieuw veld een relatieveld. Relatievelden zijn geen echte velden, maar worden gebruikt om verbindingen tussen collecties tot stand te brengen.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Voor meer details, zie het hoofdstuk [Collectievelden/Overzicht](/data-sources/data-modeling/collection-fields).

### Veldtype-mapping

NocoBase wijst de veldtypen van de externe database automatisch toe aan het corresponderende gegevenstype (Field type) en UI-type (Field Interface).

- Gegevenstype (Field type): Definieert de soort, het formaat en de structuur van de gegevens die een veld kan opslaan.
- UI-type (Field interface): Verwijst naar het type besturingselement dat in de gebruikersinterface wordt gebruikt om veldwaarden weer te geven en in te voeren.

| PostgreSQL | MySQL/MariaDB | NocoBase Gegevenstype | NocoBase Interfacetype |
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

### Niet-ondersteunde veldtypen

Niet-ondersteunde veldtypen worden apart weergegeven. Deze velden vereisen ontwikkelingsaanpassing voordat ze kunnen worden gebruikt.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Filterdoelsleutel

Collecties die als blokken worden weergegeven, moeten een filterdoelsleutel (Filter target key) geconfigureerd hebben. De filterdoelsleutel wordt gebruikt om gegevens te filteren op basis van een specifiek veld, en de veldwaarde moet uniek zijn. Standaard is de filterdoelsleutel het primaire sleutelveld van de collectie. Voor views, collecties zonder primaire sleutel, of collecties met een samengestelde primaire sleutel, moet u een aangepaste filterdoelsleutel definiëren.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Alleen collecties waarvoor een filterdoelsleutel is geconfigureerd, kunnen aan de pagina worden toegevoegd.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)