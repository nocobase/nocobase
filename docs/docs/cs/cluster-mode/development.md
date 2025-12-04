:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vývoj pluginů

## Kontext

V prostředí s jedním uzlem mohou pluginy obvykle plnit své požadavky pomocí stavu v rámci procesu, událostí nebo úloh. Avšak v klastrovém režimu může stejný plugin běžet souběžně na více instancích, což s sebou nese následující typické problémy:

-   **Konzistence stavu**: Pokud jsou konfigurační nebo běhová data uložena pouze v paměti, je obtížné je synchronizovat mezi instancemi, což může vést k nekonzistentním čtením (dirty reads) nebo duplicitnímu provádění.
-   **Plánování úloh**: Dlouhotrvající úlohy bez jasného mechanismu fronty a potvrzení mohou být souběžně prováděny více instancemi.
-   **Podmínky souběhu (Race conditions)**: Operace zahrnující změny schématu nebo alokaci zdrojů je třeba serializovat, aby se předešlo konfliktům způsobeným souběžnými zápisy.

Jádro NocoBase poskytuje na aplikační vrstvě různé middleware rozhraní, která pomáhají pluginům využívat jednotné schopnosti v klastrovém prostředí. Následující sekce představí použití a osvědčené postupy pro cachování, synchronní zprávy, fronty zpráv a distribuované zámky, včetně odkazů na zdrojový kód.

## Řešení

### Komponenta pro cachování (Cache)

Pro data, která je třeba ukládat do paměti, doporučujeme použít vestavěnou systémovou komponentu pro cachování.

-   Výchozí instanci cache získáte přes `app.cache`.
-   `Cache` poskytuje základní operace jako `set/get/del/reset` a také podporuje `wrap` a `wrapWithCondition` pro zapouzdření logiky cachování, stejně jako dávkové metody jako `mset/mget/mdel`.
-   Při nasazení v klastru se doporučuje umístit sdílená data do perzistentního úložiště (např. Redis) a nastavit rozumnou hodnotu `ttl`, aby se zabránilo ztrátě cache při restartu instance.

Příklad: [Inicializace a použití cache v `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Vytvoření a použití cache v pluginu"
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

### Správce synchronních zpráv (SyncMessageManager)

Pokud stav v paměti nelze spravovat pomocí distribuované cache (např. nelze jej serializovat), pak v případě, že se stav změní v důsledku uživatelských akcí, je třeba tuto změnu oznámit ostatním instancím prostřednictvím synchronního signálu, aby byla zachována konzistence stavu.

-   Základní třída pluginu implementuje `sendSyncMessage`, která interně volá `app.syncMessageManager.publish` a automaticky přidává prefix na úrovni aplikace k kanálu, aby se předešlo konfliktům.
-   `publish` může specifikovat `transaction`, a zpráva bude odeslána po potvrzení databázové transakce, což zajišťuje synchronizaci stavu a zpráv.
-   Použijte `handleSyncMessage` pro zpracování zpráv z jiných instancí. Přihlášení k odběru během fáze `beforeLoad` je velmi vhodné pro scénáře, jako jsou změny konfigurace a synchronizace schématu.

Příklad: [`plugin-data-source-main` používá synchronní zprávy k udržení konzistence schématu napříč více uzly](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Synchronizace aktualizací schématu v rámci pluginu"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Automaticky volá app.syncMessageManager.publish
  }
}
```

### Správce publikování/odběru (PubSubManager)

Vysílání zpráv je základní komponentou synchronních signálů a lze jej také přímo použít. Pokud potřebujete vysílat zprávy mezi instancemi, můžete tuto komponentu využít.

-   `app.pubSubManager.subscribe(channel, handler, { debounce })` lze použít k přihlášení k odběru kanálu napříč instancemi; volba `debounce` slouží k potlačení opakovaných volání způsobených častým vysíláním.
-   `publish` podporuje `skipSelf` (výchozí hodnota je true) a `onlySelf` pro řízení, zda se zpráva odešle zpět na aktuální instanci.
-   Adaptér (např. Redis, RabbitMQ atd.) musí být nakonfigurován před spuštěním aplikace; jinak se ve výchozím nastavení nepřipojí k externímu systému zpráv.

Příklad: [`plugin-async-task-manager` používá PubSub k vysílání událostí zrušení úloh](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Vysílání signálu zrušení úlohy"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Komponenta fronty událostí (EventQueue)

Fronta zpráv se používá k plánování asynchronních úloh, je vhodná pro zpracování dlouhotrvajících nebo opakovatelných operací.

-   Spotřebitele deklarujete pomocí `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` vrací `Promise` a pro řízení časových limitů můžete použít `AbortSignal.timeout`.
-   `publish` automaticky přidává prefix názvu aplikace a podporuje volby jako `timeout` a `maxRetries`. Ve výchozím nastavení používá adaptér fronty v paměti, ale podle potřeby jej lze přepnout na rozšířené adaptéry, jako je RabbitMQ.
-   V klastru zajistěte, aby všechny uzly používaly stejný adaptér, aby se předešlo fragmentaci úloh mezi uzly.

Příklad: [`plugin-async-task-manager` používá EventQueue k plánování úloh](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Rozdělování asynchronních úloh ve frontě"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Správce distribuovaných zámků (LockManager)

Pokud potřebujete předejít podmínkám souběhu, můžete použít distribuovaný zámek k serializaci přístupu ke zdroji.

-   Ve výchozím nastavení poskytuje adaptér `local` založený na procesu. Můžete registrovat distribuované implementace, jako je Redis. Pro řízení souběhu použijte `app.lockManager.runExclusive(key, fn, ttl)` nebo `acquire`/`tryAcquire`.
-   `ttl` slouží jako pojistka pro uvolnění zámku, čímž zabraňuje jeho trvalému držení v případě výjimečných situací.
-   Mezi běžné scénáře patří: změny schématu, prevence duplicitních úloh, omezování rychlosti (rate limiting) atd.

Příklad: [`plugin-data-source-main` používá distribuovaný zámek k ochraně procesu mazání polí](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Serializace operace mazání pole"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Doporučení pro vývoj

-   **Konzistence stavu v paměti**: Snažte se vyhnout používání stavu v paměti během vývoje. Místo toho použijte cachování nebo synchronní zprávy k udržení konzistence stavu.
-   **Upřednostněte opětovné použití vestavěných rozhraní**: Používejte jednotné funkce jako `app.cache` a `app.syncMessageManager`, abyste se vyhnuli opakované implementaci logiky komunikace mezi uzly v pluginech.
-   **Věnujte pozornost hranicím transakcí**: Operace s transakcemi by měly používat `transaction.afterCommit` (`syncMessageManager.publish` to má vestavěné), aby byla zajištěna konzistence dat a zpráv.
-   **Vytvořte strategii opakování s prodlevou (backoff)**: Pro úlohy ve frontě a vysílací úlohy nastavte rozumné hodnoty `timeout`, `maxRetries` a `debounce`, abyste předešli novým špičkám provozu ve výjimečných situacích.
-   **Využijte doplňkové monitorování a logování**: Využijte aplikační logy k zaznamenávání názvů kanálů, dat zpráv, klíčů zámků atd., což usnadní řešení občasných problémů v klastru.

Díky těmto schopnostem mohou pluginy bezpečně sdílet stav, synchronizovat konfigurace a plánovat úlohy napříč různými instancemi, čímž splňují požadavky na stabilitu a konzistenci v scénářích klastrového nasazení.