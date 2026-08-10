---
title: "Externe Datenbank"
description: "NocoBase externe Datenbank: Verbindung mit vorhandenen MySQL-/PostgreSQL-/MariaDB-/KingbaseES-/OceanBase-/MSSQL-/Oracle-/ClickHouse-/Doris-Datenbanken herstellen, Tabellenstrukturen auslesen sowie Feldzuordnungen und Beziehungsfelder konfigurieren."
keywords: "Externe Datenbank,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,Datentabellensynchronisierung,Feldzuordnung,NocoBase"
---

# Externe Datenbank

## Einführung

Mit externen Datenbanken können bereits vorhandene Geschäftsdatenbanken an NocoBase angebunden werden. NocoBase liest Tabellen, Felder und Ansichten aus der externen Datenbank aus, sodass diese Datentabellen in Seitenblöcken, Berechtigungen, Workflows und APIs verwendet werden können.

Im Gegensatz zur [Hauptdatenbank](../data-source-main/index.md) werden die Tabellenstrukturen externer Datenbanken vom ursprünglichen System oder Datenbank-Client verwaltet. NocoBase liest die Tabellenstrukturen und Ansichten aus, ändert jedoch nicht die tatsächlichen Tabellenstrukturen der externen Datenbank.

Die von externen Datenbanken unterstützten Datenbankversionen und Editionen sind:

| Datenbank | Unterstützte Version | Community Edition | Standard Edition | Professional Edition | Enterprise Edition |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | ❌ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 9.5 | ❌ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.3 | ❌ | ✅ | ✅ | ✅ |
| MSSQL | 2014-2019 | ❌ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |
| Oracle | >= 11g | ❌ | ❌ | ❌ | ✅ |
| ClickHouse | >= 20.2 | ❌ | ❌ | ❌ | ✅ |
| Doris | >= 2.1.0 | ❌ | ❌ | ❌ | ✅ |

:::tip Hinweis

KingbaseES unterstützt nur den PostgreSQL-Kompatibilitätsmodus. OceanBase, ClickHouse und Doris unterstützen nur den MySQL-Kompatibilitätsmodus.

:::

Typische Einsatzszenarien für externe Datenbanken:

- Verbindung mit der Datenbank eines vorhandenen Geschäftssystems (z. B. eines älteren ERP-, MES- oder WMS-Systems), um mit den Funktionen von NocoBase schnell Verwaltungsoberflächen, Berechtigungskontrollen, Workflows und Berichte zu erstellen, ohne die Tabellenstruktur der ursprünglichen Datenbank zu ändern.
- Erweiterung eines vorhandenen Systems um schlanke Anwendungsfunktionen wie Genehmigungen, Datenkorrekturen, Ausnahmebehandlung oder operative Dashboards, ohne das ursprüngliche System ersetzen zu müssen.
- Nur-Lese-Abfragen, statistische Analysen oder BI-Darstellungen für vorhandene Datenbanken, um die Abhängigkeit von den Oberflächen des ursprünglichen Geschäftssystems zu verringern.
- Schrittweise Migration älterer Systeme: Zunächst wird die alte Datenbank in NocoBase eingebunden und weiterverwendet, anschließend werden neue Geschäftsdaten schrittweise in der Hauptdatenbank verwaltet.
- Die Datenbankstruktur wird weiterhin von DBAs, Migrationsskripten oder dem ursprünglichen Geschäftssystem verwaltet. NocoBase liest lediglich die Struktur aus, konfiguriert die Oberfläche und verwendet die Daten.

:::warning Achtung

Eine externe Datenbank ist keine Systemdatenbank von NocoBase. NocoBase übernimmt weder Sicherung, Wiederherstellung und Migration der externen Datenbank noch deren Tabellenstruktur. Dies muss weiterhin in der externen Datenbank erfolgen.

:::

## Plugin-Installation

Externe Datenbanken werden durch die entsprechenden Datenquellen-Plugins bereitgestellt. Nach der Installation und Aktivierung eines Plugins kann der entsprechende Datenbanktyp im Menü „Add new“ unter „Datenquellenverwaltung“ ausgewählt werden.

