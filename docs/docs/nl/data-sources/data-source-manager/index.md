---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Gegevensbronbeheer

## Introductie

NocoBase biedt een **gegevensbronbeheer plugin** voor het beheren van **gegevensbronnen** en hun **collecties**. Deze **plugin** biedt alleen een beheerinterface voor alle **gegevensbronnen** en niet de mogelijkheid om **gegevensbronnen** zelf aan te sluiten. Hiervoor moet u het combineren met diverse **gegevensbron plugins**. De **gegevensbronnen** die momenteel worden ondersteund, zijn onder andere:

- [Hoofddatabase](/data-sources/data-source-main): De hoofddatabase van NocoBase, die relationele databases zoals MySQL, PostgreSQL en MariaDB ondersteunt.
- [Externe MySQL](/data-sources/data-source-external-mysql): Gebruik een externe MySQL-database als **gegevensbron**.
- [Externe MariaDB](/data-sources/data-source-external-mariadb): Gebruik een externe MariaDB-database als **gegevensbron**.
- [Externe PostgreSQL](/data-sources/data-source-external-postgres): Gebruik een externe PostgreSQL-database als **gegevensbron**.
- [Externe MSSQL](/data-sources/data-source-external-mssql): Gebruik een externe MSSQL (SQL Server)-database als **gegevensbron**.
- [Externe Oracle](/data-sources/data-source-external-oracle): Gebruik een externe Oracle-database als **gegevensbron**.

Daarnaast kunt u via **plugins** meer typen uitbreiden. Dit kunnen gangbare databasetypen zijn, maar ook platforms die API's (SDK's) aanbieden.

## Installatie

Dit is een ingebouwde **plugin**, dus een aparte installatie is niet nodig.

## Gebruik

Bij de initiële installatie van de applicatie wordt standaard een **gegevensbron** meegeleverd voor het opslaan van NocoBase-gegevens. Deze staat bekend als de hoofddatabase. Voor meer informatie, zie de documentatie over de [Hoofddatabase](/data-sources/data-source-main/).

### Externe Gegevensbronnen

Externe databases worden ondersteund als **gegevensbronnen**. Voor meer informatie, zie de documentatie over [Externe database / Introductie](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Aangepaste databasetabellen synchroniseren

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

U kunt ook gegevens van HTTP API-bronnen aansluiten. Voor meer informatie, zie de documentatie over de [REST API gegevensbron](/data-sources/data-source-rest-api/).