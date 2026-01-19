:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# CacheManager

## ภาพรวม

CacheManager สร้างขึ้นบนพื้นฐานของ <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> เพื่อจัดการโมดูล Cache ให้กับ NocoBase ครับ/ค่ะ ประเภท Cache ที่มีมาให้ในตัว ได้แก่

- memory - lru-cache ที่ถูกจัดเตรียมมาให้โดยค่าเริ่มต้นจาก node-cache-manager
- redis - รองรับการทำงานโดย node-cache-manager-redis-yet

สามารถลงทะเบียนและขยายประเภทเพิ่มเติมได้ผ่าน API ครับ/ค่ะ

### แนวคิดสำคัญ

- **Store**: กำหนดวิธีการแคช ซึ่งประกอบด้วยเมธอด Factory สำหรับสร้างแคช และการตั้งค่าอื่นๆ ที่เกี่ยวข้อง วิธีการแคชแต่ละแบบจะมีตัวระบุเฉพาะ (Unique Identifier) ที่ต้องระบุตอนลงทะเบียนครับ/ค่ะ
  ตัวระบุเฉพาะสำหรับวิธีการแคชสองแบบที่มีมาให้ในตัวคือ `memory` และ `redis` ครับ/ค่ะ

- **เมธอด Factory ของ Store**: เป็นเมธอดที่จัดเตรียมโดย `node-cache-manager` และแพ็กเกจส่วนขยายที่เกี่ยวข้อง เพื่อใช้สร้างแคชครับ/ค่ะ ตัวอย่างเช่น `'memory'` ที่จัดเตรียมมาให้โดยค่าเริ่มต้นจาก `node-cache-manager` และ `redisStore` ที่จัดเตรียมโดย `node-cache-manager-redis-yet` เป็นต้น ซึ่งก็คือพารามิเตอร์แรกของเมธอด `caching` ใน `node-cache-manager` ครับ/ค่ะ

- **Cache**: เป็นคลาสที่ NocoBase ห่อหุ้มไว้ ซึ่งมีเมธอดที่เกี่ยวข้องกับการใช้งานแคชครับ/ค่ะ เมื่อใช้งานแคชจริง ๆ จะเป็นการทำงานกับอินสแตนซ์ของ `Cache` อินสแตนซ์ของ `Cache` แต่ละตัวจะมีตัวระบุเฉพาะ ซึ่งสามารถใช้เป็น Namespace เพื่อแยกความแตกต่างของโมดูลต่างๆ ได้ครับ/ค่ะ

## เมธอดของคลาส

### `constructor()`

#### Signature

- `constructor(options?: CacheManagerOptions)`

#### Types

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

#### รายละเอียด

##### CacheManagerOptions

