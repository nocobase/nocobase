:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Externe Datenbank

## Einführung

Sie können eine bestehende externe Datenbank als Datenquelle verwenden. Derzeit werden folgende externe Datenbanken unterstützt: MySQL, MariaDB, PostgreSQL, MSSQL und Oracle.

## Anwendungsanleitung

### Externe Datenbank hinzufügen

Nachdem Sie das Plugin aktiviert haben, können Sie es im Dropdown-Menü „Add new“ der Datenquellenverwaltung auswählen und hinzufügen.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Geben Sie die Informationen für die Datenbank ein, die Sie verbinden möchten.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Sammlungssynchronisierung

Nachdem eine Verbindung zu einer externen Datenbank hergestellt wurde, werden alle Sammlungen innerhalb der Datenquelle direkt eingelesen. Externe Datenbanken unterstützen das direkte Hinzufügen von Sammlungen oder das Ändern der Tabellenstruktur nicht. Wenn Änderungen erforderlich sind, können Sie diese über einen Datenbank-Client vornehmen und anschließend in der Benutzeroberfläche auf die Schaltfläche „Aktualisieren“ klicken, um die Synchronisierung durchzuführen.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Felder konfigurieren

Die externe Datenbank liest die Felder bestehender Sammlungen automatisch ein und zeigt sie an. Sie können den Titel, den Datentyp (Field type) und den UI-Typ (Field interface) des Feldes schnell anzeigen und konfigurieren. Klicken Sie auf die Schaltfläche „Bearbeiten“, um weitere Einstellungen zu ändern.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Da externe Datenbanken das Ändern der Tabellenstruktur nicht unterstützen, ist beim Hinzufügen eines neuen Feldes nur der Beziehungstyp verfügbar. Beziehungsfelder sind keine echten Felder, sondern dienen dazu, Verbindungen zwischen Sammlungen herzustellen.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Weitere Details finden Sie im Kapitel [Sammlungsfelder/Übersicht](/data-sources/data-modeling/collection-fields).

### Feldtyp-Zuordnung

NocoBase ordnet die Feldtypen der externen Datenbank automatisch dem entsprechenden Datentyp (Field type) und UI-Typ (Field Interface) zu.

- Datentyp (Field type): Definiert die Art, das Format und die Struktur der Daten, die ein Feld speichern kann.
- UI-Typ (Field interface): Bezieht sich auf den Steuerelementtyp, der in der Benutzeroberfläche zur Anzeige und Eingabe von Feldwerten verwendet wird.

| PostgreSQL | MySQL/MariaDB | NocoBase Datentyp | NocoBase Interface Type |
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

### Nicht unterstützte Feldtypen

Nicht unterstützte Feldtypen werden separat angezeigt. Diese Felder erfordern eine Entwicklungsanpassung, bevor sie verwendet werden können.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Filter-Zielschlüssel

Sammlungen, die als Blöcke angezeigt werden, müssen einen Filter-Zielschlüssel (Filter target key) konfiguriert haben. Der Filter-Zielschlüssel dient dazu, Daten basierend auf einem bestimmten Feld zu filtern, wobei der Feldwert eindeutig sein muss. Standardmäßig ist der Filter-Zielschlüssel das Primärschlüsselfeld der Sammlung. Bei Ansichten, Sammlungen ohne Primärschlüssel oder Sammlungen mit einem zusammengesetzten Primärschlüssel müssen Sie einen benutzerdefinierten Filter-Zielschlüssel definieren.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Nur Sammlungen, für die ein Filter-Zielschlüssel konfiguriert wurde, können der Seite hinzugefügt werden.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)