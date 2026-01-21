:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Pamięć podręczna (Cache)

Moduł Cache w NocoBase opiera się na bibliotece <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> i zapewnia funkcjonalność buforowania dla rozwoju wtyczek. System posiada wbudowane dwa typy pamięci podręcznej:

- **memory** – Pamięć podręczna oparta na lru-cache, domyślnie dostarczana przez node-cache-manager.
- **redis** – Pamięć podręczna Redis oparta na node-cache-manager-redis-yet.

Więcej typów pamięci podręcznej można rozszerzyć i zarejestrować za pośrednictwem API.

## Podstawowe użycie

### app.cache

`app.cache` to domyślna instancja pamięci podręcznej na poziomie aplikacji, której można używać bezpośrednio.

```ts
// Ustawienie pamięci podręcznej
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL (czas życia) w sekundach

// Pobranie z pamięci podręcznej
const value = await app.cache.get('key');

// Usunięcie z pamięci podręcznej
await this.app.cache.del('key');
```

### ctx.cache

W middleware lub operacjach na zasobach, dostęp do pamięci podręcznej można uzyskać poprzez `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Brak danych w pamięci podręcznej, pobierz z bazy danych
    data = await this.getDataFromDatabase();
    // Zapisz w pamięci podręcznej, ważne przez 1 godzinę
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Tworzenie niestandardowej pamięci podręcznej

Jeśli potrzebują Państwo stworzyć niezależną instancję pamięci podręcznej (na przykład z różnymi przestrzeniami nazw lub konfiguracjami), mogą Państwo użyć metody `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Utworzenie instancji pamięci podręcznej z prefiksem
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Wszystkie klucze automatycznie otrzymają ten prefiks
      store: 'memory', // Użycie pamięci podręcznej w pamięci RAM, opcjonalne, domyślnie używa defaultStore
      max: 1000, // Maksymalna liczba elementów w pamięci podręcznej
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Opis parametrów `createCache`

| Parametr | Typ | Opis |
| -------- | ---- | ---------- |
| `name` | `string` | Unikalny identyfikator pamięci podręcznej, wymagany |
| `prefix` | `string` | Opcjonalny prefiks dla kluczy pamięci podręcznej, używany do unikania konfliktów kluczy |
| `store` | `string` | Opcjonalny identyfikator typu magazynu (np. `'memory'`, `'redis'`), domyślnie używa `defaultStore` |
| `[key: string]` | `any` | Inne niestandardowe opcje konfiguracji związane z magazynem |

### Pobieranie utworzonej pamięci podręcznej

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Podstawowe metody pamięci podręcznej

Instancje pamięci podręcznej oferują bogaty zestaw metod operacji, z których większość jest dziedziczona z `node-cache-manager`.

### get / set

```ts
// Ustawienie pamięci podręcznej z czasem wygaśnięcia (w sekundach)
await cache.set('key', 'value', { ttl: 3600 });

// Pobranie z pamięci podręcznej
const value = await cache.get('key');
```

### del / reset

```ts
// Usunięcie pojedynczego klucza
await cache.del('key');

// Wyczyść całą pamięć podręczną
await cache.reset();
```

### wrap

Metoda `wrap()` to bardzo przydatne narzędzie, które najpierw próbuje pobrać dane z pamięci podręcznej. Jeśli dane nie zostaną znalezione (cache miss), wykonuje funkcję i zapisuje jej wynik w pamięci podręcznej.

```ts
const data = await cache.wrap('user:1', async () => {
  // Ta funkcja wykonuje się tylko w przypadku braku danych w pamięci podręcznej
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Operacje wsadowe

```ts
// Ustawienie wsadowe
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Pobieranie wsadowe
const values = await cache.mget(['key1', 'key2', 'key3']);

// Usuwanie wsadowe
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Pobranie wszystkich kluczy (uwaga: niektóre magazyny mogą tego nie obsługiwać)
const allKeys = await cache.keys();

// Pobranie pozostałego czasu życia klucza (w sekundach)
const remainingTTL = await cache.ttl('key');
```

## Zaawansowane użycie

### wrapWithCondition

`wrapWithCondition()` jest podobne do `wrap()`, ale pozwala warunkowo decydować o użyciu pamięci podręcznej.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Parametry zewnętrzne kontrolujące, czy użyć wyniku z pamięci podręcznej
    useCache: true, // Jeśli ustawione na false, funkcja zostanie wykonana ponownie, nawet jeśli pamięć podręczna zawiera dane

    // Decyzja o buforowaniu na podstawie wyniku danych
    isCacheable: (value) => {
      // Na przykład: buforuj tylko pomyślne wyniki
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Operacje na obiektach w pamięci podręcznej

Gdy zawartość pamięci podręcznej jest obiektem, mogą Państwo użyć poniższych metod do bezpośredniej manipulacji właściwościami obiektu, bez konieczności pobierania całego obiektu.

```ts
// Ustawienie właściwości obiektu
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Pobranie właściwości obiektu
const name = await cache.getValueInObject('user:1', 'name');

// Usunięcie właściwości obiektu
await cache.delValueInObject('user:1', 'age');
```

## Rejestrowanie niestandardowego magazynu (Store)

Jeśli potrzebują Państwo użyć innych typów pamięci podręcznej (takich jak Memcached, MongoDB itp.), mogą Państwo je zarejestrować za pomocą `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Rejestracja magazynu Redis (jeśli system jeszcze go nie zarejestrował)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Konfiguracja połączenia Redis
      url: 'redis://localhost:6379',
    });

    // Utworzenie pamięci podręcznej przy użyciu nowo zarejestrowanego magazynu
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Uwagi

1.  **Limity pamięci podręcznej w RAM**: Podczas korzystania z magazynu `memory`, proszę pamiętać o ustawieniu rozsądnego parametru `max`, aby uniknąć przepełnienia pamięci.
2.  **Strategia unieważniania pamięci podręcznej**: Podczas aktualizacji danych proszę pamiętać o wyczyszczeniu powiązanych danych z pamięci podręcznej, aby uniknąć nieaktualnych informacji.
3.  **Konwencje nazewnictwa kluczy**: Zaleca się używanie znaczących przestrzeni nazw i prefiksów, np. `moduł:zasób:id`.
4.  **Ustawienia TTL**: Proszę rozsądnie ustawiać TTL (czas życia) w zależności od częstotliwości aktualizacji danych, aby zrównoważyć wydajność i spójność.
5.  **Połączenie z Redis**: Podczas korzystania z Redis, proszę upewnić się, że parametry połączenia i hasła są poprawnie skonfigurowane w środowisku produkcyjnym.