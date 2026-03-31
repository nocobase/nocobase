:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# キャッシュ

NocoBaseのキャッシュモジュールは、<a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>をベースに構築されており、プラグイン開発にキャッシュ機能を提供します。システムには以下の2種類のキャッシュが組み込まれています。

- **memory** - `lru-cache`をベースにしたインメモリキャッシュで、`node-cache-manager`によってデフォルトで提供されます。
- **redis** - `node-cache-manager-redis-yet`をベースにしたRedisキャッシュです。

さらに多くのキャッシュタイプは、APIを通じて拡張・登録することが可能です。

## 基本的な使い方

### app.cache

`app.cache`は、アプリケーションレベルのデフォルトキャッシュインスタンスで、そのまま利用できます。

```ts
// キャッシュを設定
await app.cache.set('key', 'value', { ttl: 3600 }); // TTLの単位：秒

// キャッシュを取得
const value = await app.cache.get('key');

// キャッシュを削除
await this.app.cache.del('key');
```

### ctx.cache

ミドルウェアやリソース操作では、`ctx.cache`を通じてキャッシュにアクセスできます。

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // キャッシュミスの場合、データベースから取得
    data = await this.getDataFromDatabase();
    // キャッシュに保存（有効期限1時間）
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## カスタムキャッシュの作成

もし、独立したキャッシュインスタンス（例えば、異なる名前空間や設定を持つもの）を作成する必要がある場合は、`app.cacheManager.createCache()`メソッドを利用できます。

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // プレフィックス付きのキャッシュインスタンスを作成
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // すべてのキーにこのプレフィックスが自動的に追加されます
      store: 'memory', // インメモリキャッシュを使用（オプション、デフォルトはdefaultStoreを使用）
      max: 1000, // キャッシュ項目の最大数
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### createCache パラメータの説明

| パラメータ | 型 | 説明 |
| ---- | ---- | ---- |
| `name` | `string` | キャッシュの一意な識別子（必須） |
| `prefix` | `string` | オプション。キャッシュキーのプレフィックスで、キーの衝突を避けるために使用します。 |
| `store` | `string` | オプション。ストアタイプの識別子（例：`'memory'`、`'redis'`）。デフォルトは`defaultStore`を使用します。 |
| `[key: string]` | `any` | その他のストア関連のカスタム設定項目 |

### 作成済みのキャッシュを取得

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## キャッシュの基本的なメソッド

キャッシュインスタンスは、豊富なキャッシュ操作メソッドを提供しており、そのほとんどは`node-cache-manager`から継承されています。

### get / set

```ts
// 有効期限付きでキャッシュを設定（単位：秒）
await cache.set('key', 'value', { ttl: 3600 });

// キャッシュを取得
const value = await cache.get('key');
```

### del / reset

```ts
// 単一のキーを削除
await cache.del('key');

// すべてのキャッシュをクリア
await cache.reset();
```

### wrap

`wrap()`メソッドは非常に便利なツールです。まずキャッシュからデータを取得しようとし、キャッシュミスが発生した場合は関数を実行してその結果をキャッシュに保存します。

```ts
const data = await cache.wrap('user:1', async () => {
  // この関数はキャッシュミスの場合にのみ実行されます
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### バッチ操作

```ts
// バッチで設定
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// バッチで取得
const values = await cache.mget(['key1', 'key2', 'key3']);

// バッチで削除
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// すべてのキーを取得（注意：一部のストアではサポートされていない場合があります）
const allKeys = await cache.keys();

// キーの残り有効期限を取得（単位：秒）
const remainingTTL = await cache.ttl('key');
```

## 高度な使い方

### wrapWithCondition

`wrapWithCondition()`は`wrap()`に似ていますが、条件に基づいてキャッシュを使用するかどうかを決定できます。

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // 外部パラメータでキャッシュ結果を使用するかどうかを制御
    useCache: true, // falseに設定すると、キャッシュが存在しても関数が再実行されます

    // データの結果に基づいてキャッシュするかどうかを決定
    isCacheable: (value) => {
      // 例：成功した結果のみをキャッシュ
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### オブジェクトキャッシュ操作

キャッシュされたコンテンツがオブジェクトの場合、以下のメソッドを使用して、オブジェクト全体を取得することなく、そのプロパティを直接操作できます。

```ts
// オブジェクトの特定のプロパティを設定
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// オブジェクトの特定のプロパティを取得
const name = await cache.getValueInObject('user:1', 'name');

// オブジェクトの特定のプロパティを削除
await cache.delValueInObject('user:1', 'age');
```

## カスタムストアの登録

MemcachedやMongoDBなどの他のキャッシュタイプを使用する必要がある場合は、`app.cacheManager.registerStore()`を通じて登録できます。

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Redisストアを登録（システムが未登録の場合）
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Redis接続設定
      url: 'redis://localhost:6379',
    });

    // 新しく登録されたストアを使用してキャッシュを作成
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## 注意事項

1.  **メモリキャッシュの制限**：`memory`ストアを使用する際は、メモリオーバーフローを避けるため、`max`パラメータを適切に設定してください。
2.  **キャッシュ無効化戦略**：データを更新する際は、関連するキャッシュを忘れずにクリアし、古いデータ（ダーティデータ）が残らないようにしてください。
3.  **キーの命名規則**：`module:resource:id`のように、意味のある名前空間とプレフィックスを使用することをお勧めします。
4.  **TTLの設定**：データの更新頻度に応じてTTLを適切に設定し、パフォーマンスと一貫性のバランスを取ってください。
5.  **Redis接続**：Redisを使用する際は、本番環境で接続パラメータとパスワードが正しく設定されていることを確認してください。