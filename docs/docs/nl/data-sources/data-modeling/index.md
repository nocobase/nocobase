:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht

Datamodellering is een cruciale stap bij het ontwerpen van databases. Het omvat een diepgaande analyse en abstractie van verschillende soorten gegevens uit de echte wereld en hun onderlinge relaties. Tijdens dit proces proberen we de intrinsieke verbanden tussen gegevens te onthullen en deze formeel te beschrijven als datamodellen, wat de basis legt voor de databasestructuur van informatiesystemen. NocoBase is een datamodel-gedreven platform met de volgende kenmerken:

## Ondersteuning voor gegevens uit diverse bronnen

De gegevensbronnen van NocoBase kunnen diverse gangbare databases, API/SDK-platforms en bestanden zijn.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase biedt een [gegevensbronbeheer plugin](/data-sources/data-source-manager) voor het beheren van diverse gegevensbronnen en hun collecties. De gegevensbronbeheer plugin biedt alleen een beheerinterface voor alle gegevensbronnen en niet de mogelijkheid om direct toegang te krijgen tot gegevensbronnen. Deze moet worden gebruikt in combinatie met verschillende gegevensbron plugins. De momenteel ondersteunde gegevensbronnen zijn onder andere:

- [Hoofddatabase](/data-sources/data-source-main): NocoBase's hoofddatabase, die relationele databases zoals MySQL, PostgreSQL en MariaDB ondersteunt.
- [KingbaseES](/data-sources/data-source-kingbase): Gebruik de KingbaseES-database als gegevensbron, die zowel als hoofddatabase als externe database kan worden gebruikt.
- [Externe MySQL](/data-sources/data-source-external-mysql): Gebruik een externe MySQL-database als gegevensbron.
- [Externe MariaDB](/data-sources/data-source-external-mariadb): Gebruik een externe MariaDB-database als gegevensbron.
- [Externe PostgreSQL](/data-sources/data-source-external-postgres): Gebruik een externe PostgreSQL-database als gegevensbron.
- [Externe MSSQL](/data-sources/data-source-external-mssql): Gebruik een externe MSSQL (SQL Server)-database als gegevensbron.
- [Externe Oracle](/data-sources/data-source-external-oracle): Gebruik een externe Oracle-database als gegevensbron.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Diverse datamodelleringstools

**Eenvoudige collectiebeheerinterface**: Gebruikt om diverse modellen (collecties) te creëren of verbinding te maken met bestaande collecties.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Visuele ER-stijl interface**: Gebruikt om entiteiten en hun relaties te extraheren uit gebruikers- en bedrijfsvereisten. Het biedt een intuïtieve en gemakkelijk te begrijpen manier om datamodellen te beschrijven. Via ER-diagrammen krijgt u een duidelijker inzicht in de belangrijkste gegevensentiteiten in het systeem en hun onderlinge relaties.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Ondersteuning voor diverse collectietypes

| Collectie | Beschrijving |
| - | - |
| [Algemene collectie](/data-sources/data-source-main/general-collection) | Bevat ingebouwde, veelgebruikte systeemvelden |
| [Kalendercollectie](/data-sources/calendar/calendar-collection) | Gebruikt voor het aanmaken van kalendergerelateerde evenementencollecties |
| Opmerkingencollectie | Gebruikt voor het opslaan van opmerkingen of feedback over gegevens |
| [Boomstructuurcollectie](/data-sources/collection-tree) | Boomstructuurcollectie, ondersteunt momenteel alleen het aangrenzende lijstmodel |
| [Bestandscollectie](/data-sources/file-manager/file-collection) | Gebruikt voor het beheer van bestandsopslag |
| [SQL-collectie](/data-sources/collection-sql) | Geen daadwerkelijke databasecollectie, maar visualiseert SQL-query's op een gestructureerde manier |
| [Verbinding met databaseweergave](/data-sources/collection-view) | Maakt verbinding met bestaande databaseweergaven |
| Expressiecollectie | Gebruikt voor dynamische expressiescenario's in workflows |
| [Verbinding met externe gegevens](/data-sources/collection-fdw) | Maakt het databasesysteem mogelijk om direct toegang te krijgen tot en gegevens op te vragen in externe gegevensbronnen op basis van FDW-technologie |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Voor meer inhoud, zie de sectie „[Collectie / Overzicht](/data-sources/data-modeling/collection)” .

## Rijke verscheidenheid aan veldtypen

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Voor meer inhoud, zie de sectie „[Collectievelden / Overzicht](/data-sources/data-modeling/collection-fields)” .