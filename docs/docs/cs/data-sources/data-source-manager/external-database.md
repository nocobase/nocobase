:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Externí databáze

## Úvod

NocoBase umožňuje využívat stávající externí databáze jako zdroj dat. Aktuálně podporujeme databáze MySQL, MariaDB, PostgreSQL, MSSQL a Oracle.

## Pokyny k použití

### Přidání externí databáze

Po aktivaci pluginu jej můžete vybrat a přidat z rozbalovacího menu „Přidat nový“ ve správě zdrojů dat.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Vyplňte informace o databázi, ke které se chcete připojit.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Synchronizace kolekcí

Po navázání spojení s externí databází NocoBase automaticky načte všechny kolekce z daného zdroje dat. Externí databáze nepodporují přímé přidávání kolekcí ani úpravu jejich struktury. Pokud potřebujete provést změny, učiňte tak prostřednictvím databázového klienta a poté klikněte na tlačítko „Obnovit“ v rozhraní pro synchronizaci.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Konfigurace polí

Externí databáze automaticky načte a zobrazí pole stávajících kolekcí. Můžete rychle prohlížet a konfigurovat název pole, datový typ (Field type) a typ uživatelského rozhraní (Field interface). Pro úpravu dalších nastavení můžete také kliknout na tlačítko „Upravit“.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Jelikož externí databáze nepodporují úpravu struktury kolekcí, jediným dostupným typem při přidávání nového pole je asociační pole. Asociační pole nejsou skutečná pole, ale slouží k navázání spojení mezi kolekcemi.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Více podrobností naleznete v kapitole [Pole kolekcí/Přehled](/data-sources/data-modeling/collection-fields).

### Mapování typů polí

NocoBase automaticky mapuje typy polí z externí databáze na odpovídající datový typ (Field type) a typ uživatelského rozhraní (Field Interface).

- Datový typ (Field type): Definuje druh, formát a strukturu dat, která může pole ukládat.
- Typ uživatelského rozhraní (Field interface): Odkazuje na typ ovládacího prvku používaného v uživatelském rozhraní pro zobrazení a zadávání hodnot polí.

| PostgreSQL | MySQL/MariaDB | Datový typ NocoBase | Typ rozhraní NocoBase |
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
| CIRCEL |  | circle | json<br/>circle |
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

### Nepodporované typy polí

Nepodporované typy polí jsou zobrazeny samostatně. Tato pole vyžadují vývojovou adaptaci, než je bude možné použít.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Klíč pro cílené filtrování

Kolekce zobrazované jako bloky musí mít nakonfigurován klíč pro cílené filtrování (Filter target key). Tento klíč slouží k filtrování dat na základě specifického pole, přičemž hodnota pole musí být unikátní. Ve výchozím nastavení je klíčem pro cílené filtrování pole primárního klíče kolekce. U pohledů, kolekcí bez primárního klíče nebo kolekcí se složeným primárním klíčem je nutné definovat vlastní klíč pro cílené filtrování.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Pouze kolekce, které mají nakonfigurován klíč pro cílené filtrování, lze přidat na stránku.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)