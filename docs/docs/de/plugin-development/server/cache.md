:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Cache

Das Cache-Modul von NocoBase basiert auf <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> und stellt Cache-Funktionen für die Plugin-Entwicklung bereit. Das System bietet zwei integrierte Cache-Typen:

- **memory** – Ein In-Memory-Cache, der auf `lru-cache` basiert und standardmäßig von `node-cache-manager` bereitgestellt wird.
- **redis** – Ein Redis-Cache, der auf `node-cache-manager-redis-yet` basiert.

Weitere Cache-Typen können Sie über die API erweitern und registrieren.

## Grundlegende Verwendung

### app.cache

`app.cache` ist die standardmäßige Cache-Instanz auf Anwendungsebene und kann direkt verwendet werden.

```ts
// Cache setzen
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL-Einheit: Sekunden

// Cache abrufen
const value = await app.cache.get('key');

// Cache löschen
await this.app.cache.del('key');
```

### ctx.cache

In Middleware oder bei Ressourcenoperationen können Sie über `ctx.cache` auf den Cache zugreifen.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache-Miss: Daten aus der Datenbank abrufen
    data = await this.getDataFromDatabase();
    // Im Cache speichern, Gültigkeit 1 Stunde
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Benutzerdefinierten Cache erstellen

Wenn Sie eine unabhängige Cache-Instanz (z. B. mit unterschiedlichen Namensräumen oder Konfigurationen) erstellen möchten, können Sie die Methode `app.cacheManager.createCache()` verwenden.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Eine Cache-Instanz mit Präfix erstellen
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Alle Keys erhalten automatisch dieses Präfix
      store: 'memory', // In-Memory-Cache verwenden (optional, standardmäßig wird defaultStore genutzt)
      max: 1000, // Maximale Anzahl von Cache-Einträgen
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Parameterbeschreibung für `createCache`

| Parameter | Typ | Beschreibung |
| ---- | ---- | ---- |
| `name` | `string` | Eindeutiger Bezeichner für den Cache (erforderlich) |
| `prefix` | `string` | Optional: Präfix für Cache-Keys, um Konflikte zu vermeiden |
| `store` | `string` | Optional: Bezeichner des Store-Typs (z. B. `'memory'`, `'redis'`), standardmäßig wird `defaultStore` verwendet |
| `[key: string]` | `any` | Weitere Store-spezifische Konfigurationsoptionen |

### Erstellten Cache abrufen

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Grundlegende Cache-Methoden

Cache-Instanzen bieten umfangreiche Methoden für Cache-Operationen, von denen die meisten von `node-cache-manager` geerbt werden.

### get / set

```ts
// Cache setzen, mit Ablaufzeit (Einheit: Sekunden)
await cache.set('key', 'value', { ttl: 3600 });

// Cache abrufen
const value = await cache.get('key');
```

### del / reset

```ts
// Einzelnen Key löschen
await cache.del('key');

// Gesamten Cache leeren
await cache.reset();
```

### wrap

Die Methode `wrap()` ist ein sehr nützliches Werkzeug: Sie versucht zunächst, Daten aus dem Cache abzurufen. Wenn der Cache-Eintrag nicht gefunden wird (Cache-Miss), wird die Funktion ausgeführt und das Ergebnis im Cache gespeichert.

```ts
const data = await cache.wrap('user:1', async () => {
  // Diese Funktion wird nur bei einem Cache-Miss ausgeführt
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Batch-Operationen

```ts
// Batch-Setzen
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Batch-Abrufen
const values = await cache.mget(['key1', 'key2', 'key3']);

// Batch-Löschen
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Alle Keys abrufen (Hinweis: Einige Stores unterstützen dies möglicherweise nicht)
const allKeys = await cache.keys();

// Verbleibende Ablaufzeit für einen Key abrufen (Einheit: Sekunden)
const remainingTTL = await cache.ttl('key');
```

## Erweiterte Verwendung

### wrapWithCondition

`wrapWithCondition()` ähnelt `wrap()`, kann aber anhand von Bedingungen entscheiden, ob der Cache verwendet werden soll.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Externe Parameter steuern, ob das Cache-Ergebnis verwendet wird
    useCache: true, // Wenn auf false gesetzt, wird die Funktion auch bei vorhandenem Cache erneut ausgeführt

    // Anhand des Datenergebnisses entscheiden, ob gecacht werden soll
    isCacheable: (value) => {
      // Beispiel: Nur erfolgreiche Ergebnisse werden gecacht
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Objekt-Cache-Operationen

Wenn der gecachte Inhalt ein Objekt ist, können Sie die folgenden Methoden verwenden, um Objekteigenschaften direkt zu bearbeiten, ohne das gesamte Objekt abrufen zu müssen.

```ts
// Eine Eigenschaft des Objekts setzen
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Eine Eigenschaft des Objekts abrufen
const name = await cache.getValueInObject('user:1', 'name');

// Eine Eigenschaft des Objekts löschen
await cache.delValueInObject('user:1', 'age');
```

## Benutzerdefinierten Store registrieren

Wenn Sie andere Cache-Typen (wie Memcached, MongoDB usw.) verwenden möchten, können Sie diese über `app.cacheManager.registerStore()` registrieren.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Redis-Store registrieren (falls noch nicht vom System registriert)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Redis-Verbindungskonfiguration
      url: 'redis://localhost:6379',
    });

    // Cache mit dem neu registrierten Store erstellen
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Hinweise

1. **Grenzen des In-Memory-Caches**: Achten Sie bei der Verwendung des Memory-Stores darauf, einen angemessenen `max`-Parameter festzulegen, um Speicherüberläufe zu vermeiden.
2. **Cache-Invalidierungsstrategie**: Denken Sie daran, bei Datenaktualisierungen den zugehörigen Cache zu leeren, um veraltete Daten zu vermeiden.
3. **Key-Benennungskonventionen**: Es wird empfohlen, aussagekräftige Namensräume und Präfixe zu verwenden, z. B. `module:resource:id`.
4. **TTL-Einstellungen**: Legen Sie die TTL basierend auf der Datenaktualisierungsfrequenz sinnvoll fest, um Leistung und Konsistenz auszugleichen.
5. **Redis-Verbindung**: Stellen Sie bei der Verwendung von Redis sicher, dass die Verbindungsparameter und Passwörter in der Produktionsumgebung korrekt konfiguriert sind.