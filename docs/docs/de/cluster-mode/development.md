:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Plugin-Entwicklung

## Hintergrund und Problemstellung

In einer Einzelknoten-Umgebung können Plugins ihre Anforderungen normalerweise über In-Process-Zustände, Ereignisse oder Aufgaben erfüllen. Im Cluster-Modus kann dasselbe Plugin jedoch gleichzeitig auf mehreren Instanzen laufen, was zu folgenden typischen Problemen führt:

- **Zustandskonsistenz**: Wenn Konfigurations- oder Laufzeitdaten nur im Arbeitsspeicher gespeichert werden, ist eine Synchronisierung zwischen den Instanzen schwierig. Dies kann zu "Dirty Reads" oder doppelten Ausführungen führen.
- **Aufgabenplanung**: Ohne einen klaren Warteschlangen- und Bestätigungsmechanismus können langwierige Aufgaben von mehreren Instanzen gleichzeitig ausgeführt werden.
- **Race Conditions**: Vorgänge, die Schemaänderungen oder die Zuweisung von Ressourcen betreffen, müssen serialisiert werden, um Konflikte durch gleichzeitige Schreibzugriffe zu vermeiden.

Der NocoBase-Kern stellt auf der Anwendungsebene verschiedene Middleware-Schnittstellen bereit, die Plugins dabei unterstützen, einheitliche Funktionen in einer Cluster-Umgebung wiederzuverwenden. In den folgenden Abschnitten erfahren Sie mehr über die Verwendung und Best Practices für Caching, synchrone Nachrichten, Nachrichtenwarteschlangen und verteilte Sperren, inklusive Referenzen zum Quellcode.

## Lösungen

### Cache-Komponente

Für Daten, die im Arbeitsspeicher gespeichert werden müssen, empfehlen wir die Verwendung der systeminternen Cache-Komponente zur Verwaltung.

- Sie erhalten die Standard-Cache-Instanz über `app.cache`.
- `Cache` bietet grundlegende Operationen wie `set/get/del/reset` und unterstützt außerdem `wrap` und `wrapWithCondition` zur Kapselung der Cache-Logik sowie Batch-Methoden wie `mset/mget/mdel`.
- Bei der Bereitstellung in einem Cluster empfiehlt es sich, gemeinsam genutzte Daten in einem persistenten Speicher (z. B. Redis) abzulegen und eine angemessene `ttl` (Time-to-Live) festzulegen, um den Verlust des Caches bei einem Neustart der Instanz zu verhindern.

