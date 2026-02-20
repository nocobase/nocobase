:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozwój wtyczek

## Kontekst

W środowisku jednowęzłowym wtyczki zazwyczaj radzą sobie z wymaganiami, wykorzystując stan w procesie, zdarzenia lub zadania. Jednakże w trybie klastrowym ta sama wtyczka może działać jednocześnie na wielu instancjach, co wiąże się z następującymi typowymi problemami:

- **Spójność stanu**: Jeśli dane konfiguracyjne lub dane środowiska uruchomieniowego są przechowywane wyłącznie w pamięci, ich synchronizacja między instancjami jest trudna, co może prowadzić do nieaktualnych odczytów lub powielonych operacji.
- **Planowanie zadań**: Bez jasnego mechanizmu kolejkowania i potwierdzania, długotrwałe zadania mogą być wykonywane współbieżnie przez wiele instancji.
- **Warunki wyścigu**: Operacje związane ze zmianami schematu lub alokacją zasobów muszą być serializowane, aby uniknąć konfliktów wynikających ze współbieżnych zapisów.

Rdzeń NocoBase udostępnia na poziomie aplikacji różnorodne interfejsy oprogramowania pośredniczącego (middleware), które pomagają wtyczkom w wykorzystaniu ujednoliconych możliwości w środowisku klastrowym. W poniższych sekcjach przedstawimy zastosowanie i najlepsze praktyki dotyczące buforowania, wiadomości synchronicznych, kolejek wiadomości oraz blokad rozproszonych, wraz z odniesieniami do kodu źródłowego.

## Rozwiązania

### Komponent buforowania (Cache)

W przypadku danych, które muszą być przechowywane w pamięci, zaleca się użycie wbudowanego komponentu buforowania systemu do zarządzania nimi.

- Domyślną instancję pamięci podręcznej można uzyskać za pomocą `app.cache`.
- `Cache` udostępnia podstawowe operacje, takie jak `set/get/del/reset`, a także obsługuje metody `wrap` i `wrapWithCondition` do hermetyzacji logiki buforowania, oraz metody wsadowe, takie jak `mset/mget/mdel`.
- Podczas wdrażania w klastrze zaleca się umieszczanie współdzielonych danych w trwałym magazynie (np. Redis) i ustawienie rozsądnego `ttl`, aby zapobiec utracie danych z pamięci podręcznej po ponownym uruchomieniu instancji.

