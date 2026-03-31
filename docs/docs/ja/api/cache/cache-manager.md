:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# CacheManager



# CacheManager

## 概要

CacheManager は <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> をベースにしており、NocoBase にキャッシュモジュールの管理機能を提供します。組み込みのキャッシュタイプは以下の通りです。

- memory - `node-cache-manager` がデフォルトで提供する `lru-cache`
- redis - `node-cache-manager-redis-yet` がサポートする機能

さらに多くのタイプをAPIを通じて登録・拡張することができます。

### 概念

- **ストア (Store)**: キャッシュの作成ファクトリメソッドやその他の関連設定を含む、キャッシュ方式を定義します。各キャッシュ方式には、登録時に提供される一意の識別子があります。
  組み込みの2つのキャッシュ方式に対応する一意の識別子は、`memory` と `redis` です。

- **ストアファクトリメソッド (Store Factory Method)**: `node-cache-manager` および関連する拡張パッケージによって提供される、キャッシュを作成するためのメソッドです。例えば、`node-cache-manager` がデフォルトで提供する `'memory'` や、`node-cache-manager-redis-yet` が提供する `redisStore` などです。これは、`node-cache-manager` の `caching` メソッドの最初の引数に相当します。

- **キャッシュ (Cache)**: NocoBase がカプセル化したクラスで、キャッシュを使用するための関連メソッドを提供します。実際にキャッシュを使用する際は、`Cache` のインスタンスを操作します。各 `Cache` インスタンスには一意の識別子があり、異なるモジュールを区別するための名前空間として使用できます。

## クラスメソッド

### `constructor()`

#### シグネチャ

- `constructor(options?: CacheManagerOptions)`

#### 型定義

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

#### 詳細

##### CacheManagerOptions

| 属性           | 型                             | 説明                                                                                                                                                                                                                                  |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | デフォルトのキャッシュタイプに対する一意の識別子です。                                                                                                                                                                              |
| `stores`       | `Record<string, StoreOptions>` | キャッシュタイプを登録します。キーはキャッシュタイプの一意の識別子で、値はキャッシュタイプの登録メソッドとグローバル設定を含むオブジェクトです。<br />`node-cache-manager` では、キャッシュを作成するメソッドは `await caching(store, config)` です。ここで提供する必要があるオブジェクトは [`StoreOptions`](#storeoptions) です。 |

##### StoreOptions

| 属性            | 型                                   | 説明                                                                                                     |
| --------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `store`         | `memory` \| `FactoryStore<Store, any>` | ストアファクトリメソッドで、`caching` の最初の引数に対応します。                                         |
| `close`         | `(store: Store) => Promise<void>`      | オプションです。Redisのように接続を確立する必要があるミドルウェアの場合、接続を閉じるためのコールバックメソッドを提供する必要があります。引数にはストアファクトリメソッドが返すオブジェクトが入ります。 |
| `[key: string]` | `any`                                  | その他のグローバルストア設定で、`caching` の2番目の引数に対応します。                                    |

#### デフォルトの `options`

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // グローバル設定
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

`options` パラメータはデフォルトのオプションとマージされます。デフォルトのオプションに既に存在するプロパティは省略できます。例：

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStoreはデフォルトオプションで既に提供されているため、redisStoreの設定のみを提供すれば十分です。
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

新しいキャッシュ方式を登録します。例：

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // ストアの一意の識別子
  name: 'redis',
  // ストアを作成するファクトリメソッド
  store: redisStore,
  // ストア接続を閉じる
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // グローバル設定
  url: 'xxx',
});
```

#### シグネチャ

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

キャッシュを作成します。例：

```ts
await cacheManager.createCache({
  name: 'default', // キャッシュの一意の識別子
  store: 'memory', // ストアの一意の識別子
  prefix: 'mycache', // キャッシュキーに自動的に 'mycache:' プレフィックスを追加します (オプション)
  // その他のストア設定。カスタム設定はグローバルストア設定とマージされます。
  max: 2000,
});
```

#### シグネチャ

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### 詳細

##### options

| 属性            | 型     | 説明                                           |
| --------------- | -------- | ---------------------------------------------- |
| `name`          | `string` | キャッシュの一意の識別子です。                 |
| `store`         | `string` | ストアの一意の識別子です。                     |
| `prefix`        | `string` | オプション。キャッシュキーのプレフィックスです。 |
| `[key: string]` | `any`    | ストアに関連するその他のカスタム設定項目です。 |

`store` を省略した場合、`defaultStore` が使用されます。この場合、キャッシュ方式はシステムのデフォルトキャッシュ方式の変更に従って変わります。

カスタム設定がない場合、グローバル設定によって作成され、現在のキャッシュ方式で共有されるデフォルトのキャッシュ空間が返されます。キーの衝突を避けるために `prefix` を追加することをお勧めします。

```ts
// グローバル設定でデフォルトキャッシュを使用
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

[Cache](./cache.md) を参照してください。

### `getCache()`

対応するキャッシュを取得します。

```ts
cacheManager.getCache('default');
```

#### シグネチャ

- `getCache(name: string): Cache`

### `flushAll()`

すべてのキャッシュをリセットします。

```ts
await cacheManager.flushAll();
```

### `close()`

すべてのキャッシュミドルウェア接続を閉じます。

```ts
await cacheManager.close();