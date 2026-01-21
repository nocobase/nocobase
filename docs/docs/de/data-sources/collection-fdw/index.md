---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Fremddatentabellen verbinden (FDW)

## Einführung

Dieses Plugin ermöglicht die Verbindung zu Fremddatentabellen, basierend auf der Foreign Data Wrapper-Implementierung der Datenbank. Aktuell werden MySQL- und PostgreSQL-Datenbanken unterstützt.

:::info{title="Datenquellen verbinden vs. Fremddatentabellen verbinden"}
- **Datenquellen verbinden** bedeutet, eine Verbindung zu einer bestimmten Datenbank oder einem API-Dienst herzustellen, um deren Funktionen oder die vom API bereitgestellten Dienste vollständig nutzen zu können.
- **Fremddatentabellen verbinden** bedeutet, Daten von extern zu beziehen und lokal zu nutzen. In Datenbanken wird dies als FDW (Foreign Data Wrapper) bezeichnet, eine Datenbanktechnologie, die sich darauf konzentriert, entfernte Tabellen wie lokale Tabellen zu verwenden. Dabei können Tabellen nur einzeln verbunden werden. Da es sich um einen Fernzugriff handelt, gibt es bei der Nutzung verschiedene Einschränkungen und Limitierungen.

Die beiden Ansätze lassen sich auch kombinieren: Der erste stellt die Verbindung zur Datenquelle her, der zweite ermöglicht den Zugriff über verschiedene Datenquellen hinweg. Zum Beispiel: Sie haben eine PostgreSQL-Datenquelle verbunden, und eine Tabelle in dieser Datenquelle ist eine auf FDW basierende Fremddatentabelle.
:::

### MySQL

MySQL nutzt die `federated`-Engine, die aktiviert werden muss. Sie unterstützt die Verbindung zu entfernten MySQL-Datenbanken und protokollkompatiblen Datenbanken wie MariaDB. Weitere Informationen finden Sie in der Dokumentation zum [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

In PostgreSQL können verschiedene `fdw`-Erweiterungen genutzt werden, um unterschiedliche Typen von Fremddaten zu unterstützen. Derzeit werden folgende Erweiterungen unterstützt:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Verbindet eine entfernte PostgreSQL-Datenbank in PostgreSQL.
- [mysql_fdw (in Entwicklung)](https://github.com/EnterpriseDB/mysql_fdw): Verbindet eine entfernte MySQL-Datenbank in PostgreSQL.
- Für weitere `fdw`-Erweiterungen konsultieren Sie bitte die [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Um diese in NocoBase zu integrieren, müssen Sie die entsprechenden Anpassungsschnittstellen im Code implementieren.

## Installation

Voraussetzungen

- Wenn die Hauptdatenbank von NocoBase MySQL ist, muss die `federated`-Engine aktiviert werden. Informationen dazu finden Sie unter [MySQL: Federated-Engine aktivieren](./enable-federated.md).

Anschließend installieren und aktivieren Sie das Plugin über den Plugin-Manager.

![Plugin installieren und aktivieren](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Benutzerhandbuch

Wählen Sie im Dropdown-Menü unter „Sammlungsverwaltung > Sammlung erstellen“ die Option „Fremddaten verbinden“.

![Fremddaten verbinden](https://static-docs.nocobase.com/029d946d067d1c35a39755219d623c.png)

Wählen Sie im Dropdown-Menü „Datenbankdienst“ einen bestehenden Datenbankdienst aus oder klicken Sie auf „Datenbankdienst erstellen“.

![Datenbankdienst](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Datenbankdienst erstellen

![Datenbankdienst erstellen](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Nachdem Sie den Datenbankdienst ausgewählt haben, wählen Sie im Dropdown-Menü „Entfernte Tabelle“ die Datentabelle aus, die Sie verbinden möchten.

![Die zu verbindende Datentabelle auswählen](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Feldinformationen konfigurieren

![Feldinformationen konfigurieren](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Wenn sich die Struktur der entfernten Tabelle geändert hat, können Sie auch „Von entfernter Tabelle synchronisieren“.

![Von entfernter Tabelle synchronisieren](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronisierung der entfernten Tabelle

![Synchronisierung der entfernten Tabelle](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Abschließend wird sie in der Oberfläche angezeigt.

![In der Oberfläche anzeigen](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)