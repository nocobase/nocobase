---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Externe datatabellen verbinden (FDW)

## Introductie

Deze plugin maakt het mogelijk om externe datatabellen te verbinden, gebaseerd op de 'foreign data wrapper' implementatie van de database. Momenteel worden MySQL- en PostgreSQL-databases ondersteund.

:::info{title="Gegevensbronnen verbinden vs. Externe datatabellen verbinden"}
- **Gegevensbronnen verbinden** verwijst naar het tot stand brengen van een verbinding met een specifieke database of API-service, waarbij u de functionaliteiten van de database of de diensten van de API volledig kunt benutten;
- **Externe datatabellen verbinden** verwijst naar het ophalen van gegevens van buitenaf en deze lokaal in kaart brengen voor gebruik. In databases staat dit bekend als FDW (Foreign Data Wrapper), een databasetechnologie die zich richt op het gebruiken van externe tabellen alsof het lokale tabellen zijn, waarbij u tabellen één voor één verbindt. Vanwege de externe toegang zijn er diverse beperkingen en restricties bij het gebruik ervan.

De twee kunnen ook gecombineerd worden gebruikt: de eerste methode dient om een verbinding met de gegevensbron tot stand te brengen, en de tweede voor toegang over meerdere gegevensbronnen heen. Een voorbeeld: u verbindt een PostgreSQL-gegevensbron, en een bepaalde tabel in die gegevensbron is een externe datatabel die is aangemaakt op basis van FDW.
:::

### MySQL

MySQL maakt gebruik van de `federated`-engine, die geactiveerd moet worden. Deze engine ondersteunt het verbinden met externe MySQL-databases en protocol-compatibele databases, zoals MariaDB. Voor meer details, raadpleeg de documentatie over de [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

In PostgreSQL kunnen verschillende typen `fdw`-extensies worden gebruikt om diverse externe gegevenstypen te ondersteunen. De momenteel ondersteunde extensies zijn:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Om een externe PostgreSQL-database te verbinden vanuit PostgreSQL.
- [mysql_fdw (in ontwikkeling)](https://github.com/EnterpriseDB/mysql_fdw): Om een externe MySQL-database te verbinden vanuit PostgreSQL.
- Voor overige typen fdw-extensies, raadpleeg [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Om deze te integreren met NocoBase, dient u de bijbehorende adaptatie-interface in de code te implementeren.

## Installatie

Vereisten

- Als de hoofddatabase van NocoBase MySQL is, moet u `federated` activeren. Raadpleeg [Hoe de federated-engine in MySQL in te schakelen](./enable-federated.md).

Installeer en activeer vervolgens de plugin via de pluginmanager.

![Plugin installeren en activeren](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Gebruikershandleiding

Kies in het dropdownmenu onder "Collectiebeheer > Collectie aanmaken" de optie "Externe gegevens verbinden".

![Externe gegevens verbinden](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Selecteer in het dropdownmenu "Databaseservice" een bestaande databaseservice, of kies voor "Databaseservice aanmaken".

![Databaseservice](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Een databaseservice aanmaken

![Databaseservice aanmaken](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Nadat u de databaseservice heeft geselecteerd, kiest u in het dropdownmenu "Externe tabel" de datatabel die u wilt verbinden.

![De datatabel selecteren die u wilt verbinden](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Veldinformatie configureren

![Veldinformatie configureren](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Als de externe tabel structurele wijzigingen heeft ondergaan, kunt u deze ook "Synchroniseren vanuit externe tabel".

![Synchroniseren vanuit externe tabel](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Externe tabel synchronisatie

![Externe tabel synchronisatie](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Tot slot, de weergave in de interface:

![Weergave in de interface](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)