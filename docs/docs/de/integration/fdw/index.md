:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/integration/fdw/index).
:::

# Externe Datentabellen verbinden (FDW)

## Einführung

Diese Funktion ermöglicht die Verbindung zu entfernten Datentabellen basierend auf dem Foreign Data Wrapper (FDW) der Datenbank. Derzeit werden MySQL- und PostgreSQL-Datenbanken unterstützt.

:::info{title="Verbinden von Datenquellen vs. Verbinden von externen Datentabellen"}
- **Verbinden von Datenquellen** bezieht sich auf den Aufbau einer Verbindung zu einer spezifischen Datenbank oder einem API-Dienst, wobei Sie die Funktionen der Datenbank oder die vom API bereitgestellten Dienste vollständig nutzen können;
- **Verbinden von externen Datentabellen** bezieht sich auf das Abrufen von Daten von außerhalb und deren Zuordnung für die lokale Nutzung. In der Datenbank wird dies als FDW (Foreign Data Wrapper) bezeichnet – eine Datenbanktechnologie, die darauf abzielt, entfernte Tabellen wie lokale Tabellen zu verwenden, wobei jeweils nur eine Tabelle gleichzeitig verbunden werden kann. Da es sich um einen Fernzugriff handelt, gibt es bei der Verwendung verschiedene Einschränkungen und Limitierungen.

Beide können auch kombiniert verwendet werden. Ersteres dient zum Aufbau einer Verbindung zur Datenquelle, Letzteres für den datenquellenübergreifenden Zugriff. Beispielsweise ist eine bestimmte PostgreSQL-Datenquelle verbunden, und eine Tabelle in dieser Datenquelle ist eine externe Datentabelle, die auf Basis von FDW erstellt wurde.
:::

### MySQL

MySQL verwendet die `federated`-Engine, die aktiviert werden muss. Sie unterstützt die Verbindung zu entfernten MySQL-Datenbanken und protokollkompatiblen Datenbanken wie MariaDB. Weitere Details finden Sie in der Dokumentation zur [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

In PostgreSQL können verschiedene Arten von `fdw`-Erweiterungen verwendet werden, um unterschiedliche entfernte Datentypen zu unterstützen. Zu den derzeit unterstützten Erweiterungen gehören:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Verbindung zu einer entfernten PostgreSQL-Datenbank in PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Verbindung zu einer entfernten MySQL-Datenbank in PostgreSQL.
- Weitere Arten von FDW-Erweiterungen finden Sie unter [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Um diese in NocoBase einzubinden, müssen Sie die entsprechenden Anpassungsschnittstellen im Code implementieren.

## Voraussetzungen

- Wenn die Hauptdatenbank von NocoBase MySQL ist, müssen Sie `federated` aktivieren. Siehe [Wie man die Federated-Engine in MySQL aktiviert](./enable-federated)

Installieren und aktivieren Sie anschließend das Plugin über den Plugin-Manager.

![Plugin installieren und aktivieren](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Benutzerhandbuch

Wählen Sie unter „Sammlungs-Manager > Sammlung erstellen“ im Dropdown-Menü die Option „Mit externen Daten verbinden“ aus.

![Externe Daten verbinden](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Wählen Sie im Dropdown-Menü „Datenbankserver“ einen vorhandenen Datenbankdienst aus oder klicken Sie auf „Datenbankserver erstellen“.

![Datenbankdienst](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Datenbankserver erstellen

![Datenbankserver erstellen](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Wählen Sie nach der Auswahl des Datenbankservers im Dropdown-Menü „Entfernte Tabelle“ die Datentabelle aus, die Sie verbinden möchten.

![Zu verbindende Datentabelle auswählen](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Feldinformationen konfigurieren

![Feldinformationen konfigurieren](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Wenn sich die Struktur der entfernten Tabelle ändert, können Sie diese auch „Von entfernter Tabelle synchronisieren“.

![Von entfernter Tabelle synchronisieren](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronisierung der entfernten Tabelle

![Synchronisierung der entfernten Tabelle](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Schließlich wird sie in der Benutzeroberfläche angezeigt.

![In der Benutzeroberfläche anzeigen](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)