| Datenbank | Zugehöriges Plugin | Installationsmethode |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation und Aktivierung des Plugins kann es verwendet werden. |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation und Aktivierung des Plugins kann es verwendet werden. |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation und Aktivierung des Plugins kann es verwendet werden. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation und Aktivierung des Plugins kann es verwendet werden. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation und Aktivierung des Plugins kann es verwendet werden. |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation und Aktivierung des Plugins kann es verwendet werden. |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation und Aktivierung des Plugins kann es verwendet werden. |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation und Aktivierung des Plugins kann es verwendet werden. |
| Doris | `@nocobase/plugin-data-source-external-doris` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation und Aktivierung des Plugins kann es verwendet werden. |

![add_new_database](https://static-docs.nocobase.com/add_new_database.png)

Wenn der gewünschte Datenbanktyp nicht im Menü „Add new“ angezeigt wird, sollte zunächst Folgendes überprüft werden:

- Ob das entsprechende Plugin bereits installiert ist
- Ob das Plugin bereits aktiviert ist
- Ob die aktuelle kommerzielle Lizenz dieses Plugin umfasst
- Ob der aktuelle Benutzer über die Berechtigung zur Datenquellenverwaltung verfügt


## Anleitung

### Externe Datenbank hinzufügen

Nach der Aktivierung des Plugins kann die Datenbank im Dropdown-Menü „Add new“ der Datenquellenverwaltung ausgewählt und hinzugefügt werden.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Geben Sie die Informationen der anzubindenden Datenbank ein.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Datentabellensynchronisierung

Nach dem Herstellen der Verbindung mit einer externen Datenbank werden alle Datentabellen der Datenquelle direkt ausgelesen. Das direkte Hinzufügen von Datentabellen oder Ändern der Tabellenstruktur wird von externen Datenbanken nicht unterstützt. Änderungen können über einen Datenbank-Client vorgenommen und anschließend durch Klicken auf die Schaltfläche „Aktualisieren“ in der Oberfläche synchronisiert werden.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Felder konfigurieren

Externe Datenbanken lesen die Felder vorhandener Datentabellen automatisch aus und zeigen sie an. Titel, Datentyp (Field type) und UI-Typ (Field interface) der Felder können schnell angezeigt und konfiguriert werden. Über die Schaltfläche „Bearbeiten“ können weitere Einstellungen geändert werden.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Da externe Datenbanken keine Änderung der Tabellenstruktur unterstützen, kann beim Hinzufügen von Feldern nur der Typ „Beziehungsfeld“ ausgewählt werden. Beziehungsfelder sind keine tatsächlichen Felder, sondern dienen dazu, Verbindungen zwischen Tabellen herzustellen.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Weitere Informationen finden Sie im Abschnitt [Felder von Datentabellen / Übersicht](../data-modeling/collection-fields/index.md).

### Feldtypzuordnung

NocoBase ordnet den Feldtypen externer Datenbanken automatisch die entsprechenden Datentypen (Field type) und UI-Typen (Field Interface) zu.

- Datentyp (Field type): definiert die Art, das Format und die Struktur der Daten, die ein Feld speichern kann;
- UI-Typ (Field interface): bezeichnet den Steuerelementtyp, der in der Benutzeroberfläche zur Anzeige und Eingabe von Feldwerten verwendet wird.

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
| CIRCEL |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Nicht unterstützte Feldtypen

Nicht unterstützte Feldtypen werden separat angezeigt. Diese Felder können erst nach entsprechender Entwicklungsanpassung verwendet werden.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Eindeutiger Datensatzschlüssel

Datentabellen, die als Blöcke angezeigt werden sollen, benötigen einen „eindeutigen Datensatzschlüssel“ (Record unique key). Der eindeutige Datensatzschlüssel dient dazu, einen Datensatz in einem Seitenblock zu identifizieren. In der Regel wird dafür der Primärschlüssel oder ein eindeutiges Feld verwendet.

Bei Ansichten, Tabellen ohne Primärschlüssel oder Tabellen mit zusammengesetztem Primärschlüssel muss „Record unique key“ in der Konfiguration der Datentabelle manuell festgelegt werden. Wenn kein geeigneter eindeutiger Schlüssel vorhanden ist, können Seitenblöcke möglicherweise nicht korrekt erstellt oder Datensätze nicht angezeigt beziehungsweise bearbeitet werden. Weitere Informationen finden Sie unter [Hauptdatenbank / Datentabelle bearbeiten](../main/index.md).

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)