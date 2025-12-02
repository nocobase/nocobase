:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Plugin

In NocoBase, il plugin lato server offre un modo modulare per estendere e personalizzare le funzionalità lato server. Gli sviluppatori possono estendere la classe `Plugin` di `@nocobase/server` per registrare eventi, API, configurazioni di permessi e altre logiche personalizzate nelle diverse fasi del ciclo di vita.

## Classe Plugin

La struttura di base di una classe plugin è la seguente:

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

## Ciclo di vita

I metodi del ciclo di vita dei plugin vengono eseguiti nel seguente ordine. Ogni metodo ha un momento di esecuzione e uno scopo specifici:

| Metodo del ciclo di vita | Momento di esecuzione | Descrizione |
|--------------------------|-----------------------|-------------|
| **staticImport()**       | Prima del caricamento del plugin | Metodo statico della classe, eseguito durante la fase di inizializzazione, indipendentemente dallo stato dell'applicazione o del plugin. Viene utilizzato per lavori di inizializzazione che non dipendono dalle istanze del plugin. |
| **afterAdd()**           | Eseguito immediatamente dopo che il plugin viene aggiunto al gestore dei plugin | L'istanza del plugin è già stata creata, ma non tutti i plugin hanno completato l'inizializzazione. È possibile eseguire alcune operazioni di inizializzazione di base. |
| **beforeLoad()**         | Eseguito prima del metodo `load()` di tutti i plugin | A questo punto, è possibile accedere a tutte le **istanze dei plugin abilitati**. È adatto per registrare modelli di database, ascoltare eventi del database, registrare middleware e altre operazioni preparatorie. |
| **load()**               | Eseguito al caricamento del plugin | Il metodo `load()` inizia l'esecuzione solo dopo che tutti i `beforeLoad()` dei plugin sono stati completati. È adatto per registrare risorse, interfacce API, servizi e altre logiche di business fondamentali. |
| **install()**            | Eseguito alla prima attivazione del plugin | Viene eseguito solo una volta, quando il plugin viene abilitato per la prima volta, ed è generalmente utilizzato per inizializzare la struttura delle tabelle del database, inserire dati iniziali e altre logiche di installazione. |
| **afterEnable()**        | Eseguito dopo l'abilitazione del plugin | Viene eseguito ogni volta che il plugin viene abilitato e può essere utilizzato per avviare attività programmate, registrare attività pianificate, stabilire connessioni e altre azioni successive all'abilitazione. |
| **afterDisable()**       | Eseguito dopo la disabilitazione del plugin | Viene eseguito quando il plugin viene disabilitato e può essere utilizzato per liberare risorse, interrompere attività, chiudere connessioni e altre operazioni di pulizia. |
| **remove()**             | Eseguito alla rimozione del plugin | Viene eseguito quando il plugin viene completamente rimosso ed è utilizzato per scrivere la logica di disinstallazione, come l'eliminazione di tabelle del database o la pulizia di file. |
| **handleSyncMessage(message)** | Sincronizzazione dei messaggi in un'implementazione multi-nodo | Quando l'applicazione è in esecuzione in modalità multi-nodo, viene utilizzato per gestire i messaggi sincronizzati dagli altri nodi. |

### Ordine di esecuzione

Flusso di esecuzione tipico dei metodi del ciclo di vita:

1.  **Fase di inizializzazione statica**: `staticImport()`
2.  **Fase di avvio dell'applicazione**: `afterAdd()` → `beforeLoad()` → `load()`
3.  **Fase di prima abilitazione del plugin**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4.  **Fase di riabilitazione del plugin**: `afterAdd()` → `beforeLoad()` → `load()`
5.  **Fase di disabilitazione del plugin**: `afterDisable()` viene eseguito quando il plugin è disabilitato.
6.  **Fase di rimozione del plugin**: `remove()` viene eseguito quando il plugin è rimosso.

## app e membri correlati

Nello sviluppo di plugin, può accedere a varie API fornite dall'istanza dell'applicazione tramite `this.app`, che rappresenta l'interfaccia principale per estendere le funzionalità del plugin. L'oggetto `app` contiene vari moduli funzionali del sistema. Gli sviluppatori possono utilizzare questi moduli nei metodi del ciclo di vita del plugin per implementare i requisiti di business.

### Elenco dei membri di app

| Nome membro | Tipo/Modulo | Scopo principale |
|-------------|-------------|------------------|
| **logger** | `Logger` | Registra i log di sistema, supporta diversi livelli (info, warn, error, debug) di output del log, utile per il debug e il monitoraggio. Vedere [Logger](./logger.md) |
| **db** | `Database` | Fornisce operazioni a livello ORM, registrazione di modelli, ascolto di eventi, controllo delle transazioni e altre funzionalità relative al database. Vedere [Database](./database.md). |
| **resourceManager** | `ResourceManager` | Utilizzato per registrare e gestire risorse API REST e gestori di operazioni. Vedere [Gestione delle risorse](./resource-manager.md). |
| **acl** | `ACL` | Livello di controllo degli accessi, utilizzato per definire permessi, ruoli e politiche di accesso alle risorse, implementando un controllo dei permessi granulare. Vedere [ACL](./acl.md). |
| **cacheManager** | `CacheManager` | Gestisce la cache a livello di sistema, supporta Redis, cache in memoria e altri backend di cache per migliorare le prestazioni dell'applicazione. Vedere [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Utilizzato per registrare, avviare e gestire attività programmate, supporta la configurazione di espressioni Cron. Vedere [Attività programmate](./cron-job-manager.md) |
| **i18n** | `I18n` | Supporto all'internazionalizzazione, fornisce funzionalità di traduzione multilingue e localizzazione, facilitando il supporto multilingue per i plugin. Vedere [Internazionalizzazione](./i18n.md) |
| **cli** | `CLI` | Gestisce l'interfaccia a riga di comando, registra ed esegue comandi personalizzati, estende le funzionalità della CLI di NocoBase. Vedere [Riga di comando](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Gestisce più istanze di **fonte dati** e le loro connessioni, supporta scenari multi-fonte dati. Vedere [Gestione delle fonti dati](./collections.md) |
| **pm** | `PluginManager` | Gestore dei plugin, utilizzato per caricare, abilitare, disabilitare e rimuovere dinamicamente i plugin, gestire le dipendenze tra i plugin. |

> Nota: Per l'utilizzo dettagliato di ciascun modulo, consulti i capitoli della documentazione corrispondenti.