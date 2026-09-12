---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "Externe Datenquelle – Oracle"
description: "Erfahren Sie, wie Sie Oracle als externe Datenbank an NocoBase anbinden, einschließlich unterstützter Versionen, Plugin-Installation, Thin-/Thick-Verbindungsmodus, Client directory, Berechtigungen und Feldzuordnung."
keywords: "Externe Datenquelle,Oracle,externe Datenbank,Thin,Thick,Client directory,Feldzuordnung,NocoBase"
---

# Oracle

## Einführung

Oracle kann als externe Datenbank an NocoBase angebunden werden. Nach der Anbindung liest NocoBase die Tabellen, Felder und Ansichten aus Oracle ein und verwendet sie als Datentabellen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../main/index.md) wird die tatsächliche Tabellenstruktur der externen Oracle-Datenbank weiterhin vom ursprünglichen Geschäftssystem, Datenbank-Client oder Migrationsskript verwaltet. NocoBase liest die Struktur ein, speichert Feldmetadaten und verwaltet Seitenblöcke, Berechtigungen, Workflows und APIs.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Versionen | Oracle >= 11g. |
| Kommerzielle Version | Unterstützung in der Enterprise Edition. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-oracle`. |
| Verbindungsmodus | Für Oracle Database 12.1 und höher wird normalerweise der Thin-Modus verwendet; für Versionen vor 12.1 wird der Thick-Modus verwendet. |

Die Verwendung einer externen Oracle-Datenbank eignet sich unter anderem für folgende Szenarien:

- Anbindung der Oracle-Datenbank bestehender Geschäftssysteme wie ERP, MES, WMS oder CRM
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten zu migrieren
- Steuerung von Berechtigungen, Verarbeitung von Workflows, Korrektur von Daten oder Darstellung von Berichten für bestehende Tabellen
- Weiterverwaltung der Datenbankstruktur durch DBAs, Migrationsskripte oder das ursprüngliche System

:::warning Hinweis

Eine externe Oracle-Datenbank ist nicht die Systemdatenbank von NocoBase. NocoBase übernimmt weder deren Sicherung, Wiederherstellung und Migration noch Änderungen an der Tabellenstruktur.

:::

## Plugin installieren

Bei diesem Plugin handelt es sich um ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie im [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

Wenn Sie den Thick-Verbindungsmodus auswählen, müssen Sie die Oracle-Client-Bibliotheken in der NocoBase-Laufzeitumgebung installieren und in der Datenquellenkonfiguration das „Client directory“ angeben.

## Oracle-Client installieren

Für Oracle Database 12.1 und höher wird normalerweise der Thin-Modus verwendet, sodass keine zusätzliche Installation des Oracle-Clients erforderlich ist. Nur wenn Sie eine Oracle Database-Version vor 12.1 anbinden oder zwingend den Thick-Modus verwenden müssen, müssen Sie die Oracle-Client-Bibliotheken in der NocoBase-Laufzeitumgebung installieren.

Nachdem Sie in der Datenquellenkonfiguration den Modus „Thick“ ausgewählt haben, müssen Sie sicherstellen, dass der Rechner, auf dem der NocoBase-Dienst ausgeführt wird, den Oracle-Client laden kann.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Für die Installation des Oracle Instant Client unter Linux können Sie sich an folgendem Vorgehen orientieren:

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

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie Oracle aus und geben Sie die Verbindungsinformationen ein.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Häufig verwendete Verbindungseinstellungen:

| Einstellung | Beschreibung |
| --- | --- |
| Data source name | Identifikationsname der Datenquelle, der zur Referenzierung in Seitenblöcken, Berechtigungen, Workflows und APIs verwendet wird. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Der Name, unter dem die Datenquelle in der Benutzeroberfläche angezeigt wird. Es wird empfohlen, einen für die Fachanwender verständlichen Namen zu verwenden, z. B. „ERP Oracle“ oder „Finanzdatenbank“. |
| Host / Port | Hostadresse und Port von Oracle. Der Standardport ist normalerweise `1521`. |
| ServerName | Oracle-Servicename. Geben Sie den in der Datenbanküberwachung konfigurierten Service Name ein. |
| Username / Password | Benutzername und Passwort für die Verbindung mit Oracle. NocoBase liest die Tabellen und Ansichten unter dem Owner dieses Kontos, erteilt jedoch keine Berechtigungen für Objekte anderer Owner und liest diese auch nicht. |
| Connection mode | Oracle-Verbindungsmodus. Für Oracle Database 12.1 und höher wird normalerweise der Thin-Modus verwendet; für Versionen vor 12.1 wird der Thick-Modus verwendet. |
| Client directory | Verzeichnis der Oracle-Client-Bibliotheken für den Oracle-Thick-Modus. Diese Einstellung ist nur bei Auswahl des Thick-Modus erforderlich. |
| Table prefix | Tabellenpräfix. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten, die diesem Präfix entsprechen, und erzeugt in NocoBase Tabellennamen ohne Präfix. |
| Collections / Add all collections | Steuert den Umfang der Anbindung. Wenn „Add all collections“ aktiviert ist, bindet NocoBase alle Tabellen und Ansichten innerhalb des aktuellen Owners und Präfixbereichs an. Wenn die Option deaktiviert ist, werden nur die unter „Collections“ ausgewählten Objekte angebunden. |
| Enabled the data source | Gibt an, ob diese Datenquelle aktiviert ist. Wenn sie deaktiviert wird, bleibt die Datenquellenkonfiguration erhalten, aber Seitenblöcke, Berechtigungen, Workflows und APIs können nicht mehr auf ihre Daten zugreifen. |

:::tip Tipp

Der Umfang der Oracle-Anbindung wird hauptsächlich durch den Owner des Verbindungskontos, `Table prefix` und „Collections“ bestimmt. Wenn eine Instanz sehr viele Objekte enthält, empfiehlt es sich, ein eigenes Konto für das benötigte Schema zu verwenden, um irrelevante Objekte von NocoBase fernzuhalten.

:::

## Datentabellen auswählen

Nachdem Sie die Verbindungsinformationen eingegeben haben, können Sie auf „Load Collections“ klicken, um die in Oracle verfügbaren Tabellen und Ansichten einzulesen. Die eingelesenen Ergebnisse werden durch den Owner des Verbindungskontos, `Table prefix` und die Konfiguration von „Collections“ beeinflusst.

Standardmäßig ist „Add all collections“ aktiviert. Das bedeutet, dass alle Tabellen und Ansichten innerhalb des aktuellen Bereichs angebunden werden. Wenn Sie nur bestimmte Objekte anbinden möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die gewünschten Tabellen oder Ansichten in der Liste aus.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten gleichzeitig anbinden. Wenn Oracle sehr viele Objekte enthält, empfiehlt es sich, den Umfang zunächst über den Owner des Verbindungskontos, `Table prefix` oder „Collections“ einzuschränken.

:::

## Synchronisieren und Konfigurieren von Feldern

Die Tabellenstruktur der externen Oracle-Datenbank wird auf Datenbankseite verwaltet. NocoBase erstellt in der externen Oracle-Datenbank keine Felder, ändert keine Feldtypen und löscht keine echten Felder.

Wenn sich die Tabellenstruktur auf Oracle-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Tabellen- und Feldmetadaten erneut einzulesen. Bei der Synchronisierung werden die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Feldtypzuordnungen aktualisiert. Echte Tabellen oder Daten in Oracle werden jedoch nicht gelöscht.

Nach der Feldsynchronisierung können Sie in NocoBase die Feldbezeichnung, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie NocoBase-Beziehungsfelder erstellen müssen, werden auch die Beziehungsmetadaten in NocoBase gespeichert; in der Oracle-Tabelle wird nicht automatisch ein echtes Fremdschlüsselfeld angelegt.

## Feldtypzuordnung

NocoBase ordnet Oracle-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Sie können die Darstellung in der Feldkonfiguration anpassen.

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

`BLOB`、`BFILE` und andere binäre Objekttypen werden nicht automatisch als gewöhnliche Dateifelder verwendet. Wenn Sie Anhänge in Seiten verwalten müssen, empfiehlt es sich in der Regel, in NocoBase eine Dateitabelle oder ein Anhangsfeld zu verwenden, um die Dateimetadaten zu speichern.

:::

## Primärschlüssel und eindeutige Datensatzkennung

Für Datentabellen, die zur Anzeige und Bearbeitung in Seitenblöcken verwendet werden, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet bevorzugt den Primärschlüssel als eindeutige Datensatzkennung.

Wenn Sie eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel anbinden, müssen Sie in der Datenquellenkonfiguration manuell „Record unique key“ festlegen. Wenn keine geeignete eindeutige Kennung vorhanden ist, können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709210948](https://static-docs.nocobase.com/20260709210948.png)
![20260709211004](https://static-docs.nocobase.com/20260709211004.png)

## Verwandte Links

- [Externe Datenbanken](./index.md) — Allgemeine Informationen zur Konfiguration und Verwaltung externer Datenbanken
- [Datenquellenverwaltung](../data-source-manager/index.md) — Informationen zum Zugriff auf und zur Verwaltung von Datenquellen
- [Datentabellenfelder](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen
- [Initialisierungsdokumentation von node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) — Informationen zum Laden der Oracle-Client-Bibliotheken