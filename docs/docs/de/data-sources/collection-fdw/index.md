---
pkg: "@nocobase/plugin-collection-fdw"
title: "Externe Datentabellen verbinden (FDW)"
description: "Verbindung zu entfernten Datentabellen auf Basis von Foreign Data Wrapper, einschließlich der MySQL-Federated-Engine und postgres_fdw für PostgreSQL, um entfernte Tabellen als lokale Tabellen zu verwenden."
keywords: "FDW,Foreign Data Wrapper,federated,postgres_fdw,externe Tabellen,entfernte Tabellen,NocoBase"
---
# Externe Datentabellen verbinden (FDW)

## Einführung

Ein Plugin zur Verbindung mit entfernten Datentabellen auf Basis der Foreign-Data-Wrapper-Funktionalität der Datenbank. Derzeit werden MySQL- und PostgreSQL-Datenbanken unterstützt.

:::info{title="Datenquelle verbinden vs. externe Datentabelle verbinden"}
- **Eine Datenquelle verbinden** bedeutet, eine Verbindung zu einer bestimmten Datenbank oder einem API-Dienst herzustellen und die Funktionen der Datenbank oder die vom API bereitgestellten Dienste vollständig zu nutzen;
- **Eine externe Datentabelle verbinden** bedeutet, Daten von extern abzurufen und sie zur lokalen Verwendung abzubilden. In Datenbanken wird dies als FDW (Foreign Data Wrapper) bezeichnet. Dabei handelt es sich um eine Datenbanktechnologie, die darauf ausgerichtet ist, entfernte Tabellen wie lokale Tabellen zu verwenden. Es kann jeweils nur eine Tabelle verbunden werden. Da der Zugriff remote erfolgt, gibt es bei der Verwendung verschiedene Einschränkungen und Begrenzungen.

Beide Ansätze können auch kombiniert werden: Ersterer dient zum Herstellen der Verbindung mit einer Datenquelle, letzterer zum datenquellenübergreifenden Zugriff. Beispielsweise kann eine PostgreSQL-Datenquelle verbunden werden, die eine auf Basis von FDW erstellte externe Datentabelle enthält.
:::

### MySQL

MySQL verwendet die Engine `federated`, die aktiviert werden muss. Sie unterstützt Verbindungen zu entfernten MySQL-Datenbanken sowie zu protokollkompatiblen Datenbanken wie MariaDB. Weitere Informationen finden Sie in der Dokumentation zu [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

In PostgreSQL können verschiedene Typen von `fdw`-Erweiterungen verwendet werden, um unterschiedliche entfernte Datentypen zu unterstützen. Derzeit werden folgende Erweiterungen unterstützt:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Verbindung zu einer entfernten PostgreSQL-Datenbank in PostgreSQL.
- [mysql_fdw (in Entwicklung)](https://github.com/EnterpriseDB/mysql_fdw): Verbindung zu einer entfernten MySQL-Datenbank in PostgreSQL.
- Weitere fdw-Erweiterungen finden Sie unter [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Für die Integration in NocoBase muss die entsprechende Adapter-Schnittstelle im Code implementiert werden.

## Installation

Voraussetzungen

- Wenn die Hauptdatenbank von NocoBase MySQL ist, muss `federated` aktiviert werden. Siehe [So aktivieren Sie die Federated-Engine in MySQL](./enable-federated.md).

Installieren und aktivieren Sie anschließend das Plugin über den Plugin-Manager.

![Plugin installieren und aktivieren](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Benutzerhandbuch

Wählen Sie im Dropdown-Menü unter „Tabellenverwaltung > Datentabelle erstellen“ die Option „Externe Daten verbinden“.

![Externe Daten verbinden](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Wählen Sie im Dropdown-Menü „Datenbankdienst“ einen bereits vorhandenen Datenbankdienst oder „Datenbankdienst erstellen“.

![Datenbankdienst](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Datenbankdienst erstellen

![Datenbankdienst erstellen](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Wählen Sie nach Auswahl des Datenbankdienstes im Dropdown-Menü „Entfernte Tabelle“ die zu verbindende Datentabelle aus.

![Zu verbindende Datentabelle auswählen](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Feldinformationen konfigurieren

![Feldinformationen konfigurieren](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Wenn sich die Struktur der entfernten Tabelle geändert hat, können Sie auch „Mit entfernter Tabelle synchronisieren“ auswählen.

![Mit entfernter Tabelle synchronisieren](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronisierung der entfernten Tabelle

![Synchronisierung der entfernten Tabelle](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Schließlich wird die Tabelle in der Benutzeroberfläche angezeigt.

![In der Benutzeroberfläche anzeigen](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)