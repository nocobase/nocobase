:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Evento

Il server di NocoBase (Server) attiva eventi specifici durante il ciclo di vita dell'applicazione, quello dei plugin e le operazioni sul database. Gli sviluppatori di plugin possono ascoltare questi eventi per implementare logiche di estensione, automatizzare operazioni o definire comportamenti personalizzati.

Il sistema di eventi di NocoBase si articola principalmente su due livelli:

-   **`app.on()` - Eventi a livello di applicazione**: Permettono di ascoltare gli eventi del ciclo di vita dell'applicazione, come l'avvio, l'installazione, l'attivazione dei plugin, ecc.
-   **`db.on()` - Eventi a livello di database**: Permettono di ascoltare gli eventi operativi a livello del modello dati, come la creazione, l'aggiornamento o l'eliminazione di record.

Entrambi ereditano da `EventEmitter` di Node.js e supportano le interfacce standard `.on()`, `.off()` e `.emit()`. NocoBase estende inoltre il supporto per `emitAsync`, utilizzato per attivare eventi in modo asincrono e attendere il completamento dell'esecuzione di tutti i listener.

## Dove registrare i listener degli eventi

I listener degli eventi dovrebbero essere generalmente registrati nel metodo `beforeLoad()` del plugin. Questo assicura che gli eventi siano pronti durante la fase di caricamento del plugin e che la logica successiva possa rispondere correttamente.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Ascolta gli eventi dell'applicazione
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase è stato avviato');
    });

    // Ascolta gli eventi del database
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Nuovo post: ${model.get('title')}`);
      }
    });
  }
}
```

## Ascoltare gli eventi dell'applicazione `app.on()`

Gli eventi dell'applicazione servono a catturare i cambiamenti nel ciclo di vita dell'applicazione NocoBase e dei suoi plugin. Sono ideali per la logica di inizializzazione, la registrazione di risorse o il rilevamento delle dipendenze dei plugin.

### Tipi di eventi comuni

| Nome evento                  | Momento di attivazione                  | Usi tipici                                        |
| :--------------------------- | :-------------------------------------- | :------------------------------------------------ |
| `beforeLoad` / `afterLoad`   | Prima / dopo il caricamento dell'applicazione | Registrare risorse, inizializzare la configurazione |
| `beforeStart` / `afterStart` | Prima / dopo l'avvio del servizio       | Avviare attività, registrare l'avvio              |
| `beforeInstall` / `afterInstall` | Prima / dopo l'installazione dell'applicazione | Inizializzare dati, importare modelli             |
| `beforeStop` / `afterStop`   | Prima / dopo l'arresto del servizio     | Pulire risorse, salvare lo stato                  |
| `beforeDestroy` / `afterDestroy` | Prima / dopo la distruzione dell'applicazione | Eliminare cache, disconnettere connessioni        |
| `beforeLoadPlugin` / `afterLoadPlugin` | Prima / dopo il caricamento del plugin  | Modificare la configurazione del plugin o estendere le funzionalità |
| `beforeEnablePlugin` / `afterEnablePlugin` | Prima / dopo l'attivazione del plugin   | Controllare le dipendenze, inizializzare la logica del plugin |
| `beforeDisablePlugin` / `afterDisablePlugin` | Prima / dopo la disattivazione del plugin | Pulire le risorse del plugin                      |
| `afterUpgrade`               | Dopo il completamento dell'aggiornamento dell'applicazione | Eseguire migrazioni di dati o correzioni di compatibilità |

Esempio: Ascoltare l'evento di avvio dell'applicazione

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 Il servizio NocoBase è stato avviato!');
});
```

Esempio: Ascoltare l'evento di caricamento del plugin

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Il plugin ${plugin.name} è stato caricato`);
});
```

## Ascoltare gli eventi del database `db.on()`

Gli eventi del database possono catturare varie modifiche ai dati a livello del modello, rendendoli adatti per operazioni di auditing, sincronizzazione o auto-completamento.

### Tipi di eventi comuni

| Nome evento                                               | Momento di attivazione                                |
| :-------------------------------------------------------- | :---------------------------------------------------- |
| `beforeSync` / `afterSync`                                | Prima / dopo la sincronizzazione della struttura del database |
| `beforeValidate` / `afterValidate`                        | Prima / dopo la validazione dei dati                  |
| `beforeCreate` / `afterCreate`                            | Prima / dopo la creazione di record                   |
| `beforeUpdate` / `afterUpdate`                            | Prima / dopo l'aggiornamento di record                |
| `beforeSave` / `afterSave`                                | Prima / dopo il salvataggio (include creazione e aggiornamento) |
| `beforeDestroy` / `afterDestroy`                          | Prima / dopo l'eliminazione di record                 |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Dopo operazioni che includono dati associati          |
| `beforeDefineCollection` / `afterDefineCollection`        | Prima / dopo la definizione di una collezione         |
| `beforeRemoveCollection` / `afterRemoveCollection`        | Prima / dopo la rimozione di una collezione           |

Esempio: Ascoltare l'evento dopo la creazione dei dati

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('I dati sono stati creati!');
});
```

Esempio: Ascoltare l'evento prima dell'aggiornamento dei dati

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('I dati stanno per essere aggiornati!');
});
```