Przykład: [Inicjalizacja i użycie pamięci podręcznej w `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Tworzenie i używanie pamięci podręcznej we wtyczce"
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

### Menedżer wiadomości synchronicznych (SyncMessageManager)

Jeśli stan przechowywany w pamięci nie może być zarządzany za pomocą rozproszonej pamięci podręcznej (np. nie może być serializowany), wówczas, gdy stan zmienia się w wyniku działań użytkownika, zmiana musi zostać rozgłoszona do innych instancji za pośrednictwem sygnału synchronizacji, aby zachować spójność stanu.

- Klasa bazowa wtyczki zaimplementowała metodę `sendSyncMessage`, która wewnętrznie wywołuje `app.syncMessageManager.publish` i automatycznie dodaje prefiks na poziomie aplikacji do kanału, aby uniknąć konfliktów.
- Metoda `publish` może określać `transaction`, a wiadomość zostanie wysłana po zatwierdzeniu transakcji bazy danych, zapewniając synchronizację stanu i wiadomości.
- Proszę użyć `handleSyncMessage` do przetwarzania wiadomości z innych instancji. Subskrybowanie podczas fazy `beforeLoad` jest bardzo odpowiednie dla scenariuszy, takich jak zmiany konfiguracji i synchronizacja schematu.

Przykład: [`plugin-data-source-main` używa wiadomości synchronicznych do utrzymania spójności schematu w wielu węzłach](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Synchronizacja aktualizacji schematu w ramach wtyczki"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Automatycznie wywołuje app.syncMessageManager.publish
  }
}
```

### Menedżer publikacji/subskrypcji (PubSubManager)

Rozgłaszanie wiadomości jest podstawowym komponentem sygnałów synchronicznych i może być również używane bezpośrednio. Gdy zachodzi potrzeba rozgłaszania wiadomości między instancjami, można użyć tego komponentu.

- Metoda `app.pubSubManager.subscribe(channel, handler, { debounce })` może być używana do subskrybowania kanału między instancjami; opcja `debounce` służy do zapobiegania częstym wywołaniom zwrotnym spowodowanym powtarzającymi się rozgłoszeniami.
- Metoda `publish` obsługuje opcje `skipSelf` (domyślnie `true`) i `onlySelf`, aby kontrolować, czy wiadomość jest wysyłana z powrotem do bieżącej instancji.
- Adapter (np. Redis, RabbitMQ itp.) musi zostać skonfigurowany przed uruchomieniem aplikacji; w przeciwnym razie domyślnie nie połączy się z zewnętrznym systemem wiadomości.

Przykład: [`plugin-async-task-manager` używa PubSub do rozgłaszania zdarzeń anulowania zadań](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Rozgłaszanie sygnału anulowania zadania"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Komponent kolejki zdarzeń (EventQueue)

Kolejka wiadomości służy do planowania zadań asynchronicznych i jest odpowiednia do obsługi długotrwałych lub możliwych do ponowienia operacji.

- Proszę zadeklarować konsumenta za pomocą `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. Metoda `process` zwraca `Promise`, a do kontrolowania limitów czasu można użyć `AbortSignal.timeout`.
- Metoda `publish` automatycznie dodaje prefiks nazwy aplikacji i obsługuje opcje, takie jak `timeout` i `maxRetries`. Domyślnie używa adaptera kolejki w pamięci, ale w razie potrzeby można przełączyć się na rozszerzone adaptery, takie jak RabbitMQ.
- W klastrze należy upewnić się, że wszystkie węzły używają tego samego adaptera, aby uniknąć fragmentacji zadań między nimi.

Przykład: [`plugin-async-task-manager` używa EventQueue do planowania zadań](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Dystrybucja zadań asynchronicznych w kolejce"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Menedżer blokad rozproszonych (LockManager)

Gdy zachodzi potrzeba uniknięcia warunków wyścigu, można użyć blokady rozproszonej do serializacji dostępu do zasobu.

- Domyślnie udostępnia adapter `local` oparty na procesach. Mogą Państwo zarejestrować rozproszone implementacje, takie jak Redis. Proszę użyć `app.lockManager.runExclusive(key, fn, ttl)` lub `acquire`/`tryAcquire` do kontrolowania współbieżności.
- `ttl` służy jako zabezpieczenie do zwolnienia blokady, zapobiegając jej wiecznemu utrzymywaniu w wyjątkowych przypadkach.
- Typowe scenariusze obejmują: zmiany schematu, zapobieganie powielaniu zadań, ograniczanie liczby żądań (rate limiting) itp.

Przykład: [`plugin-data-source-main` używa blokady rozproszonej do ochrony procesu usuwania pól](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Serializacja operacji usuwania pola"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Zalecenia dotyczące rozwoju

- **Spójność stanu w pamięci**: Proszę unikać używania stanu przechowywanego w pamięci podczas rozwoju. Zamiast tego proszę użyć buforowania lub wiadomości synchronicznych, aby zachować spójność stanu.
- **Priorytetowe wykorzystanie wbudowanych interfejsów**: Proszę używać ujednoliconych możliwości, takich jak `app.cache` i `app.syncMessageManager`, aby uniknąć ponownego implementowania logiki komunikacji międzywęzłowej we wtyczkach.
- **Proszę zwrócić uwagę na granice transakcji**: Operacje z transakcjami powinny używać `transaction.afterCommit` (co jest wbudowane w `syncMessageManager.publish`), aby zapewnić spójność danych i wiadomości.
- **Proszę opracować strategię ponawiania (backoff)**: Dla zadań kolejki i rozgłaszania, proszę ustawić rozsądne wartości `timeout`, `maxRetries` i `debounce`, aby zapobiec nowym szczytom ruchu w wyjątkowych sytuacjach.
- **Proszę używać uzupełniającego monitorowania i logowania**: Proszę dobrze wykorzystać logi aplikacji do rejestrowania nazw kanałów, ładunków wiadomości, kluczy blokad itp., aby ułatwić rozwiązywanie sporadycznych problemów w klastrze.

Dzięki tym możliwościom wtyczki mogą bezpiecznie współdzielić stan, synchronizować konfiguracje i planować zadania między różnymi instancjami, spełniając wymagania stabilności i spójności w scenariuszach wdrożeń klastrowych.