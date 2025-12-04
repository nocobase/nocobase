:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Pluginontwikkeling

## Achtergrond

In een omgeving met één node kunnen plugins doorgaans voldoen aan vereisten via in-process status, gebeurtenissen of taken. In een clustermodus kan dezelfde plugin echter gelijktijdig op meerdere instanties draaien, wat leidt tot de volgende typische problemen:

-   **Statusconsistentie**: Als configuratie- of runtimegegevens alleen in het geheugen worden opgeslagen, is synchronisatie tussen instanties moeilijk, wat kan leiden tot 'dirty reads' of dubbele uitvoeringen.
-   **Taakplanning**: Zonder een duidelijk wachtrij- en bevestigingsmechanisme kunnen langlopende taken gelijktijdig door meerdere instanties worden uitgevoerd.
-   **Racecondities**: Bij bewerkingen die schemawijzigingen of resource-allocatie omvatten, moeten bewerkingen worden geserialiseerd om conflicten door gelijktijdige schrijfacties te voorkomen.

De NocoBase-kern biedt op applicatieniveau verschillende middleware-interfaces om plugins te helpen uniforme functionaliteiten te hergebruiken in een clusteromgeving. Hieronder bespreken we, met verwijzingen naar de broncode, het gebruik en de best practices van caching, synchrone berichten, berichtenwachtrijen en gedistribueerde vergrendelingen.

## Oplossingen

### Cache-component (Cache)

Voor gegevens die in het geheugen moeten worden opgeslagen, raden we u aan de ingebouwde cache-component van het systeem te gebruiken voor het beheer.

-   Haal de standaard cache-instantie op via `app.cache`.
-   `Cache` biedt basisbewerkingen zoals `set/get/del/reset`, en ondersteunt ook `wrap` en `wrapWithCondition` om cachinglogica te encapsuleren, evenals batchmethoden zoals `mset/mget/mdel`.
-   Bij een clusterimplementatie wordt aanbevolen om gedeelde gegevens in een persistente opslag (zoals Redis) te plaatsen en een redelijke `ttl` in te stellen om cacheverlies bij het herstarten van instanties te voorkomen.

