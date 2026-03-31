:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Cache

## Grundlegende Methoden

Beachten Sie die <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> Dokumentation.

- `get()`
- `set()`
- `del()`
- `reset()`
- `wrap()`
- `mset()`
- `mget()`
- `mdel()`
- `keys()`
- `ttl()`

## Weitere Methoden

### `wrapWithCondition()`

Ähnlich wie `wrap()`, ermöglicht es Ihnen jedoch, bedingt zu entscheiden, ob der Cache verwendet werden soll.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Externer Parameter zur Steuerung, ob das gecachte Ergebnis verwendet werden soll
    useCache?: boolean;
    // Entscheiden Sie, ob basierend auf dem Datenergebnis gecacht werden soll
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Wenn der gecachte Inhalt ein Objekt ist, ändern Sie den Wert eines bestimmten Schlüssels.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Wenn der gecachte Inhalt ein Objekt ist, rufen Sie den Wert eines bestimmten Schlüssels ab.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Wenn der gecachte Inhalt ein Objekt ist, löschen Sie einen bestimmten Schlüssel.

```ts
async delValueInObject(key: string, objectKey: string)
```