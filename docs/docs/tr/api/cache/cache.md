:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Önbellek

## Temel Yöntemler

<a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> dokümantasyonuna başvurabilirsiniz.

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

## Diğer Yöntemler

### `wrapWithCondition()`

`wrap()` ile benzer bir işlevselliğe sahiptir, ancak önbelleği kullanıp kullanmayacağınıza koşullu olarak karar vermenizi sağlar.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Önbelleğe alınmış sonucu kullanıp kullanmayacağınızı kontrol eden harici parametre
    useCache?: boolean;
    // Veri sonucuna göre önbelleğe alınıp alınmayacağına karar verir
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Önbelleğe alınmış içerik bir nesne olduğunda, belirli bir anahtarın değerini değiştirir.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Önbelleğe alınmış içerik bir nesne olduğunda, belirli bir anahtarın değerini alır.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Önbelleğe alınmış içerik bir nesne olduğunda, belirli bir anahtarı siler.

```ts
async delValueInObject(key: string, objectKey: string)
```