:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht

Datamodellering is een cruciale stap bij het ontwerpen van databases. Het omvat een diepgaande analyse en abstractie van diverse soorten gegevens uit de echte wereld en hun onderlinge relaties. Tijdens dit proces proberen we de intrinsieke verbanden tussen gegevens te onthullen en deze formeel te beschrijven als datamodellen, wat de basis legt voor de databasestructuur van informatiesystemen. NocoBase is een datamodel-gedreven platform met de volgende kenmerken:

## Ondersteuning voor gegevens uit diverse gegevensbronnen

De gegevensbronnen van NocoBase kunnen diverse gangbare databases, API/SDK-platforms en bestanden zijn.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase biedt de [gegevensbronbeheer plugin](/data-sources/data-source-manager) voor het beheren van diverse gegevensbronnen en hun collecties. De gegevensbronbeheer plugin biedt alleen een beheerinterface voor alle gegevensbronnen en biedt niet de mogelijkheid om direct toegang te krijgen tot gegevensbronnen. Deze moet worden gebruikt in combinatie met verschillende gegevensbron plugins. De momenteel ondersteunde gegevensbronnen omvatten:

- [Hoofddatabase](/data-sources/data-source-main): De hoofddatabase van NocoBase, die relationele databases zoals MySQL, PostgreSQL en MariaDB ondersteunt.
- [KingbaseES](/data-sources/data-source-kingbase): Gebruik de KingbaseES-database als gegevensbron, die zowel als hoofddatabase als externe database kan worden gebruikt.
- [Externe MySQL](/data-sources/data-source-external-mysql): Gebruik een externe MySQL-database als gegevensbron.
- [Externe MariaDB](/data-sources/data-source-external-mariadb): Gebruik een externe MariaDB-database als gegevensbron.
- [Externe PostgreSQL](/data-sources/data-source-external-postgres): Gebruik een externe PostgreSQL-database als gegevensbron.
- [Externe MSSQL](/data-sources/data-source-external-mssql): Gebruik een externe MSSQL (SQL Server)-database als gegevensbron.
- [Externe Oracle](/data-sources/data-source-external-oracle): Gebruik een externe Oracle-database als gegevensbron.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Biedt diverse datamodelleringstools

**Eenvoudige collectiebeheerinterface**: Gebruikt voor het aanmaken van diverse modellen (collecties) of het verbinden met bestaande modellen (collecties).

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Visuele ER-stijl interface**: Gebruikt om entiteiten en hun relaties te extraheren uit gebruikers- en bedrijfsvereisten. Het biedt een intuïtieve en gemakkelijk te begrijpen manier om datamodellen te beschrijven. Via ER-diagrammen krijgt u een duidelijker inzicht in de belangrijkste gegevensentiteiten in het systeem en hun onderlinge relaties.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Ondersteuning voor diverse collectietypen

| Collectie | Beschrijving |
| - | - |
| [Algemene collectie](/data-sources/data-source-main/general-collection) | Bevat ingebouwde, veelgebruikte systeemvelden |
| [Kalender collectie](/data-sources/calendar/calendar-collection) | Gebruikt voor het aanmaken van kalendergerelateerde evenementencollecties |
| Reactie collectie | Gebruikt voor het opslaan van opmerkingen of feedback over gegevens |
| [Boomstructuur collectie](/data-sources/collection-tree) | Boomstructuur collectie, ondersteunt momenteel alleen het aangrenzende lijstmodel |
| [Bestands collectie](/data-sources/file-manager/file-collection) | Gebruikt voor het beheer van bestandsopslag |
| [SQL collectie](/data-sources/collection-sql) | Geen daadwerkelijke database collectie, maar visualiseert SQL-query's op een gestructureerde manier |
| [Verbinden met databaseweergave](/data-sources/collection-view) | Maakt verbinding met bestaande databaseweergaven |
| Expressie collectie | Gebruikt voor dynamische expressiescenario's in workflows |
| [Verbinden met externe gegevens](/data-sources/collection-fdw) | Maakt verbinding met externe collecties op basis van FDW-technologie van de database |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Voor meer inhoud, zie de sectie „[Collectie / Overzicht](/data-sources/data-modeling/collection)”.

## Biedt een rijke verscheidenheid aan veldtypen

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Voor meer inhoud, zie de sectie „[Collectievelden / Overzicht](/data-sources/data-modeling/collection-fields)”.