| คุณสมบัติ       | ประเภท                           | คำอธิบาย                                                                                                                                                                                                                         |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | ตัวระบุเฉพาะสำหรับประเภท Cache เริ่มต้น                                                                                                                                                                                             |
| `stores`       | `Record<string, StoreOptions>` | ใช้ลงทะเบียนประเภท Cache โดย Key คือตัวระบุเฉพาะของประเภท Cache และ Value คือออบเจกต์ที่ประกอบด้วยเมธอดการลงทะเบียนและ Global Configuration สำหรับประเภท Cache นั้นๆ ครับ/ค่ะ<br />ใน `node-cache-manager` เมธอดสำหรับสร้างแคชคือ `await caching(store, config)` ส่วนออบเจกต์ที่จะต้องระบุในที่นี้คือ [`StoreOptions`](#storeoptions) |

##### StoreOptions

| คุณสมบัติ        | ประเภท                                   | คำอธิบาย                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | เมธอด Factory ของ Store ซึ่งตรงกับพารามิเตอร์แรกของ `caching`                                                                                                                                        |
| `close`         | `(store: Store) => Promise<void>`      | ไม่บังคับครับ/ค่ะ หากเป็น Middleware ที่ต้องมีการสร้าง Connection เช่น Redis จำเป็นต้องระบุเมธอด Callback สำหรับปิด Connection โดยมีพารามิเตอร์เป็นออบเจกต์ที่เมธอด Factory ของ Store ส่งกลับมา |
| `[key: string]` | `any`                                  | Global Configuration อื่นๆ ของ Store ซึ่งตรงกับพารามิเตอร์ที่สองของ `caching`                                                                                                               |

#### ค่า `options` เริ่มต้น

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

พารามิเตอร์ `options` จะถูกรวมเข้ากับค่า `options` เริ่มต้นครับ/ค่ะ คุณสมบัติที่มีอยู่แล้วในค่า `options` เริ่มต้นสามารถละเว้นได้ ตัวอย่างเช่น:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore มีให้ในค่า options เริ่มต้นอยู่แล้ว คุณจึงเพียงแค่ระบุการตั้งค่า redisStore เท่านั้นครับ/ค่ะ
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

ใช้ลงทะเบียนวิธีการแคชแบบใหม่ครับ/ค่ะ ตัวอย่างเช่น:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // ตัวระบุเฉพาะของ Store
  name: 'redis',
  // เมธอด Factory สำหรับสร้าง Store
  store: redisStore,
  // ปิด Connection ของ Store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // Global Configuration
  url: 'xxx',
});
```

#### Signature

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

ใช้สร้างแคชครับ/ค่ะ ตัวอย่างเช่น:

```ts
await cacheManager.createCache({
  name: 'default', // ตัวระบุเฉพาะของ Cache
  store: 'memory', // ตัวระบุเฉพาะของ Store
  prefix: 'mycache', // จะเพิ่ม Prefix 'mycache:' ให้กับ Cache Key โดยอัตโนมัติ (ไม่บังคับ)
  // การตั้งค่า Store อื่นๆ (Custom Configuration) ซึ่งจะถูกรวมเข้ากับ Global Configuration ของ Store
  max: 2000,
});
```

#### Signature

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### รายละเอียด

##### options

| คุณสมบัติ        | ประเภท     | คำอธิบาย                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `name`          | `string` | ตัวระบุเฉพาะของ Cache                                |
| `store`         | `string` | ตัวระบุเฉพาะของ Store                                |
| `prefix`        | `string` | ไม่บังคับ, Prefix สำหรับ Cache Key                   |
| `[key: string]` | `any`    | รายการ Custom Configuration อื่นๆ ที่เกี่ยวข้องกับ Store |

หากละเว้น `store` จะใช้ `defaultStore` แทนครับ/ค่ะ ในกรณีนี้ วิธีการแคชจะเปลี่ยนแปลงไปตามวิธีการแคชเริ่มต้นของระบบครับ/ค่ะ

เมื่อไม่มี Custom Configuration จะส่งคืน Default Cache Space ที่สร้างขึ้นจาก Global Configuration และถูกแชร์โดยวิธีการแคชปัจจุบันครับ/ค่ะ แนะนำให้เพิ่ม `prefix` เพื่อหลีกเลี่ยง Key ที่ซ้ำกันครับ/ค่ะ

```ts
// ใช้ Cache เริ่มต้น โดยใช้ Global Configuration
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

ดูเพิ่มเติมที่ [Cache](./cache.md)

### `getCache()`

ใช้สำหรับดึง Cache ที่เกี่ยวข้องครับ/ค่ะ

```ts
cacheManager.getCache('default');
```

#### Signature

- `getCache(name: string): Cache`

### `flushAll()`

ใช้สำหรับรีเซ็ต Cache ทั้งหมดครับ/ค่ะ

```ts
await cacheManager.flushAll();
```

### `close()`

ใช้สำหรับปิด Connection ของ Cache Middleware ทั้งหมดครับ/ค่ะ

```ts
await cacheManager.close();
```