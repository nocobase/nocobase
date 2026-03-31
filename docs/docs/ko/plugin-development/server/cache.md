:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 캐시

NocoBase의 캐시 모듈은 <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>를 기반으로 개발되었으며, 플러그인 개발을 위한 캐시 기능을 제공합니다. 시스템에는 두 가지 캐시 유형이 내장되어 있습니다.

- **memory** - `lru-cache` 기반의 메모리 캐시이며, `node-cache-manager`에서 기본으로 제공합니다.
- **redis** - `node-cache-manager-redis-yet` 기반의 Redis 캐시입니다.

더 많은 캐시 유형은 API를 통해 확장하고 등록할 수 있습니다.

## 기본 사용법

### app.cache

`app.cache`는 애플리케이션 수준의 기본 캐시 인스턴스이며, 바로 사용할 수 있습니다.

```ts
// 캐시 설정
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL 단위: 초

// 캐시 가져오기
const value = await app.cache.get('key');

// 캐시 삭제
await this.app.cache.del('key');
```

### ctx.cache

미들웨어 또는 리소스 작업에서 `ctx.cache`를 통해 캐시에 접근할 수 있습니다.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // 캐시 미스 발생 시, 데이터베이스에서 가져오기
    data = await this.getDataFromDatabase();
    // 캐시에 저장, 유효 기간 1시간
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## 사용자 지정 캐시 생성

독립적인 캐시 인스턴스(예: 다른 네임스페이스 또는 설정)를 생성해야 하는 경우, `app.cacheManager.createCache()` 메서드를 사용할 수 있습니다.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // 접두사가 있는 캐시 인스턴스 생성
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // 모든 키에 이 접두사가 자동으로 추가됩니다.
      store: 'memory', // 메모리 캐시 사용 (선택 사항, 기본값은 defaultStore 사용)
      max: 1000, // 최대 캐시 항목 수
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### createCache 매개변수 설명

| 매개변수 | 타입 | 설명 |
| ---- | ---- | ---- |
| `name` | `string` | 캐시의 고유 식별자 (필수) |
| `prefix` | `string` | 선택 사항, 캐시 키의 접두사로, 키 충돌 방지에 사용됩니다. |
| `store` | `string` | 선택 사항, 스토어 타입 식별자 (예: `'memory'`, `'redis'`), 기본값은 `defaultStore`를 사용합니다. |
| `[key: string]` | `any` | 그 외 스토어 관련 사용자 지정 설정 항목 |

### 생성된 캐시 가져오기

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## 캐시의 기본 메서드

캐시 인스턴스는 다양한 캐시 작업 메서드를 제공하며, 대부분 `node-cache-manager`에서 상속받습니다.

### get / set

```ts
// 만료 시간(단위: 초)과 함께 캐시 설정
await cache.set('key', 'value', { ttl: 3600 });

// 캐시 가져오기
const value = await cache.get('key');
```

### del / reset

```ts
// 단일 키 삭제
await cache.del('key');

// 모든 캐시 비우기
await cache.reset();
```

### wrap

`wrap()` 메서드는 매우 유용한 도구입니다. 먼저 캐시에서 데이터를 가져오려고 시도하고, 캐시 미스 발생 시 함수를 실행하여 결과를 캐시에 저장합니다.

```ts
const data = await cache.wrap('user:1', async () => {
  // 이 함수는 캐시 미스 시에만 실행됩니다.
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### 배치 작업

```ts
// 배치 설정
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// 배치 가져오기
const values = await cache.mget(['key1', 'key2', 'key3']);

// 배치 삭제
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// 모든 키 가져오기 (참고: 일부 스토어는 지원하지 않을 수 있습니다.)
const allKeys = await cache.keys();

// 키의 남은 만료 시간 가져오기 (단위: 초)
const remainingTTL = await cache.ttl('key');
```

## 고급 사용법

### wrapWithCondition

`wrapWithCondition()`은 `wrap()`과 유사하지만, 조건을 통해 캐시 사용 여부를 결정할 수 있습니다.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // 외부 매개변수로 캐시 결과 사용 여부 제어
    useCache: true, // false로 설정하면 캐시가 존재하더라도 함수를 다시 실행합니다.

    // 데이터 결과를 통해 캐시 여부 결정
    isCacheable: (value) => {
      // 예: 성공적인 결과만 캐시합니다.
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### 객체 캐시 작업

캐시된 내용이 객체인 경우, 전체 객체를 가져올 필요 없이 다음 메서드를 사용하여 객체의 속성을 직접 조작할 수 있습니다.

```ts
// 객체의 특정 속성 설정
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// 객체의 특정 속성 가져오기
const name = await cache.getValueInObject('user:1', 'name');

// 객체의 특정 속성 삭제
await cache.delValueInObject('user:1', 'age');
```

## 사용자 지정 스토어 등록

Memcached, MongoDB 등 다른 캐시 유형을 사용해야 하는 경우, `app.cacheManager.registerStore()`를 통해 등록할 수 있습니다.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Redis 스토어 등록 (시스템에 등록되지 않은 경우)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Redis 연결 설정
      url: 'redis://localhost:6379',
    });

    // 새로 등록된 스토어를 사용하여 캐시 생성
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## 주의사항

1.  **메모리 캐시 제한**: memory 스토어를 사용할 때는 메모리 오버플로우를 방지하기 위해 `max` 매개변수를 적절하게 설정해야 합니다.
2.  **캐시 무효화 전략**: 데이터를 업데이트할 때는 관련 캐시를 지워 오래된 데이터(dirty data)를 방지해야 합니다.
3.  **키(Key) 명명 규칙**: `module:resource:id`와 같이 의미 있는 네임스페이스와 접두사를 사용하는 것이 좋습니다.
4.  **TTL 설정**: 데이터 업데이트 빈도에 따라 TTL을 적절하게 설정하여 성능과 일관성의 균형을 맞춰야 합니다.
5.  **Redis 연결**: Redis를 사용할 때는 프로덕션 환경에서 연결 매개변수와 비밀번호를 올바르게 설정해야 합니다.