---
pkg: "@nocobase/plugin-data-source-manager"
title: "Datenquellenverwaltung"
description: "Plugin zur Datenquellenverwaltung: Verwaltung der Hauptdatenbank, externer Datenbanken, REST-API-Datenquellen und externer NocoBase-Datenquellen mit einer einheitlichen Oberfläche zur Datenquellenverwaltung."
keywords: "Datenquellenverwaltung,Hauptdatenbank,externe Datenbanken,Datentabellensynchronisierung,REST-API-Datenquelle,NocoBase"
---
# Datenquellenverwaltung

## Einführung

NocoBase stellt ein Plugin zur Datenquellenverwaltung bereit, mit dem Datenquellen und deren Datentabellen verwaltet werden können. Das Plugin zur Datenquellenverwaltung bietet lediglich eine Verwaltungsoberfläche für alle Datenquellen, jedoch keine Möglichkeit, Datenquellen anzubinden. Es muss zusammen mit den entsprechenden Datenquellen-Plugins verwendet werden. Derzeit werden folgende Datenquellen unterstützt:

- [Main Database](/data-sources/data-source-main/): Die Hauptdatenbank von NocoBase; unterstützt MySQL, PostgreSQL, MariaDB, KingbaseES und OceanBase.
- [External PostgreSQL](/data-sources/data-source-external-postgres/): Verwendung einer externen PostgreSQL-Datenbank als Datenquelle.
- [External MySQL](/data-sources/data-source-external-mysql/): Verwendung einer externen MySQL-Datenbank als Datenquelle.
- [External MariaDB](/data-sources/data-source-external-mariadb/): Verwendung einer externen MariaDB-Datenbank als Datenquelle.
- [External MSSQL](/data-sources/data-source-external-mssql/): Verwendung einer externen MSSQL-Datenbank (SQL Server) als Datenquelle.
- [External KingbaseES](/data-sources/data-source-kingbase/): Verwendung einer externen KingbaseES-Datenbank als Datenquelle.
- [External OceanBase](/data-sources/external/oceanbase): Verwendung einer externen OceanBase-Datenbank als Datenquelle.
- [External Oracle](/data-sources/data-source-external-oracle/): Verwendung einer externen Oracle-Datenbank als Datenquelle.
- [External ClickHouse](/data-sources/external/clickhouse): Verwendung einer externen ClickHouse-Datenbank als Datenquelle, in der Regel für Abfragen, Auswertungen und die Darstellung von Berichten.
- [External Doris](/data-sources/external/doris): Verwendung einer externen Doris-Datenbank als Datenquelle, in der Regel für Abfragen, Auswertungen und die Darstellung von Berichten.
- [REST API 数据源](/data-sources/data-source-rest-api/): Einbindung von Daten aus REST-API-Quellen in NocoBase.
- [External NocoBase](/data-sources/data-source-external-nocobase/): Verwendung einer anderen NocoBase-Anwendung als externe Datenquelle über die entfernte NocoBase-API.

Darüber hinaus können über Plugins weitere Typen hinzugefügt werden, darunter gängige Datenbanken sowie Plattformen, die APIs (SDKs) bereitstellen.

## Installation

Integriertes Plugin, keine separate Installation erforderlich.

## Verwendung

Bei der Erstinstallation der Anwendung wird standardmäßig eine Datenquelle zur Speicherung der NocoBase-Daten bereitgestellt, die als Hauptdatenbank bezeichnet wird. Weitere Informationen finden Sie in der Dokumentation zur [Hauptdatenbank](/data-sources/data-source-main/index.md).

### Externe Datenquellen

Externe Datenbanken können als Datenquellen verwendet werden. Weitere Informationen finden Sie in der Dokumentation [Externe Datenbanken / Einführung](/data-sources/data-source-manager/external-database.md).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Unterstützung der Synchronisierung selbst erstellter Datenbanktabellen

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Auch Daten aus HTTP-API-Quellen können eingebunden werden. Weitere Informationen finden Sie in der Dokumentation zu [REST-API-Datenquellen](/data-sources/data-source-rest-api/index.md).

### Externe NocoBase-Datenquellen

Über die entfernte NocoBase-API kann eine andere NocoBase-Anwendung als externe Datenquelle eingebunden werden. Weitere Informationen finden Sie in der Dokumentation zu [externen NocoBase-Datenquellen](/data-sources/data-source-external-nocobase/index.md).