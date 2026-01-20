:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Plugin

In NocoBase biedt een Server Plugin een modulaire manier om de functionaliteit aan de serverzijde uit te breiden en aan te passen. Ontwikkelaars kunnen de `Plugin`-klasse van `@nocobase/server` uitbreiden om in verschillende levenscyclusfasen events, API's, permissieconfiguraties en andere aangepaste logica te registreren.

## Plugin-klasse

Een basisstructuur van een plugin-klasse ziet er als volgt uit:

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## Levenscyclus

De levenscyclusmethoden van een plugin worden in de volgende volgorde uitgevoerd. Elke methode heeft een specifiek uitvoeringsmoment en doel:

| Levenscyclusmethode | Uitvoeringsmoment | Beschrijving |
|--------------|----------|------|
| **staticImport()** | Vóór het laden van de plugin | Een statische methode van de klasse, uitgevoerd tijdens een initialisatiefase die onafhankelijk is van de applicatie- of pluginstatus. Wordt gebruikt voor initialisatiewerk dat niet afhankelijk is van een plugin-instantie. |
| **afterAdd()** | Direct na het toevoegen van de plugin aan de plugin manager | De plugin-instantie is aangemaakt, maar niet alle plugins zijn volledig geïnitialiseerd. U kunt hier basis-initialisatiewerk uitvoeren. |
| **beforeLoad()** | Uitgevoerd vóór de `load()` van alle plugins | Op dit punt heeft u toegang tot alle **ingeschakelde plugin-instanties**. Geschikt voor het registreren van databasemodellen, luisteren naar database-events, registreren van middleware en ander voorbereidend werk. |
| **load()** | Uitgevoerd wanneer de plugin laadt | Wordt pas uitgevoerd nadat de `beforeLoad()` van alle plugins is voltooid. Geschikt voor het registreren van resources, API-interfaces, services en andere kern-bedrijfslogica. |
| **install()** | Uitgevoerd wanneer de plugin voor het eerst wordt geactiveerd | Wordt slechts één keer uitgevoerd, de eerste keer dat de plugin wordt ingeschakeld. Wordt doorgaans gebruikt voor het initialiseren van databasetabelstructuren, het invoegen van initiële gegevens en andere installatielogica. |
| **afterEnable()** | Uitgevoerd nadat de plugin is ingeschakeld | Wordt elke keer uitgevoerd als de plugin wordt ingeschakeld. Kan worden gebruikt voor het starten van geplande taken, het registreren van cronjobs, het opzetten van verbindingen en andere acties na het inschakelen. |
| **afterDisable()** | Uitgevoerd nadat de plugin is uitgeschakeld | Wordt uitgevoerd wanneer de plugin wordt uitgeschakeld. Kan worden gebruikt voor het opschonen van resources, stoppen van taken, sluiten van verbindingen en ander opruimwerk. |
| **remove()** | Uitgevoerd wanneer de plugin wordt verwijderd | Wordt uitgevoerd wanneer de plugin volledig wordt verwijderd. Wordt gebruikt voor de-installatielogica, zoals het verwijderen van databasetabellen, opschonen van bestanden, etc. |
| **handleSyncMessage(message)** | Berichtsynchronisatie bij een multi-node deployment | Wanneer de applicatie in een multi-node modus draait, wordt dit gebruikt om berichten te verwerken die van andere nodes gesynchroniseerd worden. |

### Uitleg over de uitvoeringsvolgorde

De typische uitvoeringsvolgorde van de levenscyclusmethoden:

1.  **Statische initialisatiefase**: `staticImport()`
2.  **Opstartfase van de applicatie**: `afterAdd()` → `beforeLoad()` → `load()`
3.  **Eerste inschakelfase van de plugin**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4.  **Fase bij opnieuw inschakelen**: `afterAdd()` → `beforeLoad()` → `load()`
5.  **Uitschakelfase van de plugin**: `afterDisable()` wordt uitgevoerd bij het uitschakelen van de plugin
6.  **Verwijderfase van de plugin**: `remove()` wordt uitgevoerd bij het verwijderen van de plugin

## `app` en gerelateerde members

Bij de ontwikkeling van plugins kunt u via `this.app` toegang krijgen tot de verschillende API's die de applicatie-instantie biedt. Dit is de kerninterface voor het uitbreiden van de functionaliteit van een plugin. Het `app`-object bevat de verschillende functionele modules van het systeem. Ontwikkelaars kunnen deze modules gebruiken in de levenscyclusmethoden van de plugin om bedrijfsvereisten te implementeren.

### Lijst van `app`-members

| Membernaam | Type/Module | Hoofddoel |
|-----------|------------|-----------|
| **logger** | `Logger` | Systeemlogs vastleggen. Ondersteunt verschillende niveaus (info, warn, error, debug) voor log-output, wat handig is voor debuggen en monitoring. Zie [Logger](./logger.md) |
| **db** | `Database` | Biedt ORM-laag operaties, modelregistratie, event listening, transactiebeheer en andere database-gerelateerde functies. Zie [Database](./database.md). |
| **resourceManager** | `ResourceManager` | Wordt gebruikt voor het registreren en beheren van REST API-resources en hun handlers. Zie [Resource Manager](./resource-manager.md). |
| **acl** | `ACL` | Toegangscontrolelaag (Access Control Layer), voor het definiëren van permissies, rollen en toegangsbeleid voor resources, om fijnmazige toegangscontrole te realiseren. Zie [ACL](./acl.md). |
| **cacheManager** | `CacheManager` | Beheert de cache op systeemniveau. Ondersteunt diverse cache-backends zoals Redis en in-memory cache om de prestaties van de applicatie te verbeteren. Zie [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Wordt gebruikt voor het registreren, starten en beheren van geplande taken (cronjobs). Ondersteunt configuratie via Cron-expressies. Zie [Geplande Taken](./cron-job-manager.md) |
| **i18n** | `I18n` | Ondersteuning voor internationalisatie. Biedt meertalige vertalingen en lokalisatiefuncties, zodat plugins meerdere talen kunnen ondersteunen. Zie [Internationalisatie](./i18n.md) |
| **cli** | `CLI` | Beheert de command-line interface. Registreert en voert aangepaste commando's uit om de NocoBase CLI-functionaliteit uit te breiden. Zie [Command Line](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Beheert meerdere gegevensbron-instanties en hun verbindingen. Ondersteunt scenario's met meerdere gegevensbronnen. Zie [Gegevensbronbeheer](./collections.md) |
| **pm** | `PluginManager` | Plugin manager, voor het dynamisch laden, in- en uitschakelen en verwijderen van plugins, en het beheren van afhankelijkheden tussen plugins. |

> Tip: Raadpleeg de betreffende documentatiehoofdstukken voor gedetailleerde gebruiksinformatie over elke module.