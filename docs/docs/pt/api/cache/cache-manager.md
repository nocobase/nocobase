:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# CacheManager

## Visão Geral

O CacheManager é baseado no <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> e oferece funcionalidades de gerenciamento de módulos de cache para o NocoBase. Os tipos de cache integrados são:

- `memory` - o lru-cache fornecido por padrão pelo `node-cache-manager`.
- `redis` - com suporte do `node-cache-manager-redis-yet`.

Você pode registrar e estender mais tipos através da API.

### Conceitos

- **Store**: Define um método de cache, incluindo um método de fábrica para criar caches e outras configurações relacionadas. Cada método de cache tem um identificador único, fornecido durante o registro.
  Os identificadores únicos para os dois métodos de cache integrados são `memory` e `redis`.

- **Método de Fábrica do Store**: É um método fornecido pelo `node-cache-manager` e pacotes de extensão relacionados para criar caches. Por exemplo, `'memory'` (fornecido por padrão pelo `node-cache-manager`) e `redisStore` (fornecido pelo `node-cache-manager-redis-yet`). Ele corresponde ao primeiro parâmetro do método `caching` do `node-cache-manager`.

- **Cache**: Uma classe encapsulada pelo NocoBase que oferece métodos para usar o cache. Ao usar o cache, você opera em uma instância de `Cache`. Cada instância de `Cache` tem um identificador único, que pode ser usado como um namespace para distinguir diferentes módulos.

## Métodos de Classe

### `constructor()`

#### Assinatura

- `constructor(options?: CacheManagerOptions)`

#### Tipos

```ts
export type CacheManagerOptions = Partial<{
  defaultStore: string;
  stores: {
    [storeType: string]: StoreOptions;
  };
}>;

type StoreOptions = {
  store?: 'memory' | FactoryStore<Store, any>;
  close?: (store: Store) => Promise<void>;
  // global config
  [key: string]: any;
};
```

#### Detalhes

##### CacheManagerOptions

| Propriedade      | Tipo                           | Descrição                                                                                                                                                                                                                         |
| ---------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | O identificador único para o tipo de cache padrão.                                                                                                                                                                                  |
| `stores`       | `Record<string, StoreOptions>` | Registra os tipos de cache. A chave é o identificador único para o tipo de cache, e o valor é um objeto que contém o método de registro e a configuração global para o tipo de cache.<br />No `node-cache-manager`, o método para criar um cache é `await caching(store, config)`. O objeto a ser fornecido aqui é [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Propriedade     | Tipo                                   | Descrição                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | O método de fábrica do `store`, correspondendo ao primeiro parâmetro de `caching`.                                                                                                                   |
| `close`         | `(store: Store) => Promise<void>`      | Opcional. Para middlewares como o Redis que exigem uma conexão, você precisa fornecer um método de callback para fechar a conexão. O parâmetro de entrada é o objeto retornado pelo método de fábrica do `store`. |
| `[key: string]` | `any`                                  | Outras configurações globais do `store`, correspondendo ao segundo parâmetro de `caching`.                                                                                                           |

#### `options` Padrão

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // global config
      max: 2000,
    },
    redis: {
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
    },
  },
};
```

O parâmetro `options` será mesclado com as opções padrão. As propriedades já presentes nas opções padrão podem ser omitidas. Por exemplo:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore já é fornecido nas opções padrão, então você só precisa fornecer a configuração do redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Registra um novo método de cache. Por exemplo:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // identificador único para o store
  name: 'redis',
  // método de fábrica para criar o store
  store: redisStore,
  // fecha a conexão do store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // configuração global
  url: 'xxx',
});
```

#### Assinatura

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Cria um cache. Por exemplo:

```ts
await cacheManager.createCache({
  name: 'default', // identificador único para o cache
  store: 'memory', // identificador único para o store
  prefix: 'mycache', // adiciona automaticamente o prefixo 'mycache:' às chaves de cache, opcional
  // outras configurações do store, configurações personalizadas serão mescladas com a configuração global do store
  max: 2000,
});
```

#### Assinatura

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Detalhes

##### options

| Propriedade     | Tipo     | Descrição                                                              |
| --------------- | -------- | ---------------------------------------------------------------------- |
| `name`          | `string` | Identificador único para o cache.                                      |
| `store`         | `string` | Identificador único para o `store`.                                    |
| `prefix`        | `string` | Opcional, prefixo da chave de cache.                                   |
| `[key: string]` | `any`    | Outros itens de configuração personalizados relacionados ao `store`. |

Se o `store` for omitido, o `defaultStore` será usado. Nesse caso, o método de cache mudará de acordo com o método de cache padrão do sistema.

Quando não há configurações personalizadas, ele retorna o espaço de cache padrão criado pela configuração global e compartilhado pelo método de cache atual. É recomendado adicionar um `prefix` para evitar conflitos de chave.

```ts
// Usa o cache padrão com a configuração global
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Veja [Cache](./cache.md)

### `getCache()`

Obtém o cache correspondente.

```ts
cacheManager.getCache('default');
```

#### Assinatura

- `getCache(name: string): Cache`

### `flushAll()`

Redefine todos os caches.

```ts
await cacheManager.flushAll();
```

### `close()`

Fecha todas as conexões dos middlewares de cache.

```ts
await cacheManager.close();
```