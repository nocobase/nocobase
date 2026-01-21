:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# CacheManager

## 개요

CacheManager는 <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>를 기반으로 NocoBase에 캐시 모듈 관리 기능을 제공합니다. 내장된 캐시 유형은 다음과 같습니다.

- memory - node-cache-manager에서 기본으로 제공하는 lru-cache
- redis - node-cache-manager-redis-yet에서 지원하는 기능

더 많은 유형은 API를 통해 확장 및 등록할 수 있습니다.

### 개념 설명

- **Store**: 캐시 생성 팩토리 메서드와 기타 관련 설정을 포함하여 캐싱 방식을 정의합니다. 각 캐싱 방식은 등록 시 제공되는 고유 식별자를 가집니다.
  내장된 두 가지 캐싱 방식에 해당하는 고유 식별자는 `memory`와 `redis`입니다.

- **Store 팩토리 메서드**: `node-cache-manager` 및 관련 확장 패키지에서 제공하는 캐시 생성 메서드입니다. 예를 들어, `node-cache-manager`에서 기본으로 제공하는 `'memory'`나 `node-cache-manager-redis-yet`에서 제공하는 `redisStore` 등이 있습니다. 이는 `node-cache-manager`의 `caching` 메서드의 첫 번째 매개변수에 해당합니다.

- **Cache**: NocoBase가 캡슐화한 클래스로, 캐시 사용과 관련된 메서드를 제공합니다. 실제로 캐시를 사용할 때는 `Cache` 인스턴스를 조작하며, 각 `Cache` 인스턴스는 고유 식별자를 가지고 있어 서로 다른 모듈을 구분하는 네임스페이스로 활용할 수 있습니다.

## 클래스 메서드

### `constructor()`

#### 시그니처

- `constructor(options?: CacheManagerOptions)`

#### 타입

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
  // 전역 설정
  [key: string]: any;
};
```

#### 상세 정보

##### CacheManagerOptions

| 속성           | 타입                           | 설명                                                                                                                                                                                                                          |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | 기본 캐시 유형의 고유 식별자                                                                                                                                                                                                          |
| `stores`       | `Record<string, StoreOptions>` | 캐시 유형을 등록합니다. 키는 캐시 유형의 고유 식별자이며, 값은 캐시 유형의 등록 메서드와 전역 설정을 포함하는 객체입니다.<br />`node-cache-manager`에서 캐시를 생성하는 메서드는 `await caching(store, config)`입니다. 여기서 제공해야 하는 객체는 [`StoreOptions`](#storeoptions)입니다. |

##### StoreOptions

| 속성            | 타입                                   | 설명                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | store 팩토리 메서드로, caching의 첫 번째 매개변수에 해당합니다.                                                                                                                                        |
| `close`         | `(store: Store) => Promise<void>`      | 선택 사항입니다. Redis와 같이 연결이 필요한 미들웨어의 경우, 연결을 닫는 콜백 메서드를 제공해야 합니다. 입력 매개변수는 store 팩토리 메서드가 반환하는 객체입니다.                                |
| `[key: string]` | `any`                                  | 기타 store 전역 설정으로, caching의 두 번째 매개변수에 해당합니다.                                                                                                                                     |

#### 기본 `options`

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // 전역 설정
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

`options` 매개변수는 기본 options와 병합됩니다. 기본 options에 이미 존재하는 속성은 생략할 수 있습니다. 예를 들어:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore는 이미 기본 options에 제공되어 있으므로, redisStore 설정만 제공하면 됩니다.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

새로운 캐싱 방식을 등록합니다. 예를 들어:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // store의 고유 식별자
  name: 'redis',
  // store를 생성하는 팩토리 메서드
  store: redisStore,
  // store 연결 닫기
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // 전역 설정
  url: 'xxx',
});
```

#### 시그니처

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

캐시를 생성합니다. 예를 들어:

```ts
await cacheManager.createCache({
  name: 'default', // cache의 고유 식별자
  store: 'memory', // store의 고유 식별자
  prefix: 'mycache', // 캐시 키에 'mycache:' 접두사를 자동으로 추가합니다 (선택 사항).
  // 기타 store 설정, 사용자 정의 설정은 store 전역 설정과 병합됩니다.
  max: 2000,
});
```

#### 시그니처

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### 상세 정보

##### options

| 속성            | 타입     | 설명                                           |
| --------------- | -------- | ---------------------------------------------- |
| `name`          | `string` | cache의 고유 식별자                            |
| `store`         | `string` | store의 고유 식별자                            |
| `prefix`        | `string` | 선택 사항, 캐시 키 접두사                      |
| `[key: string]` | `any`    | store와 관련된 기타 사용자 정의 설정 항목      |

`store`를 생략하면 `defaultStore`가 사용됩니다. 이 경우 캐싱 방식은 시스템의 기본 캐싱 방식 변경에 따라 달라집니다.

사용자 정의 설정이 없는 경우, 전역 설정으로 생성되고 현재 캐싱 방식이 공유하는 기본 캐시 공간이 반환됩니다. 키 충돌을 피하기 위해 `prefix`를 추가하는 것을 권장합니다.

```ts
// 기본 캐시 사용, 전역 설정 적용
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

[Cache](./cache.md)를 참조하세요.

### `getCache()`

해당 캐시를 가져옵니다.

```ts
cacheManager.getCache('default');
```

#### 시그니처

- `getCache(name: string): Cache`

### `flushAll()`

모든 캐시를 재설정합니다.

```ts
await cacheManager.flushAll();
```

### `close()`

모든 캐시 미들웨어 연결을 닫습니다.

```ts
await cacheManager.close();
```