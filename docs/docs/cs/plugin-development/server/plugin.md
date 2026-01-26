:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Plugin

V NocoBase poskytuje serverový plugin (Server Plugin) modulární způsob, jak rozšířit a přizpůsobit funkcionalitu serveru. Vývojáři mohou rozšířením třídy `Plugin` z `@nocobase/server` registrovat události, API rozhraní, konfigurace oprávnění a další vlastní logiku v různých fázích životního cyklu.

## Třída pluginu

Základní struktura třídy pluginu je následující:

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

## Životní cyklus

Metody životního cyklu pluginu jsou prováděny v následujícím pořadí. Každá metoda má svůj specifický čas spuštění a účel:

| Metoda životního cyklu | Čas spuštění | Popis |
|------------------------|--------------|-------|
| **staticImport()**     | Před načtením pluginu | Statická metoda třídy, prováděná během inicializační fáze nezávislé na stavu aplikace nebo pluginu. Slouží k inicializačním úkolům, které nezávisí na instancích pluginu. |
| **afterAdd()**         | Spuštěno ihned poté, co je plugin přidán do správce pluginů | Instance pluginu je již vytvořena, ale ne všechny pluginy jsou plně inicializovány. Lze provést základní inicializační práce. |
| **beforeLoad()**       | Spuštěno před metodou `load()` všech pluginů | V této fázi jsou dostupné všechny **povolené instance pluginů**. Vhodné pro registraci databázových modelů, naslouchání databázovým událostem, registraci middleware a další přípravné práce. |
| **load()**             | Spuštěno při načítání pluginu | Metoda `load()` se začne provádět až po dokončení `beforeLoad()` všech pluginů. Vhodné pro registraci zdrojů, API rozhraní, služeb a další klíčové obchodní logiky. |
| **install()**          | Spuštěno při první aktivaci pluginu | Provádí se pouze jednou, když je plugin poprvé povolen. Obvykle se používá pro inicializaci databázových tabulek, vkládání počátečních dat a další instalační logiku. |
| **afterEnable()**      | Spuštěno po povolení pluginu | Provádí se pokaždé, když je plugin povolen. Lze použít ke spuštění časovaných úloh, registraci plánovaných úloh, navázání připojení a dalších akcí po povolení. |
| **afterDisable()**     | Spuštěno po zakázání pluginu | Provádí se, když je plugin zakázán. Lze použít k uvolnění zdrojů, zastavení úloh, uzavření připojení a dalším úklidovým pracím. |
| **remove()**           | Spuštěno při odstranění pluginu | Provádí se, když je plugin zcela odstraněn. Slouží k implementaci odinstalační logiky, jako je mazání databázových tabulek, čištění souborů apod. |
| **handleSyncMessage(message)** | Synchronizace zpráv při víceuživatelském nasazení | Když aplikace běží v režimu více uzlů, slouží ke zpracování zpráv synchronizovaných z jiných uzlů. |

### Popis pořadí spouštění

Typický průběh spouštění metod životního cyklu:

1. **Fáze statické inicializace**: `staticImport()`
2. **Fáze spuštění aplikace**: `afterAdd()` → `beforeLoad()` → `load()`
3. **Fáze prvního povolení pluginu**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **Fáze opětovného povolení pluginu**: `afterAdd()` → `beforeLoad()` → `load()`
5. **Fáze zakázání pluginu**: `afterDisable()` je spuštěno, když je plugin zakázán
6. **Fáze odstranění pluginu**: `remove()` je spuštěno, když je plugin odstraněn

## app a související členové

Při vývoji pluginů máte prostřednictvím `this.app` přístup k různým API rozhraním poskytovaným instancí aplikace, což je klíčové rozhraní pro rozšíření funkcionality pluginu. Objekt `app` obsahuje různé funkční moduly systému. Vývojáři mohou tyto moduly používat v metodách životního cyklu pluginu k implementaci obchodních požadavků.

### Seznam členů app

| Název člena | Typ/Modul | Hlavní účel |
|-------------|-----------|-------------|
| **logger** | `Logger` | Zaznamenává systémové logy, podporuje výstup logů různých úrovní (info, warn, error, debug), což usnadňuje ladění a monitorování. Viz [Logování](./logger.md) |
| **db** | `Database` | Poskytuje operace ORM vrstvy, registraci modelů, naslouchání událostem, řízení transakcí a další funkce související s databází. Viz [Databáze](./database.md). |
| **resourceManager** | `ResourceManager` | Slouží k registraci a správě REST API zdrojů a obslužných programů operací. Viz [Správa zdrojů](./resource-manager.md). |
| **acl** | `ACL` | Vrstva řízení přístupu, slouží k definování oprávnění, rolí a zásad přístupu ke zdrojům, implementuje jemně odstupňovanou kontrolu oprávnění. Viz [Řízení přístupu (ACL)](./acl.md). |
| **cacheManager** | `CacheManager` | Spravuje systémovou cache, podporuje různé cache backendy jako Redis, paměťovou cache, čímž zlepšuje výkon aplikace. Viz [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Slouží k registraci, spouštění a správě plánovaných úloh, podporuje konfiguraci Cron výrazů. Viz [Plánované úlohy](./cron-job-manager.md) |
| **i18n** | `I18n` | Podpora internacionalizace, poskytuje vícejazyčný překlad a lokalizační funkce, což usnadňuje pluginům podporu více jazyků. Viz [Internacionalizace](./i18n.md) |
| **cli** | `CLI` | Spravuje rozhraní příkazového řádku, registruje a spouští vlastní příkazy, rozšiřuje funkcionalitu NocoBase CLI. Viz [Příkazový řádek](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Spravuje více instancí zdrojů dat a jejich připojení, podporuje scénáře s více zdroji dat. Viz [Správa zdrojů dat](./collections.md) |
| **pm** | `PluginManager` | Správce pluginů, slouží k dynamickému načítání, povolování, zakazování a odstraňování pluginů, spravuje závislosti mezi pluginy. |

> Tip: Podrobné použití jednotlivých modulů naleznete v příslušných kapitolách dokumentace.