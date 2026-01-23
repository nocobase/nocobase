---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Datenquellenverwaltung

## Einführung

NocoBase bietet ein Plugin zur Datenquellenverwaltung, das Sie zur Verwaltung von Datenquellen und deren Sammlungen nutzen können. Das Datenquellenverwaltungs-Plugin stellt lediglich eine Verwaltungsoberfläche für alle Datenquellen bereit und bietet nicht die Möglichkeit, Datenquellen direkt anzubinden. Es muss in Verbindung mit verschiedenen Datenquellen-Plugins verwendet werden. Derzeit werden folgende Datenquellen unterstützt:

- [Hauptdatenbank](/data-sources/data-source-main): Die Hauptdatenbank von NocoBase, die relationale Datenbanken wie MySQL, PostgreSQL und MariaDB unterstützt.
- [Externe MySQL-Datenbank](/data-sources/data-source-external-mysql): Verwenden Sie eine externe MySQL-Datenbank als Datenquelle.
- [Externe MariaDB-Datenbank](/data-sources/data-source-external-mariadb): Verwenden Sie eine externe MariaDB-Datenbank als Datenquelle.
- [Externe PostgreSQL-Datenbank](/data-sources/data-source-external-postgres): Verwenden Sie eine externe PostgreSQL-Datenbank als Datenquelle.
- [Externe MSSQL-Datenbank](/data-sources/data-source-external-mssql): Verwenden Sie eine externe MSSQL- (SQL Server) Datenbank als Datenquelle.
- [Externe Oracle-Datenbank](/data-sources/data-source-external-oracle): Verwenden Sie eine externe Oracle-Datenbank als Datenquelle.

Darüber hinaus können Sie über Plugins weitere Typen erweitern. Dies können gängige Datenbanktypen oder auch Plattformen sein, die APIs (SDKs) bereitstellen.

## Installation

Es handelt sich um ein integriertes Plugin, das keine separate Installation erfordert.

## Verwendung

Wenn die Anwendung initialisiert und installiert wird, wird standardmäßig eine Datenquelle zur Speicherung von NocoBase-Daten bereitgestellt, die als Hauptdatenbank bezeichnet wird. Weitere Informationen finden Sie in der Dokumentation zur [Hauptdatenbank](/data-sources/data-source-main/).

### Externe Datenquellen

Externe Datenbanken werden als Datenquellen unterstützt. Weitere Informationen finden Sie in der Dokumentation zu [Externen Datenbanken / Einführung](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Unterstützung für die Synchronisierung benutzerdefinierter Datenbanktabellen

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Sie können auch Daten aus HTTP-API-Quellen anbinden. Weitere Informationen finden Sie in der Dokumentation zur [REST API Datenquelle](/data-sources/data-source-rest-api/).