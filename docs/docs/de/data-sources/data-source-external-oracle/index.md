---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "Externe Datenquelle – Oracle"
description: "Erfahren Sie, wie Sie Oracle als externe Datenbank in NocoBase anbinden, einschließlich unterstützter Versionen, Plugin-Installation, Thin-/Thick-Verbindungsmodi, Client directory, Berechtigungen und Feldzuordnungen."
keywords: "Externe Datenquelle,Oracle,externe Datenbank,Thin,Thick,Client directory,Feldzuordnung,NocoBase"
---

# Oracle

## Einführung

Oracle kann als externe Datenbank an NocoBase angebunden werden. Nach der Anbindung liest NocoBase die Tabellen, Felder und Ansichten aus Oracle ein und verwendet sie als Datentabellen in der externen Datenquelle.

Im Unterschied zur [Hauptdatenbank](../data-source-main/index.md) wird die tatsächliche Tabellenstruktur der externen Oracle-Datenbank weiterhin vom ursprünglichen Geschäftssystem, Datenbank-Client oder Migrationsskript verwaltet. NocoBase ist für das Einlesen der Struktur, das Speichern von Feldmetadaten sowie die Konfiguration von Seitenblöcken, Berechtigungen, Workflows und APIs zuständig.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Versionen | Oracle >= 11g. |
| Kommerzielle Version | Wird von der Enterprise Edition unterstützt. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-oracle`. |
| Verbindungsmodus | Für Oracle Database 12.1 und höher wird normalerweise der Thin-Modus verwendet; für Versionen vor 12.1 wird der Thick-Modus verwendet. |

Geeignete Einsatzszenarien für eine externe Oracle-Datenbank:

- Anbindung der Oracle-Datenbank bestehender Geschäftssysteme wie ERP, MES, WMS oder CRM
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten zu migrieren
- Steuerung von Berechtigungen, Verarbeitung von Workflows, Korrektur von Daten oder Anzeige von Berichten für bestehende Tabellen
- Weitere Verwaltung der Datenbankstruktur durch DBAs, Migrationsskripte oder das ursprüngliche System

:::warning Hinweis

Eine externe Oracle-Datenbank ist nicht die Systemdatenbank von NocoBase. NocoBase übernimmt weder ihre Sicherung und Wiederherstellung noch ihre Migration oder Änderungen an der Tabellenstruktur.

:::

## Plugin-Installation

Dieses Plugin ist ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie unter: [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

Wenn als Verbindungsmodus Thick ausgewählt wird, müssen die Oracle Client libraries in der NocoBase-Laufzeitumgebung installiert und das „Client directory“ in der Datenquellenkonfiguration angegeben werden.

## Installation des Oracle-Clients

Für Oracle Database 12.1 und höher wird normalerweise der Thin-Modus verwendet, sodass keine zusätzliche Installation des Oracle-Clients erforderlich ist. Nur wenn Sie eine Oracle Database-Version vor 12.1 anbinden oder den Thick-Modus verwenden müssen, müssen die Oracle Client libraries in der NocoBase-Laufzeitumgebung installiert werden.

Nachdem Sie in der Datenquellenkonfiguration den Modus „Thick“ ausgewählt haben, müssen Sie sicherstellen, dass der Rechner, auf dem der NocoBase-Dienst ausgeführt wird, den Oracle-Client laden kann.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

In einer Linux-Umgebung können Sie den Oracle Instant Client beispielsweise wie folgt installieren:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Wenn der Oracle-Client nicht an einem vom System standardmäßig ladbaren Speicherort installiert ist, müssen Sie im Feld „Client directory“ das Verzeichnis der Client-Bibliotheken angeben. Bei der oben beschriebenen Installationsmethode lautet das entsprechende Verzeichnis `/opt/instantclient_19_25`.

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

:::tip Tipp

`Client directory` muss nur im Thick-Modus konfiguriert werden. Im Thin-Modus wird diese Einstellung nicht verwendet. Weitere Informationen zu den Initialisierungsregeln finden Sie in der [Initialisierungsdokumentation von node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html).

:::

## Datenquelle hinzufügen

Klicken Sie unter „Datenquellenverwaltung“ auf „Add new“, wählen Sie Oracle aus und geben Sie anschließend die Verbindungsinformationen ein.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Häufig verwendete Verbindungseinstellungen:

| Einstellung | Beschreibung |
| --- | --- |
| Data source name | Bezeichner der Datenquelle, der für Verweise in Seitenblöcken, Berechtigungen, Workflows und APIs verwendet wird. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Name, unter dem die Datenquelle in der Benutzeroberfläche angezeigt wird. Es wird empfohlen, einen für Fachanwender verständlichen Namen zu verwenden, z. B. „ERP Oracle“ oder „Finanzdatenbank“. |
| Host / Port | Hostadresse und Port von Oracle. Der Standardport ist normalerweise `1521`. |
| ServerName | Oracle-Dienstname. Geben Sie den in der Datenbankkonfiguration des Listeners festgelegten Service Name ein. |
| Username / Password | Benutzername und Passwort für die Verbindung zu Oracle. NocoBase liest die Tabellen und Ansichten aus dem Owner dieses Kontos ein und erteilt keinen Zugriff auf Objekte anderer Owner bzw. liest diese nicht ein. |
| Connection mode | Oracle-Verbindungsmodus. Für Oracle Database 12.1 und höher wird normalerweise der Thin-Modus verwendet; für Versionen vor 12.1 wird der Thick-Modus verwendet. |
| Client directory | Verzeichnis der Oracle Client libraries für den Oracle-Thick-Modus. Muss nur bei Auswahl des Thick-Modus konfiguriert werden. |
| Table prefix | Tabellenpräfix. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten ein, die diesem Präfix entsprechen, und erzeugt in NocoBase Datentabellennamen ohne Präfix. |
| Collections / Add all collections | Steuert den Umfang der Anbindung. Wenn „Add all collections“ aktiviert ist, bindet NocoBase alle Tabellen und Ansichten innerhalb des aktuellen Owners und Präfixbereichs an. Wenn die Option deaktiviert ist, werden nur die unter „Collections“ ausgewählten Objekte angebunden. |
| Enabled the data source | Gibt an, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Datenquellenkonfiguration erhalten, Seitenblöcke, Berechtigungen, Workflows und APIs können jedoch nicht mehr auf ihre Daten zugreifen. |

:::tip Tipp

Der Umfang der Oracle-Anbindung wird hauptsächlich durch den Owner des Verbindungskontos, `Table prefix` und „Collections“ bestimmt. Wenn sich in derselben Instanz sehr viele Objekte befinden, empfiehlt es sich, ein dediziertes Konto für das benötigte Schema zu verwenden, damit keine irrelevanten Objekte in NocoBase aufgenommen werden.

:::

## Datentabellen auswählen

Nachdem Sie die Verbindungsinformationen eingegeben haben, können Sie auf „Load Collections“ klicken, um die in Oracle verfügbaren Datentabellen und Ansichten einzulesen. Das Ergebnis wird durch den Owner des Verbindungskontos, `Table prefix` und die Konfiguration von „Collections“ beeinflusst.

Standardmäßig ist „Add all collections“ aktiviert. Dadurch werden alle Tabellen und Ansichten innerhalb des aktuellen Bereichs angebunden. Wenn Sie nur bestimmte Objekte anbinden möchten, deaktivieren Sie „Add all collections“ und wählen anschließend die gewünschten Datentabellen oder Ansichten in der Liste aus.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Hinweis

Pro externer Datenquelle können höchstens 500 Datentabellen oder Ansichten gleichzeitig angebunden werden. Wenn Oracle sehr viele Objekte enthält, empfiehlt es sich, den Bereich zunächst über den Owner des Verbindungskontos, `Table prefix` oder „Collections“ einzuschränken.

:::

## Synchronisieren und Konfigurieren von Feldern

Die Tabellenstruktur der externen Oracle-Datenbank wird auf Datenbankseite verwaltet. NocoBase erstellt in der externen Oracle-Datenbank keine Felder, ändert keine Feldtypen und löscht keine tatsächlichen Felder.

Wenn sich die Tabellenstruktur auf Oracle-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Tabellen- und Feldmetadaten erneut einzulesen. Dabei werden die in NocoBase gespeicherten Daten zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Feldtypzuordnungen aktualisiert. Tatsächliche Tabellen oder Daten in Oracle werden jedoch nicht gelöscht.

Nach der Feldsynchronisierung können Sie in NocoBase die Feldbezeichnung, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie in NocoBase ein Beziehungsfeld erstellen müssen, werden die Beziehungsmetadaten ebenfalls nur in NocoBase gespeichert; in der Oracle-Tabelle wird nicht automatisch ein tatsächliches Fremdschlüsselfeld hinzugefügt.

## Feldtypzuordnung

NocoBase ordnet Oracle-Feldtypen automatisch einem geeigneten Field type und Field interface zu. Sie können die Darstellungsweise in der Feldkonfiguration anpassen.

Häufige Zuordnungen:

| Oracle-Feldtyp | NocoBase Field type | Verfügbare Field interface |
| --- | --- | --- |
| `NUMBER` | `integer`、`float`、`boolean`、`bigInt`、`unixTimestamp`、`sort` | Integer、Number、Sort、Checkbox、Switch、Select、Radio group。 |
| `BINARY_FLOAT`、`BINARY_DOUBLE`、`FLOAT` | `float` | Number、Percent。 |
| `INTEGER`、`SMALLINT`、`PLSQL_INTEGER` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `CHAR`、`NCHAR`、`VARCHAR2`、`NVARCHAR2` | `string`、`uuid`、`nanoid`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `LONG`、`NCLOB` | `string`、`text` | Input、Textarea、Markdown、Vditor、Rich text。 |
| `CLOB` | `string` | Input、Textarea、Rich text。 |
| `DATE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE`、`TIMESTAMP WITH LOCAL TIME ZONE` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `ROWID`、`UROWID` | `string`、`text`、`integer` | Input、Textarea、Integer。 |
| `JSON` | `json` | JSON。 |

:::warning Hinweis

`BLOB`、`BFILE` und andere binäre Objekttypen werden nicht automatisch als normale Dateifelder verwendet. Wenn Sie Anhänge in Seiten verwalten möchten, empfiehlt es sich in der Regel, in NocoBase eine Dateitabelle oder ein Anhangsfeld zum Speichern der Dateimetadaten zu verwenden.

:::

## Primärschlüssel und eindeutiger Datensatzschlüssel

Für Datentabellen, die zur Anzeige und Bearbeitung in Seitenblöcken verwendet werden, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet den Primärschlüssel bevorzugt als eindeutigen Datensatzschlüssel.

Wenn Sie eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel anbinden, müssen Sie in der Datenbankkonfiguration manuell „Record unique key“ festlegen. Wenn kein eindeutiger Bezeichner verfügbar ist, können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709210948](https://static-docs.nocobase.com/20260709210948.png)
![20260709211004](https://static-docs.nocobase.com/20260709211004.png)

## Verwandte Links

- [Externe Datenbanken](./index.md) — Allgemeine Konfigurations- und Verwaltungshinweise zu externen Datenbanken
- [Datenquellenverwaltung](../data-source-manager/index.md) — Informationen zum Einstieg in die Datenquellenverwaltung und zur Verwaltung von Datenquellen
- [Datentabellenfelder](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen
- [Initialisierungsdokumentation von node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) — Informationen zum Laden der Oracle Client libraries