Beispiel: [Cache-Initialisierung und -Verwendung im `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Cache in einem Plugin erstellen und verwenden"
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

### Synchroner Nachrichten-Manager (SyncMessageManager)

Wenn der In-Memory-Zustand nicht mit einem verteilten Cache verwaltet werden kann (z. B. weil er nicht serialisierbar ist), muss eine Zustandsänderung, die durch Benutzeraktionen ausgelöst wird, über ein synchrones Signal an andere Instanzen gesendet werden, um die Zustandskonsistenz zu gewährleisten.

- Die Plugin-Basisklasse hat `sendSyncMessage` implementiert, welches intern `app.syncMessageManager.publish` aufruft und automatisch ein anwendungsweites Präfix zum Kanal hinzufügt, um Konflikte zu vermeiden.
- `publish` kann eine `transaction` angeben. Die Nachricht wird dann nach dem Commit der Datenbanktransaktion gesendet, wodurch die Synchronisierung von Zustand und Nachricht gewährleistet wird.
- Verwenden Sie `handleSyncMessage`, um Nachrichten von anderen Instanzen zu verarbeiten. Das Abonnieren während der `beforeLoad`-Phase eignet sich hervorragend für Szenarien wie Konfigurationsänderungen und Schema-Synchronisierung.

Beispiel: [`plugin-data-source-main` verwendet synchrone Nachrichten, um die Schema-Konsistenz über mehrere Knoten hinweg zu gewährleisten](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Schema-Updates innerhalb eines Plugins synchronisieren"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Automatically calls app.syncMessageManager.publish
  }
}
```

### Nachrichten-Broadcast-Manager (PubSubManager)

Das Nachrichten-Broadcasting ist die zugrunde liegende Komponente synchroner Signale und kann auch direkt verwendet werden. Wenn Sie Nachrichten zwischen Instanzen senden müssen, können Sie diese Komponente nutzen.

- `app.pubSubManager.subscribe(channel, handler, { debounce })` kann verwendet werden, um einen Kanal über Instanzen hinweg zu abonnieren; die Option `debounce` dient dazu, häufige Rückrufe durch wiederholte Broadcasts zu verhindern.
- `publish` unterstützt `skipSelf` (Standard ist `true`) und `onlySelf`, um zu steuern, ob die Nachricht an die aktuelle Instanz zurückgesendet wird.
- Ein Adapter (wie Redis, RabbitMQ usw.) muss vor dem Start der Anwendung konfiguriert werden; andernfalls wird standardmäßig keine Verbindung zu einem externen Messaging-System hergestellt.

Beispiel: [`plugin-async-task-manager` verwendet PubSub, um Ereignisse zur Aufgabenabbruch zu senden](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Signal zum Aufgabenabbruch senden"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Ereigniswarteschlangen-Komponente (EventQueue)

Die Nachrichtenwarteschlange wird zur Planung asynchroner Aufgaben verwendet und eignet sich für langwierige oder wiederholbare Operationen.

- Deklarieren Sie einen Consumer mit `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` gibt ein `Promise` zurück, und Sie können `AbortSignal.timeout` verwenden, um Timeouts zu steuern.
- `publish` fügt automatisch das Präfix des Anwendungsnamens hinzu und unterstützt Optionen wie `timeout` und `maxRetries`. Standardmäßig wird ein In-Memory-Warteschlangenadapter verwendet, der bei Bedarf auf erweiterte Adapter wie RabbitMQ umgestellt werden kann.
- Stellen Sie in einem Cluster sicher, dass alle Knoten denselben Adapter verwenden, um eine Aufgabenfragmentierung zwischen den Knoten zu vermeiden.

Beispiel: [`plugin-async-task-manager` verwendet EventQueue zur Aufgabenplanung](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Asynchrone Aufgaben in einer Warteschlange verteilen"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Manager für verteilte Sperren (LockManager)

Wenn Sie Race Conditions vermeiden müssen, können Sie eine verteilte Sperre verwenden, um den Zugriff auf eine Ressource zu serialisieren.

- Standardmäßig wird ein prozessbasierter `local`-Adapter bereitgestellt. Sie können verteilte Implementierungen wie Redis registrieren. Verwenden Sie `app.lockManager.runExclusive(key, fn, ttl)` oder `acquire`/`tryAcquire`, um die Parallelität zu steuern.
- `ttl` (Time-to-Live) dient als Schutzmechanismus, um die Sperre freizugeben und zu verhindern, dass sie in Ausnahmefällen dauerhaft gehalten wird.
- Häufige Anwendungsfälle sind: Schemaänderungen, Vermeidung doppelter Aufgaben, Ratenbegrenzung (Rate Limiting) usw.

Beispiel: [`plugin-data-source-main` verwendet eine verteilte Sperre, um den Feldlöschvorgang zu schützen](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Feldlöschvorgang serialisieren"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Entwicklungsempfehlungen

- **Konsistenz des In-Memory-Zustands**: Versuchen Sie, während der Entwicklung die Verwendung von In-Memory-Zuständen zu vermeiden. Nutzen Sie stattdessen Caching oder synchrone Nachrichten, um die Zustandskonsistenz zu gewährleisten.
- **Wiederverwendung integrierter Schnittstellen priorisieren**: Verwenden Sie einheitliche Funktionen wie `app.cache` und `app.syncMessageManager`, um die Neuimplementierung von Cross-Node-Kommunikationslogik in Plugins zu vermeiden.
- **Transaktionsgrenzen beachten**: Operationen mit Transaktionen sollten `transaction.afterCommit` verwenden (dies ist in `syncMessageManager.publish` integriert), um die Konsistenz von Daten und Nachrichten zu gewährleisten.
- **Backoff-Strategie entwickeln**: Legen Sie für Warteschlangen- und Broadcast-Aufgaben angemessene Werte für `timeout`, `maxRetries` und `debounce` fest, um neue Traffic-Spitzen in Ausnahmesituationen zu vermeiden.
- **Begleitendes Monitoring und Logging nutzen**: Nutzen Sie Anwendungslogs, um Kanalnamen, Nachrichten-Payloads, Sperrschlüssel und andere Informationen zu erfassen. Dies erleichtert die Fehlerbehebung bei sporadischen Problemen in einem Cluster.

Mit diesen Funktionen können Plugins Zustände sicher teilen, Konfigurationen synchronisieren und Aufgaben über verschiedene Instanzen hinweg planen, wodurch die Anforderungen an Stabilität und Konsistenz in Cluster-Bereitstellungsszenarien erfüllt werden.