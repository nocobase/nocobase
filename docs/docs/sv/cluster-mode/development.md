:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Pluginutveckling

## Bakgrund

I en enskild nodmiljö kan **plugin** vanligtvis uppfylla krav genom att använda tillstånd, händelser eller uppgifter inom processen. I ett klusterläge kan dock samma **plugin** köras på flera instanser samtidigt, vilket leder till följande typiska problem:

- **Tillståndskonsistens**: Om konfigurations- eller körtidsdata endast lagras i minnet är det svårt att synkronisera mellan instanser, vilket kan leda till inaktuella läsningar eller dubbla exekveringar.
- **Uppgiftsschemaläggning**: Utan en tydlig kö- och bekräftelsemekanism kan långvariga uppgifter köras samtidigt av flera instanser.
- **Race conditions** (konkurrensförhållanden): Åtgärder som involverar schemamodifieringar eller resursallokering behöver serialiseras för att undvika konflikter orsakade av samtidiga skrivningar.

NocoBase-kärnan tillhandahåller olika middleware-gränssnitt på applikationsnivå för att hjälpa **plugin** att återanvända enhetliga funktioner i en klustermiljö. Följande avsnitt kommer att introducera användningen och bästa praxis för cachning, synkrona meddelanden, meddelandeköer och distribuerade lås, med referenser till källkod.

## Lösningar

### Cache-komponent

För data som behöver lagras i minnet rekommenderas det att använda systemets inbyggda cache-komponent för hantering.

- Hämta standardcache-instansen via `app.cache`.
- `Cache` tillhandahåller grundläggande operationer som `set/get/del/reset` och stöder även `wrap` och `wrapWithCondition` för att kapsla in cache-logik, samt batch-metoder som `mset/mget/mdel`.
- Vid klusterdistribution rekommenderas det att placera delad data i en beständig lagring (som Redis) och ställa in en rimlig `ttl` för att förhindra cacheförlust vid omstart av instansen.

Exempel: [Cache-initialisering och användning i `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Skapa och använd en cache i ett plugin"
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

### Synkron meddelandehanterare (SyncMessageManager)

Om tillståndet i minnet inte kan hanteras med en distribuerad cache (t.ex. om det inte kan serialiseras), behöver ändringen, när tillståndet ändras på grund av användaråtgärder, sändas till andra instanser via en synkron signal för att upprätthålla tillståndskonsistens.

- **Plugin**-basklassen har implementerat `sendSyncMessage`, som internt anropar `app.syncMessageManager.publish` och automatiskt lägger till ett prefix på applikationsnivå till kanalen för att undvika konflikter.
- `publish` kan specificera en `transaction`, och meddelandet skickas efter att databastransaktionen har bekräftats, vilket säkerställer synkronisering av tillstånd och meddelande.
- Använd `handleSyncMessage` för att bearbeta meddelanden från andra instanser. Att prenumerera under `beforeLoad`-fasen är mycket lämpligt för scenarier som konfigurationsändringar och schemasynkronisering.

Exempel: [`plugin-data-source-main` använder synkrona meddelanden för att upprätthålla schema-konsistens över flera noder](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Synkronisera schema-uppdateringar inom ett plugin"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Anropar automatiskt app.syncMessageManager.publish
  }
}
```

### Pub/Sub-hanterare (PubSubManager)

Meddelandesändning är den underliggande komponenten för synkrona signaler och kan även användas direkt. När ni behöver sända meddelanden mellan instanser kan ni använda denna komponent.

- `app.pubSubManager.subscribe(channel, handler, { debounce })` kan användas för att prenumerera på en kanal över instanser; `debounce`-alternativet används för att förhindra frekventa återanrop orsakade av upprepade sändningar.
- `publish` stöder `skipSelf` (standard är true) och `onlySelf` för att kontrollera om meddelandet ska skickas tillbaka till den aktuella instansen.
- En adapter (som Redis, RabbitMQ, etc.) måste konfigureras innan applikationen startar; annars kommer den inte att ansluta till ett externt meddelandesystem som standard.

Exempel: [`plugin-async-task-manager` använder PubSub för att sända händelser för uppgiftsavbrott](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Sänd signal för uppgiftsavbrott"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Händelsekö-komponent (EventQueue)

Meddelandekön används för att schemalägga asynkrona uppgifter, lämplig för att hantera långvariga eller återförsöksbara operationer.

- Deklarera en konsument med `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` returnerar en `Promise`, och ni kan använda `AbortSignal.timeout` för att kontrollera tidsgränser.
- `publish` lägger automatiskt till applikationsnamnsprefixet och stöder alternativ som `timeout` och `maxRetries`. Den använder som standard en minnesintern köadapter men kan vid behov växlas till utökade adaptrar som RabbitMQ.
- I ett kluster, se till att alla noder använder samma adapter för att undvika att uppgifter fragmenteras mellan noderna.

Exempel: [`plugin-async-task-manager` använder EventQueue för att schemalägga uppgifter](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Distribuera asynkrona uppgifter i en kö"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Distribuerad låshanterare (LockManager)

När ni behöver undvika race conditions (konkurrensförhållanden) kan ni använda ett distribuerat lås för att serialisera åtkomst till en resurs.

- Som standard tillhandahåller den en processbaserad `local`-adapter. Ni kan registrera distribuerade implementeringar som Redis. Använd `app.lockManager.runExclusive(key, fn, ttl)` eller `acquire`/`tryAcquire` för att kontrollera samtidighet.
- `ttl` används som en säkerhetsåtgärd för att släppa låset, vilket förhindrar att det hålls på obestämd tid i undantagsfall.
- Vanliga scenarier inkluderar: schemaändringar, förhindrande av dubbla uppgifter, hastighetsbegränsning, etc.

Exempel: [`plugin-data-source-main` använder ett distribuerat lås för att skydda borttagningsprocessen för fält](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Serialisera borttagningsoperation för fält"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Utvecklingsrekommendationer

- **Minnesintern tillståndskonsistens**: Försök att undvika att använda minnesinterna tillstånd under utvecklingen. Använd istället cachning eller synkrona meddelanden för att upprätthålla tillståndskonsistens.
- **Prioritera återanvändning av inbyggda gränssnitt**: Använd enhetliga funktioner som `app.cache` och `app.syncMessageManager` för att undvika att återimplementera logik för kommunikation mellan noder i **plugin**.
- **Var uppmärksam på transaktionsgränser**: Operationer med transaktioner bör använda `transaction.afterCommit` (`syncMessageManager.publish` har detta inbyggt) för att säkerställa data- och meddelandekonsistens.
- **Utveckla en backoff-strategi**: För kö- och sändningsuppgifter, ställ in rimliga `timeout`, `maxRetries` och `debounce`-värden för att förhindra nya trafiktoppar i exceptionella situationer.
- **Använd kompletterande övervakning och loggning**: Använd applikationsloggar väl för att registrera kanalnamn, meddelandenyttolaster, låsnycklar etc., för att underlätta felsökning av intermittenta problem i ett kluster.

Med dessa funktioner kan **plugin** säkert dela tillstånd, synkronisera konfigurationer och schemalägga uppgifter över olika instanser, vilket uppfyller kraven på stabilitet och konsistens i klusterdistributionsscenarier.