Voorbeeld: [Cache-initialisatie en -gebruik in `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Een cache aanmaken en gebruiken in een plugin"
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

### Manager voor synchrone berichten (SyncMessageManager)

Als de in-memory status niet kan worden beheerd met een gedistribueerde cache (bijvoorbeeld omdat deze niet kan worden geserialiseerd), dan moet, wanneer de status verandert door gebruikersacties, deze wijziging via een synchroon signaal aan andere instanties worden doorgegeven om de statusconsistentie te behouden.

-   De basisklasse van de plugin heeft `sendSyncMessage` geïmplementeerd, die intern `app.syncMessageManager.publish` aanroept en automatisch een applicatieniveau-prefix aan het kanaal toevoegt om kanaalconflicten te voorkomen.
-   `publish` kan een `transaction` specificeren; het bericht wordt dan pas verzonden nadat de databasetransactie is voltooid, wat de synchronisatie van status en bericht garandeert.
-   Gebruik `handleSyncMessage` om berichten van andere instanties te verwerken. Abonneren tijdens de `beforeLoad`-fase is zeer geschikt voor scenario's zoals configuratiewijzigingen en schema-synchronisatie.

Voorbeeld: [`plugin-data-source-main` gebruikt synchrone berichten om schema-consistentie over meerdere nodes te behouden](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Schema-updates synchroniseren binnen een plugin"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Roept automatisch app.syncMessageManager.publish aan
  }
}
```

### Pub/Sub-manager (PubSubManager)

Berichtenuitzending is de onderliggende component van synchrone signalen en kan ook direct worden gebruikt. Wanneer u berichten tussen instanties moet uitzenden, kunt u dit via deze component realiseren.

-   Met `app.pubSubManager.subscribe(channel, handler, { debounce })` kunt u zich abonneren op een kanaal tussen instanties; de `debounce`-optie wordt gebruikt om 'debouncing' toe te passen, wat frequente callbacks door herhaalde uitzendingen voorkomt.
-   `publish` ondersteunt `skipSelf` (standaard `true`) en `onlySelf` om te bepalen of het bericht teruggestuurd wordt naar de huidige instantie.
-   Voordat de applicatie start, moet een adapter (zoals Redis, RabbitMQ, enz.) worden geconfigureerd; anders maakt deze standaard geen verbinding met een extern berichtensysteem.

Voorbeeld: [`plugin-async-task-manager` gebruikt PubSub om gebeurtenissen voor taakannulering uit te zenden](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Signaal voor taakannulering uitzenden"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Taak ${id} geannuleerd op andere node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Berichtenwachtrij-component (EventQueue)

De berichtenwachtrij wordt gebruikt voor het plannen van asynchrone taken en is geschikt voor het verwerken van langlopende of opnieuw uit te voeren bewerkingen.

-   Declareer een consument met `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` retourneert een `Promise`, en u kunt `AbortSignal.timeout` gebruiken om timeouts te beheren.
-   `publish` voegt automatisch de applicatienaam-prefix toe en ondersteunt opties zoals `timeout` en `maxRetries`. Standaard gebruikt het een in-memory wachtrijadapter, maar u kunt naar behoefte overschakelen naar uitgebreide adapters zoals RabbitMQ.
-   Zorg er in een cluster voor dat alle nodes dezelfde adapter gebruiken om fragmentatie van taken tussen nodes te voorkomen.

Voorbeeld: [`plugin-async-task-manager` gebruikt EventQueue om taken te plannen](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Asynchrone taken distribueren in een wachtrij"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Manager voor gedistribueerde vergrendeling (LockManager)

Wanneer u racecondities wilt voorkomen, kunt u een gedistribueerde vergrendeling gebruiken om de toegang tot een resource te serialiseren.

-   Standaard wordt een procesgebaseerde `local`-adapter geleverd. U kunt gedistribueerde implementaties zoals Redis registreren. Gebruik `app.lockManager.runExclusive(key, fn, ttl)` of `acquire`/`tryAcquire` om gelijktijdigheid te beheren.
-   `ttl` wordt gebruikt als vangnet om de vergrendeling vrij te geven, zodat deze in uitzonderlijke gevallen niet voor onbepaalde tijd wordt vastgehouden.
-   Veelvoorkomende scenario's zijn onder meer: schemawijzigingen, het voorkomen van dubbele taken, en 'rate limiting'.

Voorbeeld: [`plugin-data-source-main` gebruikt een gedistribueerde vergrendeling om het verwijderingsproces van velden te beschermen](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Veldverwijderingsbewerking serialiseren"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Ontwikkelingsaanbevelingen

-   **Consistentie van in-memory status**: Probeer tijdens de ontwikkeling het gebruik van in-memory status te vermijden. Gebruik in plaats daarvan caching of synchrone berichten om de statusconsistentie te behouden.
-   **Geef prioriteit aan het hergebruiken van ingebouwde interfaces**: Gebruik uniforme functionaliteiten zoals `app.cache` en `app.syncMessageManager` om te voorkomen dat u cross-node communicatielogica opnieuw implementeert in plugins.
-   **Let op transactiegrenzen**: Bewerkingen met transacties moeten `transaction.afterCommit` gebruiken (`syncMessageManager.publish` heeft dit ingebouwd) om consistentie van gegevens en berichten te garanderen.
-   **Ontwikkel een 'backoff'-strategie**: Stel voor wachtrij- en uitzendtaken redelijke waarden in voor `timeout`, `maxRetries` en `debounce` om nieuwe verkeerspieken in uitzonderlijke situaties te voorkomen.
-   **Gebruik aanvullende monitoring en logging**: Maak goed gebruik van applicatielogs om informatie zoals kanaalnamen, berichtpayloads en vergrendelingssleutels vast te leggen, om zo het oplossen van intermitterende problemen in een cluster te vergemakkelijken.

Met deze mogelijkheden kunnen plugins veilig status delen, configuraties synchroniseren en taken plannen tussen verschillende instanties, wat voldoet aan de stabiliteits- en consistentievereisten van clusterimplementatiescenario's.