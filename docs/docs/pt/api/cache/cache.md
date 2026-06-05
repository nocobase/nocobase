:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Cache

## Métodos Básicos

Consulte a documentação do <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

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

## Outros Métodos

### `wrapWithCondition()`

Semelhante a `wrap()`, mas permite que você decida condicionalmente se deve usar o cache.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Parâmetro externo para controlar se o resultado em cache deve ser usado
    useCache?: boolean;
    // Decide se deve armazenar em cache com base no resultado dos dados
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Quando o conteúdo em cache é um objeto, altera o valor de uma chave específica.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Quando o conteúdo em cache é um objeto, obtém o valor de uma chave específica.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Quando o conteúdo em cache é um objeto, exclui uma chave específica.

```ts
async delValueInObject(key: string, objectKey: string)
```