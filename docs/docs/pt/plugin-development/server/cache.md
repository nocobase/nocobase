:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Cache

O módulo de Cache do NocoBase é baseado no <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> e oferece funcionalidade de cache para o desenvolvimento de **plugins**. O sistema possui dois tipos de cache integrados:

- **memory** - Cache em memória baseado em lru-cache, fornecido por padrão pelo node-cache-manager.
- **redis** - Cache Redis baseado em node-cache-manager-redis-yet.

Você pode estender e registrar mais tipos de cache através da API.

## Uso Básico

### app.cache

`app.cache` é a instância de cache padrão em nível de aplicação e pode ser usada diretamente.

```ts
// Definir cache
await app.cache.set('key', 'value', { ttl: 3600 }); // Unidade TTL: segundos

// Obter cache
const value = await app.cache.get('key');

// Excluir cache
await this.app.cache.del('key');
```

### ctx.cache

Em middlewares ou operações de recursos, você pode acessar o cache através de `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache não encontrado, obter do banco de dados
    data = await this.getDataFromDatabase();
    // Armazenar no cache, válido por 1 hora
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Criar Cache Personalizado

Se você precisar criar uma instância de cache independente (por exemplo, com diferentes namespaces ou configurações), pode usar o método `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Criar uma instância de cache com prefixo
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Todas as chaves adicionarão automaticamente este prefixo
      store: 'memory', // Usar cache em memória, opcional, o padrão é defaultStore
      max: 1000, // Número máximo de itens no cache
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Descrição dos Parâmetros de `createCache`

| Parâmetro | Tipo | Descrição |
| -------- | ---- | ---------- |
| `name` | `string` | Identificador único para o cache, obrigatório. |
| `prefix` | `string` | Opcional, prefixo para as chaves do cache, usado para evitar conflitos de chaves. |
| `store` | `string` | Opcional, identificador do tipo de store (como `'memory'`, `'redis'`), o padrão é `defaultStore`. |
| `[key: string]` | `any` | Outros itens de configuração personalizados relacionados ao store. |

### Obter Cache Criado

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Métodos Básicos de Cache

As instâncias de Cache oferecem métodos ricos para operações de cache, a maioria herdada do node-cache-manager.

### get / set

```ts
// Definir cache com tempo de expiração (unidade: segundos)
await cache.set('key', 'value', { ttl: 3600 });

// Obter cache
const value = await cache.get('key');
```

### del / reset

```ts
// Excluir uma única chave
await cache.del('key');

// Limpar todo o cache
await cache.reset();
```

### wrap

O método `wrap()` é uma ferramenta muito útil que primeiro tenta obter dados do cache. Se o cache não for encontrado, ele executa a função e armazena o resultado no cache.

```ts
const data = await cache.wrap('user:1', async () => {
  // Esta função só é executada quando o cache não é encontrado
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Operações em Lote

```ts
// Definir em lote
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Obter em lote
const values = await cache.mget(['key1', 'key2', 'key3']);

// Excluir em lote
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Obter todas as chaves (observação: alguns stores podem não suportar isso)
const allKeys = await cache.keys();

// Obter o tempo de expiração restante para a chave (unidade: segundos)
const remainingTTL = await cache.ttl('key');
```

## Uso Avançado

### wrapWithCondition

`wrapWithCondition()` é semelhante a `wrap()`, mas permite decidir se o cache deve ser usado com base em condições.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Parâmetros externos controlam se o resultado do cache deve ser usado
    useCache: true, // Se definido como false, a função será reexecutada mesmo que o cache exista

    // Decidir se deve armazenar em cache com base no resultado dos dados
    isCacheable: (value) => {
      // Por exemplo: armazenar em cache apenas resultados bem-sucedidos
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Operações de Cache de Objeto

Quando o conteúdo armazenado em cache é um objeto, você pode usar os seguintes métodos para operar diretamente as propriedades do objeto, sem precisar obter o objeto inteiro.

```ts
// Definir uma propriedade de um objeto
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Obter uma propriedade de um objeto
const name = await cache.getValueInObject('user:1', 'name');

// Excluir uma propriedade de um objeto
await cache.delValueInObject('user:1', 'age');
```

## Registrar Store Personalizado

Se você precisar usar outros tipos de cache (como Memcached, MongoDB, etc.), pode registrá-los através de `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Registrar o store Redis (se o sistema ainda não o registrou)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Configuração de conexão Redis
      url: 'redis://localhost:6379',
    });

    // Criar cache usando o store recém-registrado
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Observações

1.  **Limites do Cache em Memória**: Ao usar o store de memória, preste atenção em definir um parâmetro `max` razoável para evitar estouro de memória.
2.  **Estratégia de Invalidação de Cache**: Ao atualizar dados, lembre-se de limpar o cache relacionado para evitar dados desatualizados.
3.  **Convenções de Nomenclatura de Chaves**: Recomenda-se usar namespaces e prefixos significativos, como `module:resource:id`.
4.  **Configurações de TTL**: Defina o TTL de forma razoável com base na frequência de atualização dos dados para equilibrar desempenho e consistência.
5.  **Conexão Redis**: Ao usar Redis, certifique-se de que os parâmetros de conexão e senhas estejam configurados corretamente em ambiente de produção.