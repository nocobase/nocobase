:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zewnętrzna baza danych

## Wprowadzenie

Mogą Państwo używać istniejącej zewnętrznej bazy danych jako źródła danych. Obecnie obsługiwane zewnętrzne bazy danych to MySQL, MariaDB, PostgreSQL, MSSQL i Oracle.

## Instrukcje użytkowania

### Dodawanie zewnętrznej bazy danych

Po aktywacji wtyczki mogą Państwo wybrać i dodać ją z rozwijanego menu "Dodaj nowe" w zarządzaniu źródłami danych.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Proszę uzupełnić informacje dotyczące bazy danych, z którą chcą Państwo nawiązać połączenie.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Synchronizacja kolekcji

Po nawiązaniu połączenia z zewnętrzną bazą danych, wszystkie kolekcje w ramach źródła danych zostaną bezpośrednio odczytane. Zewnętrzne bazy danych nie obsługują bezpośredniego dodawania kolekcji ani modyfikowania struktury tabel. Jeśli potrzebne są modyfikacje, mogą Państwo wykonać je za pomocą klienta bazy danych, a następnie kliknąć przycisk "Odśwież" w interfejsie, aby zsynchronizować zmiany.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Konfiguracja pól

Zewnętrzna baza danych automatycznie odczyta i wyświetli pola istniejących kolekcji. Mogą Państwo szybko przeglądać i konfigurować tytuł pola, typ danych (Field type) oraz typ interfejsu użytkownika (Field interface). Mogą Państwo również kliknąć przycisk "Edytuj", aby zmodyfikować więcej ustawień.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Ponieważ zewnętrzne bazy danych nie obsługują modyfikowania struktury tabel, jedynym dostępnym typem podczas dodawania nowego pola jest pole relacji. Pola relacji nie są rzeczywistymi polami, ale służą do nawiązywania połączeń między kolekcjami.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Więcej szczegółów znajdą Państwo w rozdziale [Pola kolekcji/Przegląd](/data-sources/data-modeling/collection-fields).

### Mapowanie typów pól

NocoBase automatycznie mapuje typy pól z zewnętrznej bazy danych do odpowiadającego im typu danych (Field type) i typu interfejsu użytkownika (Field Interface).

- Typ danych (Field type): Definiuje rodzaj, format i strukturę danych, które pole może przechowywać.
- Typ interfejsu użytkownika (Field interface): Odnosi się do typu kontrolki używanej w interfejsie użytkownika do wyświetlania i wprowadzania wartości pól.

| PostgreSQL | MySQL/MariaDB | Typ danych NocoBase | Typ interfejsu NocoBase |
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

### Nieobsługiwane typy pól

Nieobsługiwane typy pól są wyświetlane oddzielnie. Pola te wymagają adaptacji deweloperskiej, zanim będzie można ich użyć.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Klucz docelowy filtra

Kolekcje wyświetlane jako bloki muszą mieć skonfigurowany klucz docelowy filtra. Klucz docelowy filtra służy do filtrowania danych na podstawie określonego pola, a wartość pola musi być unikalna. Domyślnie klucz docelowy filtra jest polem klucza podstawowego kolekcji. W przypadku widoków, kolekcji bez klucza podstawowego lub kolekcji z kluczem złożonym, należy zdefiniować niestandardowy klucz docelowy filtra.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Tylko kolekcje, które mają skonfigurowany klucz docelowy filtra, mogą być dodane do strony.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)