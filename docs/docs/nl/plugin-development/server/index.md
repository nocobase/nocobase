:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht

De ontwikkeling van server-side plugins voor NocoBase biedt diverse functionaliteiten en mogelijkheden om ontwikkelaars te helpen de kernfunctionaliteiten van NocoBase aan te passen en uit te breiden. Hieronder vindt u de belangrijkste mogelijkheden van NocoBase server-side plugin ontwikkeling en de bijbehorende hoofdstukken:

| Module                                     | Beschrijving                                                                                                | Gerelateerd hoofdstuk                                      |
| :----------------------------------------- | :---------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
| **Plugin klasse**                          | Maak en beheer server-side plugins, en breid de kernfunctionaliteit uit.                                    | [plugin.md](plugin.md)                                     |
| **Databasebewerkingen**                   | Biedt interfaces voor databasebewerkingen, met ondersteuning voor CRUD en transactiebeheer.                 | [database.md](database.md)                                 |
| **Aangepaste collecties**                  | Pas collectiestructuren aan op basis van bedrijfsbehoeften voor flexibel datamodelbeheer.                   | [collections.md](collections.md)                           |
| **Gegevenscompatibiliteit bij plugin-upgrades** | Zorg ervoor dat plugin-upgrades bestaande gegevens niet beïnvloeden door gegevensmigratie en compatibiliteitsbeheer uit te voeren. | [migration.md](migration.md)                               |
| **Beheer van externe gegevensbronnen**     | Integreer en beheer externe gegevensbronnen om gegevensinteractie mogelijk te maken.                        | [data-source-manager.md](data-source-manager.md)           |
| **Aangepaste API's**                       | Breid API-resourcebeheer uit door aangepaste interfaces te schrijven.                                       | [resource-manager.md](resource-manager.md)                 |
| **API-toegangsbeheer**                     | Pas API-rechten aan voor gedetailleerde toegangscontrole.                                                   | [acl.md](acl.md)                                           |
| **Interceptie en filtering van verzoeken/responsen** | Voeg interceptors of middleware toe voor verzoeken en responsen om taken zoals logging, authenticatie, etc. af te handelen. | [context.md](context.md) en [middleware.md](middleware.md) |
| **Gebeurtenissen luisteren**               | Luister naar systeemgebeurtenissen (bijv. van de applicatie of database) en activeer de bijbehorende handlers. | [event.md](event.md)                                       |
| **Cachebeheer**                            | Beheer de cache om de applicatieprestaties en reactiesnelheid te verbeteren.                                | [cache.md](cache.md)                                       |
| **Geplande taken**                         | Maak en beheer geplande taken, zoals periodieke opschoning, gegevenssynchronisatie, etc.                    | [cron-job-manager.md](cron-job-manager.md)                 |
| **Meertalige ondersteuning**               | Integreer meertalige ondersteuning om internationalisering en lokalisatie te implementeren.                 | [i18n.md](i18n.md)                                         |
| **Loguitvoer**                             | Pas logformaten en uitvoermethoden aan om de debug- en monitoringmogelijkheden te verbeteren.               | [logger.md](logger.md)                                     |
| **Aangepaste commando's**                  | Breid de NocoBase CLI uit door aangepaste commando's toe te voegen.                                         | [command.md](command.md)                                   |
| **Testcases schrijven**                    | Schrijf en voer testcases uit om de stabiliteit en functionele nauwkeurigheid van plugins te waarborgen.    | [test.md](test.md)                                         |