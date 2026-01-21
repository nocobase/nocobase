:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Plugin

I NocoBase erbjuder en server-plugin (Server Plugin) ett modulärt sätt att utöka och anpassa serverns funktionalitet. Utvecklare kan ärva `Plugin`-klassen från `@nocobase/server` för att registrera händelser, API:er, behörighetskonfigurationer och annan anpassad logik i olika livscykelfaser.

## Plugin-klass

En grundläggande plugin-klassstruktur ser ut så här:

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

## Livscykel

Plugin-livscykelmetoderna körs i följande ordning. Varje metod har sin specifika exekveringstidpunkt och syfte:

| Livscykelmetod | Exekveringstidpunkt | Beskrivning |
|---|---|---|
| **staticImport()** | Före plugin-laddning | Statisk klassmetod som körs under initialiseringsfasen, oberoende av applikationens eller pluginets tillstånd. Används för initialiseringsarbete som inte är beroende av plugin-instanser. |
| **afterAdd()** | Körs omedelbart efter att pluginet har lagts till i plugin-hanteraren | Plugin-instansen har skapats, men alla plugin har ännu inte slutfört sin initialisering. Här kan ni utföra grundläggande initialiseringsarbete. |
| **beforeLoad()** | Körs före alla plugins `load()` | Vid denna tidpunkt kan ni komma åt alla **aktiverade plugin-instanser**. Lämpligt för att registrera databasmodeller, lyssna på databashändelser, registrera middleware och annat förberedande arbete. |
| **load()** | Körs när pluginet laddas | Alla plugins `beforeLoad()` måste vara slutförda innan `load()` börjar köras. Lämpligt för att registrera resurser, API-gränssnitt, tjänster och annan kärnverksamhetslogik. |
| **install()** | Körs när pluginet aktiveras för första gången | Denna metod körs endast en gång när pluginet först aktiveras, och används vanligtvis för att initialisera databastabellstrukturer, infoga initial data och annan installationslogik. |
| **afterEnable()** | Körs efter att pluginet har aktiverats | Denna metod körs varje gång pluginet aktiveras och kan användas för att starta schemalagda uppgifter, registrera planerade uppgifter, upprätta anslutningar och andra åtgärder efter aktivering. |
| **afterDisable()** | Körs efter att pluginet har inaktiverats | Denna metod körs när pluginet inaktiveras och kan användas för att rensa upp resurser, stoppa uppgifter, stänga anslutningar och annat upprensningsarbete. |
| **remove()** | Körs när pluginet tas bort | Denna metod körs när pluginet tas bort helt och används för att skriva avinstallationslogik, till exempel att ta bort databastabeller, rensa filer med mera. |
| **handleSyncMessage(message)** | Meddelandesynkronisering vid flernodsdistribution | När applikationen körs i flernodsläge används denna metod för att hantera meddelanden som synkroniserats från andra noder. |

### Beskrivning av exekveringsordning

Typiskt exekveringsflöde för livscykelmetoder:

1.  **Statisk initialiseringsfas**: `staticImport()`
2.  **Applikationsstartfas**: `afterAdd()` → `beforeLoad()` → `load()`
3.  **Första plugin-aktiveringsfasen**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4.  **Andra plugin-aktiveringsfasen**: `afterAdd()` → `beforeLoad()` → `load()`
5.  **Plugin-inaktiveringsfas**: `afterDisable()` körs när pluginet inaktiveras
6.  **Plugin-borttagningsfas**: `remove()` körs när pluginet tas bort

## app och relaterade medlemmar

I plugin-utveckling kan ni komma åt olika API:er som tillhandahålls av applikationsinstansen via `this.app`. Detta är kärngränssnittet för att utöka plugin-funktionaliteten. `app`-objektet innehåller systemets olika funktionsmoduler, och utvecklare kan använda dessa moduler i pluginets livscykelmetoder för att implementera affärsbehov.

### Lista över app-medlemmar

| Medlemsnamn | Typ/Modul | Huvudsakligt syfte |
|---|---|---|
| **logger** | `Logger` | Loggar systemloggar och stöder olika nivåer (info, warn, error, debug) av loggutdata, vilket underlättar felsökning och övervakning. Se [Loggar](./logger.md) |
| **db** | `Database` | Tillhandahåller ORM-lageroperationer, modellregistrering, händelselyssning, transaktionskontroll och andra databasrelaterade funktioner. Se [Databas](./database.md). |
| **resourceManager** | `ResourceManager` | Används för att registrera och hantera REST API-resurser och operationshanterare. Se [Resurshantering](./resource-manager.md). |
| **acl** | `ACL` | Åtkomstkontrollager, används för att definiera behörigheter, roller och resursåtkomstpolicyer, vilket möjliggör finkornig behörighetskontroll. Se [ACL](./acl.md). |
| **cacheManager** | `CacheManager` | Hanterar cache på systemnivå och stöder Redis, minnescache och andra cache-backendar för att förbättra applikationsprestanda. Se [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Används för att registrera, starta och hantera schemalagda uppgifter, och stöder Cron-uttryckskonfiguration. Se [Schemalagda uppgifter](./cron-job-manager.md) |
| **i18n** | `I18n` | Internationaliseringsstöd som tillhandahåller flerspråkig översättning och lokaliseringsfunktionalitet, vilket underlättar för plugin att stödja flera språk. Se [Internationalisering](./i18n.md) |
| **cli** | `CLI` | Hanterar kommandoradsgränssnitt, registrerar och kör anpassade kommandon samt utökar NocoBase CLI-funktionalitet. Se [Kommandorad](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Hanterar flera datakälla-instanser och deras anslutningar, och stöder scenarier med flera datakällor. Se [Datakällshantering](./collections.md) |
| **pm** | `PluginManager` | Plugin-hanterare, används för att dynamiskt ladda, aktivera, inaktivera och ta bort plugin samt hantera plugin-beroenden. |

> Tips: För detaljerad användning av varje modul, se respektive dokumentationskapitel.