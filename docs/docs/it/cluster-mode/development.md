:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Sviluppo di Plugin

## Contesto

In un ambiente a nodo singolo, i plugin possono solitamente soddisfare i requisiti attraverso lo stato in-process, gli eventi o le attività. Tuttavia, in modalità cluster, lo stesso plugin può essere eseguito contemporaneamente su più istanze, affrontando i seguenti problemi tipici:

-   **Consistenza dello stato**: Se i dati di configurazione o di runtime sono memorizzati solo in memoria, è difficile sincronizzarli tra le istanze, il che può portare a letture sporche o esecuzioni duplicate.
-   **Pianificazione delle attività**: Senza un chiaro meccanismo di accodamento e conferma, le attività a lunga esecuzione possono essere eseguite contemporaneamente da più istanze.
-   **Condizioni di competizione**: Le operazioni che coinvolgono modifiche allo schema o allocazione di risorse devono essere serializzate per evitare conflitti causati da scritture concorrenti.

Il core di NocoBase fornisce diverse interfacce middleware a livello di applicazione per aiutare i plugin a riutilizzare capacità unificate in un ambiente cluster. Le sezioni seguenti presenteranno l'utilizzo e le migliori pratiche per la cache, la messaggistica sincrona, le code di messaggi e i lock distribuiti, con riferimenti al codice sorgente.

## Soluzioni

### Componente Cache

Per i dati che devono essere memorizzati in memoria, si consiglia di utilizzare il componente cache integrato nel sistema per la loro gestione.

-   Ottenga l'istanza cache predefinita tramite `app.cache`.
-   `Cache` fornisce operazioni di base come `set/get/del/reset`, e supporta anche `wrap` e `wrapWithCondition` per incapsulare la logica di caching, oltre a metodi batch come `mset/mget/mdel`.
-   Quando si effettua il deployment in un cluster, si consiglia di inserire i dati condivisi in una memoria persistente (come Redis) e di impostare un `ttl` ragionevole per prevenire la perdita della cache in caso di riavvio dell'istanza.

Esempio: [Inizializzazione e utilizzo della cache in `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Creare e utilizzare una cache in un plugin"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### Gestore di Messaggi Sincroni

Se lo stato in memoria non può essere gestito con una cache distribuita (ad esempio, non può essere serializzato), allora quando lo stato cambia a causa delle azioni dell'utente, la modifica deve essere trasmessa ad altre istanze tramite un segnale di sincronizzazione per mantenere la consistenza dello stato.

-   La classe base del plugin ha implementato `sendSyncMessage`, che internamente chiama `app.syncMessageManager.publish` e aggiunge automaticamente un prefisso a livello di applicazione al canale per evitare conflitti.
-   `publish` può specificare una `transaction`, e il messaggio verrà inviato dopo il commit della transazione del database, garantendo la sincronizzazione dello stato e del messaggio.
-   Utilizzi `handleSyncMessage` per elaborare i messaggi provenienti da altre istanze. L'iscrizione durante la fase `beforeLoad` è molto adatta per scenari come modifiche alla configurazione e sincronizzazione dello schema.

Esempio: [`plugin-data-source-main` utilizza messaggi sincroni per mantenere la consistenza dello schema tra più nodi](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Sincronizzare gli aggiornamenti dello schema all'interno di un plugin"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Chiama automaticamente app.syncMessageManager.publish
  }
}
```

### Gestore Pub/Sub

La trasmissione di messaggi è il componente sottostante dei segnali sincroni e può essere utilizzata anche direttamente. Quando ha bisogno di trasmettere messaggi tra istanze, può utilizzare questo componente.

-   `app.pubSubManager.subscribe(channel, handler, { debounce })` può essere utilizzato per iscriversi a un canale tra le istanze; l'opzione `debounce` viene utilizzata per prevenire callback frequenti causate da trasmissioni ripetute.
-   `publish` supporta `skipSelf` (il valore predefinito è true) e `onlySelf` per controllare se il messaggio viene inviato all'istanza corrente.
-   Un adattatore (come Redis, RabbitMQ, ecc.) deve essere configurato prima dell'avvio dell'applicazione; altrimenti, per impostazione predefinita, non si connetterà a un sistema di messaggistica esterno.

Esempio: [`plugin-async-task-manager` utilizza PubSub per trasmettere eventi di annullamento delle attività](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Trasmettere il segnale di annullamento dell'attività"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Componente Coda di Eventi

La coda di messaggi viene utilizzata per pianificare attività asincrone, adatta per gestire operazioni a lunga esecuzione o che possono essere ritentate.

-   Dichiarare un consumer con `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` restituisce una `Promise`, e può utilizzare `AbortSignal.timeout` per controllare i timeout.
-   `publish` aggiunge automaticamente il prefisso del nome dell'applicazione e supporta opzioni come `timeout` e `maxRetries`. Per impostazione predefinita, utilizza un adattatore di coda in memoria, ma può essere commutato ad adattatori estesi come RabbitMQ, se necessario.
-   In un cluster, si assicuri che tutti i nodi utilizzino lo stesso adattatore per evitare la frammentazione delle attività tra i nodi.

Esempio: [`plugin-async-task-manager` utilizza EventQueue per pianificare le attività](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Distribuire attività asincrone in una coda"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Gestore di Lock Distribuiti

Quando ha bisogno di evitare condizioni di competizione, può utilizzare un lock distribuito per serializzare l'accesso a una risorsa.

-   Per impostazione predefinita, fornisce un adattatore `local` basato su processo. Può registrare implementazioni distribuite come Redis. Utilizzi `app.lockManager.runExclusive(key, fn, ttl)` o `acquire`/`tryAcquire` per controllare la concorrenza.
-   `ttl` viene utilizzato come salvaguardia per rilasciare il lock, impedendo che venga mantenuto indefinitamente in casi eccezionali.
-   Gli scenari comuni includono: modifiche allo schema, prevenzione di attività duplicate, limitazione della frequenza (rate limiting), ecc.

Esempio: [`plugin-data-source-main` utilizza un lock distribuito per proteggere il processo di eliminazione dei campi](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Serializzare l'operazione di eliminazione dei campi"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Consigli per lo Sviluppo

-   **Consistenza dello stato in memoria**: Cerchi di evitare di utilizzare lo stato in memoria durante lo sviluppo. Utilizzi invece la cache o i messaggi sincroni per mantenere la consistenza dello stato.
-   **Dare priorità al riutilizzo delle interfacce integrate**: Utilizzi capacità unificate come `app.cache` e `app.syncMessageManager` per evitare di re-implementare la logica di comunicazione tra nodi nei plugin.
-   **Prestare attenzione ai confini delle transazioni**: Le operazioni con transazioni dovrebbero utilizzare `transaction.afterCommit` (`syncMessageManager.publish` lo ha integrato) per garantire la consistenza dei dati e dei messaggi.
-   **Sviluppare una strategia di backoff**: Per le attività di coda e di trasmissione, imposti valori ragionevoli per `timeout`, `maxRetries` e `debounce` per prevenire nuovi picchi di traffico in situazioni eccezionali.
-   **Utilizzare monitoraggio e logging complementari**: Faccia buon uso dei log dell'applicazione per registrare nomi di canali, payload dei messaggi, chiavi di lock, ecc., per facilitare la risoluzione dei problemi intermittenti in un cluster.

Con queste capacità, i plugin possono condividere in modo sicuro lo stato, sincronizzare le configurazioni e pianificare le attività tra diverse istanze, soddisfacendo i requisiti di stabilità e consistenza degli scenari di deployment in cluster.