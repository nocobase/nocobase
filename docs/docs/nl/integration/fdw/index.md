:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/integration/fdw/index) voor nauwkeurige informatie.
:::

# Externe datatabellen verbinden (FDW)

## Introductie

Deze functie verbindt externe datatabellen op basis van de Foreign Data Wrapper (FDW) van de database. Momenteel worden MySQL- en PostgreSQL-databases ondersteund.

:::info{title="Gegevensbronnen verbinden vs. Externe datatabellen verbinden"}
- **Gegevensbronnen verbinden** verwijst naar het tot stand brengen van een verbinding met een specifieke database of API-dienst, waarbij u de functies van de database of de diensten van de API volledig kunt gebruiken;
- **Externe datatabellen verbinden** verwijst naar het ophalen van gegevens van buitenaf en deze mappen voor lokaal gebruik. In de database wordt dit FDW (Foreign Data Wrapper) genoemd, een databasetechnologie die zich richt op het gebruik van externe tabellen als lokale tabellen. Hierbij kan slechts één tabel tegelijk worden verbonden. Omdat het om toegang op afstand gaat, zijn er verschillende beperkingen en restricties bij het gebruik ervan.

De twee kunnen ook in combinatie worden gebruikt. De eerste wordt gebruikt om een verbinding met de gegevensbron tot stand te brengen, en de tweede wordt gebruikt voor toegang tussen verschillende gegevensbronnen. Bijvoorbeeld: er is een verbinding met een bepaalde PostgreSQL-gegevensbron, en een specifieke tabel in deze gegevensbron is een externe datatabel die is gemaakt op basis van FDW.
:::

### MySQL

MySQL maakt gebruik van de `federated`-engine, die geactiveerd moet worden. Deze ondersteunt verbindingen met externe MySQL-databases en databases die compatibel zijn met het protocol, zoals MariaDB. Raadpleeg voor meer details de documentatie over de [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

In PostgreSQL kunnen verschillende soorten `fdw`-extensies worden gebruikt om verschillende soorten externe gegevens te ondersteunen. De momenteel ondersteunde extensies zijn:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Verbinding maken met een externe PostgreSQL-database in PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Verbinding maken met een externe MySQL-database in PostgreSQL.
- Voor andere soorten fdw-extensies kunt u [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers) raadplegen. U moet de bijbehorende interface in de code implementeren.

## Voorwaarden

- Als de hoofddatabase van NocoBase MySQL is, moet u `federated` activeren. Raadpleeg [Hoe u de federated-engine in MySQL inschakelt](./enable-federated)

Installeer en activeer vervolgens de plugin via de plugin-manager.

![Installeren en activeren van de plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Handleiding

Selecteer onder "Collectiebeheer > Collectie maken" in het vervolgkeuzemenu de optie "Verbinden met externe gegevens".

![Externe gegevens verbinden](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Selecteer in het vervolgkeuzemenu "Databaseserver" een bestaande databaseservice of kies "Databaseserver maken".

![Databaseservice](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Een databaseserver maken.

![Databaseservice maken](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Selecteer na het kiezen van de databaseserver de gewenste datatabel in het vervolgkeuzemenu "Externe tabel".

![Selecteer de datatabel die u wilt verbinden](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Veldinformatie configureren.

![Veldinformatie configureren](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Als de structuur van de externe tabel wijzigt, kunt u deze ook synchroniseren via "Synchroniseren vanuit externe tabel".

![Synchroniseren vanuit externe tabel](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronisatie van externe tabel.

![Synchronisatie van externe tabel](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Ten slotte wordt het weergegeven in de interface.

![Weergave in de interface](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)