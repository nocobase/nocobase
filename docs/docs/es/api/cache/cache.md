:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Caché

## Métodos Básicos

Puede consultar la documentación de <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

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

## Otros Métodos

### `wrapWithCondition()`

Es similar a `wrap()`, pero le permite decidir condicionalmente si desea utilizar la caché.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Parámetro externo para controlar si se utiliza el resultado en caché
    useCache?: boolean;
    // Decide si se debe almacenar en caché basándose en el resultado de los datos
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Cuando el contenido en caché es un objeto, cambia el valor de una clave específica.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Cuando el contenido en caché es un objeto, obtiene el valor de una clave específica.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Cuando el contenido en caché es un objeto, elimina una clave específica.

```ts
async delValueInObject(key: string, objectKey: string)
```